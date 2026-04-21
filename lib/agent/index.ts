import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AgentContext, AgentStep, AnalysisResult, TechStack } from "@/lib/agent/types";
import { AGENT_TOOLS, executeToolCall } from "@/lib/agent/tools";
import { SYSTEM_PROMPT, ANALYSIS_PROMPT } from "@/lib/agent/prompts";
import { githubClient } from "@/lib/github/client";
import { parseGithubUrl } from "@/lib/utils/parseGithubUrl";

function getDefaultTechStack(): TechStack {
  return {
    frameworks: [],
    languages: [],
    orms: [],
    auth: [],
    databases: [],
    styling: [],
    testing: [],
    devtools: [],
    other: [],
  };
}

export async function runRepoSageAgent(
  repoUrl: string,
  onStepUpdate: (step: AgentStep) => void,
): Promise<AnalysisResult> {
  try {
    const { owner, repo } = parseGithubUrl(repoUrl);

    onStepUpdate({
      id: "fetch",
      name: "Fetching repository data",
      status: "running",
    });

    const repoPromise = githubClient.getRepo(owner, repo);
    const treePromise = repoPromise.then((repoMetadata) =>
      githubClient.getFileTree(owner, repo, repoMetadata.default_branch),
    );
    const packageJsonPromise = repoPromise.then((repoMetadata) =>
      githubClient.getPackageJson(owner, repo, repoMetadata.default_branch),
    );
    const readmePromise = githubClient.getReadme(owner, repo);

    const [repoMetadata, tree, packageJson, readme] = await Promise.all([
      repoPromise,
      treePromise,
      packageJsonPromise,
      readmePromise,
    ]);

    onStepUpdate({
      id: "fetch",
      name: "Fetching repository data",
      status: "complete",
    });

    const context: AgentContext = {
      owner,
      repo,
      branch: repoMetadata.default_branch,
      tree,
      repoMetadata,
      packageJson,
      readme,
      fetchedFiles: {},
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: AGENT_TOOLS }],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
    });

    const chat = model.startChat();
    const initialPrompt = ANALYSIS_PROMPT(context);

    onStepUpdate({
      id: "analyze",
      name: "AI Agent analyzing codebase",
      status: "running",
    });

    let response = await chat.sendMessage(initialPrompt);
    let isComplete = false;
    let analysisResult: Partial<AnalysisResult> = {};
    let iterationCount = 0;
    const MAX_ITERATIONS = 15;

    // AGENTIC LOOP: Gemini autonomously decides which tools to call
    // based on previous results until analysis is complete
    while (!isComplete && iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      const parts = response.response.candidates?.[0]?.content?.parts ?? [];
      let hasFunctionCall = false;
      let hasText = false;

      for (const part of parts) {
        if ("text" in part && part.text) {
          hasText = true;
          console.log("[RepoSage]", part.text);
        }

        if ("functionCall" in part && part.functionCall) {
          hasFunctionCall = true;
          const toolName = part.functionCall.name;
          const toolArgs = (part.functionCall.args as Record<string, any>) ?? {};

          onStepUpdate({
            id: toolName,
            name: `Agent: calling ${toolName}`,
            status: "running",
          });

          const toolResult = await executeToolCall(toolName, toolArgs, context);

          onStepUpdate({
            id: toolName,
            name: `Agent: ${toolName} complete`,
            status: "complete",
          });

          if (toolResult.isComplete) {
            isComplete = true;
            analysisResult = toolResult.analysisResult ?? {};
            break;
          }

          response = await chat.sendMessage([
            {
              functionResponse: {
                name: toolName,
                response: { result: toolResult.result },
              },
            },
          ]);
        }
      }

      if (!hasFunctionCall && !hasText) {
        break;
      }
    }

    onStepUpdate({
      id: "analyze",
      name: "Analysis complete",
      status: "complete",
    });

    return {
      repoUrl: analysisResult.repoUrl ?? repoUrl,
      repoName: analysisResult.repoName ?? `${owner}/${repo}`,
      techStack: analysisResult.techStack ?? getDefaultTechStack(),
      keyFiles: analysisResult.keyFiles ?? [],
      architecture: analysisResult.architecture ?? {
        mermaid: "flowchart TD\n  A[Repository] --> B[Codebase]",
        description: "High-level repository structure.",
      },
      onboardingSections: analysisResult.onboardingSections ?? [],
      summary: analysisResult.summary ?? "Analysis completed.",
      whereToStart:
        analysisResult.whereToStart ?? "Start with README, then follow entry points.",
      estimatedComplexity: analysisResult.estimatedComplexity ?? "moderate",
      createdAt: analysisResult.createdAt ?? new Date(),
    };
  } catch (error) {
    onStepUpdate({
      id: "analyze",
      name: "Analysis failed",
      status: "error",
      result: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
