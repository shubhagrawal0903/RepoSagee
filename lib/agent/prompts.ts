import type { AgentContext } from "./types";
import type { RepoMetadata, TreeItem } from "@/lib/github/types";

export const SYSTEM_PROMPT = `You are RepoSage, an expert AI agent that analyzes GitHub repositories.
You have access to tools to fetch file contents from the repo.
Your goal is to analyze the codebase and produce a comprehensive onboarding guide for new developers.
Always use tools to fetch important files before making conclusions.
Be thorough — check package.json, config files, main entry points, database schemas, auth setup, and architecture patterns.
Think step by step like a senior developer doing a code review.`;

function getTreePreview(tree: TreeItem[]): string {
  return tree
    .slice(0, 80)
    .map((item) => item.path)
    .join("\n");
}

function getDependencyPreview(packageJson: AgentContext["packageJson"]): string {
  if (!packageJson) {
    return "Not available";
  }

  return JSON.stringify(
    {
      dependencies: packageJson.dependencies ?? {},
      devDependencies: packageJson.devDependencies ?? {},
    },
    null,
    2,
  );
}

function getReadmePreview(readme: string | null): string {
  if (!readme) {
    return "Not available";
  }

  return readme.slice(0, 500);
}

function getMetadataLine(metadata: RepoMetadata): string {
  return `- Language: ${metadata.language ?? "Unknown"}
- Stars: ${metadata.stars}
- Description: ${metadata.description ?? "No description"}`;
}

export function ANALYSIS_PROMPT(context: AgentContext): string {
  return `Analyze this GitHub repository: ${context.owner}/${context.repo}

Repository metadata:
${getMetadataLine(context.repoMetadata)}

File tree (first 80 files):
${getTreePreview(context.tree)}

Package.json dependencies:
${getDependencyPreview(context.packageJson)}

README preview (first 500 chars):
${getReadmePreview(context.readme)}

Now analyze this repository completely. Use the fetch_file tool
to read important files. Then provide:
1. Complete tech stack breakdown
2. Key files and their purposes
3. Architecture overview as a Mermaid diagram
4. Onboarding guide for a new developer
5. Where to start reading the code
6. Overall complexity assessment`;
}
