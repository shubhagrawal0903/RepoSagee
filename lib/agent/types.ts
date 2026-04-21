import type { RepoMetadata, TreeItem } from "@/lib/github/types";

export type AnalysisStatus = "pending" | "analyzing" | "complete" | "error";

export interface AgentStep {
  id: string;
  name: string;
  status: "pending" | "running" | "complete" | "error";
  result?: string;
}

export interface TechStack {
  frameworks: string[];
  languages: string[];
  orms: string[];
  auth: string[];
  databases: string[];
  styling: string[];
  testing: string[];
  devtools: string[];
  other: string[];
}

export interface KeyFile {
  path: string;
  purpose: string;
  importance: "critical" | "important" | "helpful";
}

export interface ArchitectureDiagram {
  mermaid: string;
  description: string;
}

export interface OnboardingSection {
  title: string;
  content: string;
  order: number;
}

export interface AnalysisResult {
  repoUrl: string;
  repoName: string;
  techStack: TechStack;
  keyFiles: KeyFile[];
  architecture: ArchitectureDiagram;
  onboardingSections: OnboardingSection[];
  summary: string;
  whereToStart: string;
  estimatedComplexity: "simple" | "moderate" | "complex";
  createdAt: Date;
}

export interface AgentContext {
  owner: string;
  repo: string;
  branch: string;
  tree: TreeItem[];
  repoMetadata: RepoMetadata;
  packageJson: Record<string, any> | null;
  readme: string | null;
  fetchedFiles: Record<string, string>;
}
