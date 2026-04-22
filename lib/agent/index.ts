import OpenAI from "openai";
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

    const openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY!,
      defaultHeaders: {
        "HTTP-Referer": "https://reposage.vercel.app",
        "X-Title": "RepoSage",
      },
    });

    onStepUpdate({
      id: "analyze",
      name: "AI Agent analyzing codebase",
      status: "running",
    });

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: ANALYSIS_PROMPT(context) },
    ];
    let isComplete = false;
    let analysisResult: Partial<AnalysisResult> = {};
    let iterationCount = 0;
    const MAX_ITERATIONS = 15;

    while (!isComplete && iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      const response = await openrouter.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
        max_tokens: 4000,
      });

      const message = response.choices[0].message;
      messages.push(message);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        break;
      }

      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        onStepUpdate({
          id: toolName,
          name: "Agent: " + toolName.replace(/_/g, " "),
          status: "running",
        });

        const toolResult = await executeToolCall(toolName, toolArgs, context);

        onStepUpdate({
          id: toolName,
          name: "Agent: " + toolName.replace(/_/g, " "),
          status: "complete",
        });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult.result,
        });

        if (toolResult.isComplete) {
          isComplete = true;
          analysisResult = toolResult.analysisResult || {};
          break;
        }
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
