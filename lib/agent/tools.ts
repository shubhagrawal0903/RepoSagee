import { githubClient } from "@/lib/github/client";
import type {
  AgentContext,
  AnalysisResult,
  OnboardingSection,
  TechStack,
} from "@/lib/agent/types";

type ToolExecutionResult = {
  result: string;
  isComplete?: boolean;
  analysisResult?: Partial<AnalysisResult>;
};

const TECH_STACK_PROPERTIES = {
  frameworks: { type: "array", items: { type: "string" } },
  languages: { type: "array", items: { type: "string" } },
  orms: { type: "array", items: { type: "string" } },
  auth: { type: "array", items: { type: "string" } },
  databases: { type: "array", items: { type: "string" } },
  styling: { type: "array", items: { type: "string" } },
  testing: { type: "array", items: { type: "string" } },
  devtools: { type: "array", items: { type: "string" } },
  other: { type: "array", items: { type: "string" } },
};

export const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "fetch_file",
      description: "Fetch the content of a specific file from the repository",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path relative to repo root",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_multiple_files",
      description: "Fetch contents of multiple files at once",
      parameters: {
        type: "object",
        properties: {
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Array of file paths to fetch",
          },
        },
        required: ["paths"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_tech_stack",
      description:
        "Analyze package.json and config files to identify the complete tech stack",
      parameters: {
        type: "object",
        properties: {
          focus_areas: {
            type: "array",
            items: { type: "string" },
            description:
              "Specific areas to focus on like auth, database, styling",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "identify_entry_points",
      description:
        "Identify the main entry points and important files in the codebase",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_mermaid_diagram",
      description:
        "Generate a Mermaid architecture diagram based on the analyzed codebase",
      parameters: {
        type: "object",
        properties: {
          diagram_type: {
            type: "string",
            description: "flowchart or graph",
          },
          focus: {
            type: "string",
            description:
              "What aspect to diagram — data flow, component tree, api routes",
          },
        },
        required: ["diagram_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_analysis",
      description: "Mark analysis as complete and return the final structured result",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "2-3 sentence repo summary",
          },
          tech_stack: {
            type: "object",
            properties: TECH_STACK_PROPERTIES,
            required: Object.keys(TECH_STACK_PROPERTIES),
          },
          key_files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                purpose: { type: "string" },
                importance: { type: "string" },
              },
              required: ["path", "purpose", "importance"],
            },
          },
          mermaid_diagram: {
            type: "string",
            description: "Valid mermaid diagram code",
          },
          diagram_description: {
            type: "string",
          },
          onboarding_sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                order: { type: "number" },
              },
              required: ["title", "content", "order"],
            },
          },
          where_to_start: {
            type: "string",
            description: "Step by step guide for day 1",
          },
          estimated_complexity: {
            type: "string",
            description: "simple | moderate | complex",
          },
        },
        required: [
          "summary",
          "tech_stack",
          "key_files",
          "mermaid_diagram",
          "diagram_description",
          "onboarding_sections",
          "where_to_start",
          "estimated_complexity",
        ],
      },
    },
  },
];

async function fetchFileWithCache(path: string, context: AgentContext) {
  if (context.fetchedFiles[path]) {
    return context.fetchedFiles[path];
  }

  const file = await githubClient.getFileContent(context.owner, context.repo, path);
  context.fetchedFiles[path] = file.content;
  return file.content;
}

function normalizeTechStack(input: unknown): TechStack {
  const value = typeof input === "object" && input !== null ? input : {};
  const source = value as Record<string, unknown>;

  const toStringArray = (field: string): string[] =>
    Array.isArray(source[field])
      ? source[field].filter((item): item is string => typeof item === "string")
      : [];

  return {
    frameworks: toStringArray("frameworks"),
    languages: toStringArray("languages"),
    orms: toStringArray("orms"),
    auth: toStringArray("auth"),
    databases: toStringArray("databases"),
    styling: toStringArray("styling"),
    testing: toStringArray("testing"),
    devtools: toStringArray("devtools"),
    other: toStringArray("other"),
  };
}

