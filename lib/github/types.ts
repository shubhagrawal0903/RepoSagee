export interface RepoMetadata {
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  default_branch: string;
  language: string | null;
  topics: string[];
  visibility: string;
  updated_at: string;
  html_url: string;
}

export interface TreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface RepoTree {
  sha: string;
  tree: TreeItem[];
  truncated: boolean;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  encoding: string;
}
