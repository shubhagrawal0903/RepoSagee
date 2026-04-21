import axios, { AxiosError, AxiosInstance } from "axios";
import type { FileContent, RepoMetadata, RepoTree, TreeItem } from "./types";

const EXCLUDED_PATH_PARTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "coverage",
  ".cache",
]);

export class GitHubClient {
  private readonly client: AxiosInstance;

  constructor() {
    const token = process.env.GITHUB_TOKEN;

    this.client = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async getRepo(owner: string, repo: string): Promise<RepoMetadata> {
    try {
      const { data } = await this.client.get(`/repos/${owner}/${repo}`);

      return {
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        default_branch: data.default_branch,
        language: data.language,
        topics: Array.isArray(data.topics) ? data.topics : [],
        visibility: data.visibility,
        updated_at: data.updated_at,
        html_url: data.html_url,
      };
    } catch (error) {
      this.handleCommonErrors(error);
      throw error;
    }
  }

  async getFileTree(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<TreeItem[]> {
    try {
      const { data } = await this.client.get<RepoTree>(
        `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      );

      return data.tree.filter((item) => {
        const parts = item.path.split("/");
        return !parts.some((part) => EXCLUDED_PATH_PARTS.has(part));
      });
    } catch (error) {
      this.handleCommonErrors(error);
      throw error;
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
  ): Promise<FileContent> {
    try {
      const { data } = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`);
      const decodedContent = Buffer.from(data.content, "base64").toString("utf-8");

      return {
        path: data.path,
        content: decodedContent,
        size: data.size,
        encoding: data.encoding,
      };
    } catch (error) {
      this.handleCommonErrors(error);
      throw error;
    }
  }

  async getPackageJson(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<Record<string, any> | null> {
    void branch;

    try {
      const file = await this.getFileContent(owner, repo, "package.json");
      return JSON.parse(file.content) as Record<string, any>;
    } catch (error) {
      if (this.isAxiosStatus(error, 404)) {
        return null;
      }

      return null;
    }
  }

  async getReadme(owner: string, repo: string): Promise<string | null> {
    const readmeCandidates = ["README.md", "readme.md", "README.MD"];

    for (const fileName of readmeCandidates) {
      try {
        const file = await this.getFileContent(owner, repo, fileName);
        return file.content;
      } catch (error) {
        if (this.isAxiosStatus(error, 404)) {
          continue;
        }
      }
    }

    return null;
  }

  private handleCommonErrors(error: unknown): void {
    if (this.isAxiosStatus(error, 404)) {
      throw new Error("Repository not found");
    }

    if (this.isAxiosStatus(error, 403)) {
      throw new Error("GitHub API rate limit exceeded");
    }
  }

  private isAxiosStatus(error: unknown, statusCode: number): boolean {
    return (
      axios.isAxiosError(error) &&
      (error as AxiosError).response?.status === statusCode
    );
  }
}

export const githubClient = new GitHubClient();