function buildSimpleMermaidFromTree(context: AgentContext): string {
  const topLevel = new Map<string, "file" | "folder">();

  for (const item of context.tree) {
    const root = item.path.split("/")[0];
    if (!root) {
      continue;
    }
    const current = topLevel.get(root);
    if (!current || item.type === "tree") {
      topLevel.set(root, item.type === "tree" ? "folder" : "file");
    }
  }

  const lines = ["flowchart TD", "  R[Repo Root]"];
  let index = 0;

  for (const [name, kind] of topLevel.entries()) {
    const id = `N${index++}`;
    const label = `${name}${kind === "folder" ? "/" : ""}`.replace(/"/g, "");
    lines.push(`  R --> ${id}["${label}"]`);
  }

  return lines.join("\n");
}

export async function executeToolCall(
  toolName: string,
  toolArgs: Record<string, any>,
  context: AgentContext,
): Promise<ToolExecutionResult> {
  try {
    switch (toolName) {
      case "fetch_file": {
        const path = typeof toolArgs.path === "string" ? toolArgs.path : "";
        if (!path) {
          return { result: "Invalid path argument" };
        }

        try {
          const content = await fetchFileWithCache(path, context);
          return { result: `File content of ${path}:\n${content}` };
        } catch {
          return { result: `File not found: ${path}` };
        }
      }

      case "fetch_multiple_files": {
        const paths = Array.isArray(toolArgs.paths)
          ? toolArgs.paths.filter((path): path is string => typeof path === "string")
          : [];

        if (paths.length === 0) {
          return { result: "No valid paths provided" };
        }

        const sections: string[] = [];
        for (const path of paths) {
          try {
            const content = await fetchFileWithCache(path, context);
            sections.push(`=== ${path} ===\n${content}`);
          } catch {
            sections.push(`=== ${path} ===\nFile not found`);
          }
        }

        return { result: sections.join("\n\n") };
      }

      case "analyze_tech_stack": {
        const packageJson = context.packageJson ?? {};
        const dependencies = packageJson.dependencies ?? {};
        const devDependencies = packageJson.devDependencies ?? {};
        const scripts = packageJson.scripts ?? {};
        const fetchedConfigFiles = Object.keys(context.fetchedFiles).filter((path) =>
          /(config|\.rc|tsconfig|eslint|prettier|tailwind|docker|compose|prisma|vite|next)/i.test(
            path,
          ),
        );

        return {
          result: JSON.stringify(
            {
              focus_areas: Array.isArray(toolArgs.focus_areas)
                ? toolArgs.focus_areas
                : [],
              dependencies,
              devDependencies,
              scripts,
              fetchedConfigFiles,
            },
            null,
            2,
          ),
        };
      }

      case "identify_entry_points": {
        const importantFiles = [
          "app/page.tsx",
          "app/layout.tsx",
          "pages/index.tsx",
          "src/index.ts",
          "src/main.ts",
          "server.ts",
          "index.ts",
          "prisma/schema.prisma",
          ".env.example",
          "docker-compose.yml",
        ];

        const treeSet = new Set(context.tree.map((item) => item.path));
        const found = importantFiles.filter((file) => treeSet.has(file));

        return {
          result: `Found entry points: ${
            found.length > 0 ? found.join(", ") : "none"
          }`,
        };
      }

      case "generate_mermaid_diagram": {
        const diagram = buildSimpleMermaidFromTree(context);
        return { result: diagram };
      }

      case "complete_analysis": {
        const analysisResult: Partial<AnalysisResult> = {
          repoUrl: context.repoMetadata.html_url,
          repoName: context.repoMetadata.full_name,
          techStack: normalizeTechStack(toolArgs.tech_stack),
          keyFiles: Array.isArray(toolArgs.key_files) ? toolArgs.key_files : [],
          architecture: {
            mermaid:
              typeof toolArgs.mermaid_diagram === "string"
                ? toolArgs.mermaid_diagram
                : "",
            description:
              typeof toolArgs.diagram_description === "string"
                ? toolArgs.diagram_description
                : "",
          },
          onboardingSections: (Array.isArray(toolArgs.onboarding_sections)
            ? toolArgs.onboarding_sections
            : []) as OnboardingSection[],
          summary: typeof toolArgs.summary === "string" ? toolArgs.summary : "",
          whereToStart:
            typeof toolArgs.where_to_start === "string"
              ? toolArgs.where_to_start
              : "",
          estimatedComplexity:
            toolArgs.estimated_complexity === "simple" ||
            toolArgs.estimated_complexity === "moderate" ||
            toolArgs.estimated_complexity === "complex"
              ? toolArgs.estimated_complexity
              : "moderate",
          createdAt: new Date(),
        };

        return {
          result: "Analysis complete",
          isComplete: true,
          analysisResult,
        };
      }

      default:
        return { result: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return {
      result:
        error instanceof Error
          ? `Tool execution failed: ${error.message}`
          : "Tool execution failed",
    };
  }
}
