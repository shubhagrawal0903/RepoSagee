"use client";

import { useState } from "react";
import type { RepoMetadata, TreeItem } from "@/lib/github/types";
import { isValidGithubUrl } from "@/lib/utils/parseGithubUrl";

type RepoResponse = {
  repo: RepoMetadata;
};

type TreeResponse = {
  tree: TreeItem[];
};

export function useRepoAnalysis() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoData, setRepoData] = useState<RepoMetadata | null>(null);
  const [treeData, setTreeData] = useState<TreeItem[] | null>(null);
  const [step, setStep] = useState("");

  const analyzeRepo = async (inputUrl: string) => {
    const trimmedUrl = inputUrl.trim();

    if (!isValidGithubUrl(trimmedUrl)) {
      setError("Invalid GitHub URL");
      setRepoData(null);
      setTreeData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setRepoData(null);
    setTreeData(null);

    try {
      setStep("Fetching repository info...");
      const repoResponse = await fetch("/api/github/repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const repoPayload = (await repoResponse.json()) as
        | RepoResponse
        | { error?: string };

      if (!repoResponse.ok) {
        throw new Error(
          "error" in repoPayload && repoPayload.error
            ? repoPayload.error
            : "Failed to fetch repository info",
        );
      }

      setStep("Fetching file structure...");
      const treeResponse = await fetch("/api/github/tree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const treePayload = (await treeResponse.json()) as
        | TreeResponse
        | { error?: string };

      if (!treeResponse.ok) {
        throw new Error(
          "error" in treePayload && treePayload.error
            ? treePayload.error
            : "Failed to fetch file tree",
        );
      }

      setRepoData(repoPayload.repo);
      setTreeData(treePayload.tree);
      setStep("");
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    url,
    setUrl,
    isLoading,
    error,
    repoData,
    treeData,
    step,
    analyzeRepo,
  };
}
