"use client";

import { useState } from "react";
import type { RepoMetadata } from "@/lib/github/types";
import { isValidGithubUrl } from "@/lib/utils/parseGithubUrl";
import { useAgentAnalysis } from "@/hooks/useAgentAnalysis";
import { ProgressStream } from "@/components/analysis/ProgressStream";
import { TechStackBadges } from "@/components/analysis/TechStackBadges";
import { ArchitectureDiagram } from "@/components/analysis/ArchitectureDiagram";
import { KeyFilesList } from "@/components/analysis/KeyFilesList";
import { OnboardingGuide } from "@/components/analysis/OnboardingGuide";

const exampleRepos = [
  "https://github.com/vercel/next.js",
  "https://github.com/prisma/prisma",
  "https://github.com/t3-oss/create-t3-app",
];

type TabKey = "overview" | "architecture" | "key-files" | "onboarding";

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [lastUrl, setLastUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [repoData, setRepoData] = useState<RepoMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { isLoading, error, steps, result, currentStep, startAnalysis } =
    useAgentAnalysis();

  const handleAnalyze = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setInputError("URL is required");
      return;
    }

    if (!isValidGithubUrl(trimmedUrl)) {
      setInputError("Invalid GitHub URL");
      return;
    }

    setInputError(null);
    setLastUrl(trimmedUrl);
    setActiveTab("overview");

    const repoResponse = await fetch("/api/github/repo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: trimmedUrl }),
    });

    if (repoResponse.ok) {
      const payload = (await repoResponse.json()) as { repo: RepoMetadata };
      setRepoData(payload.repo);
    }

    await startAnalysis(trimmedUrl);
  };

  const handleRetry = async () => {
    if (lastUrl) {
      setUrl(lastUrl);
      await handleAnalyze();
    }
  };

  const renderTabContent = () => {
    if (!result) {
      return null;
    }

    if (activeTab === "overview") {
      return (
        <section className="space-y-4">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-lg font-semibold text-white">Summary</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{result.summary}</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-lg font-semibold text-white">Tech Stack</h3>
            <div className="mt-4">
              <TechStackBadges techStack={result.techStack} />
            </div>
          </article>
        </section>
      );
    }

    if (activeTab === "architecture") {
      return (
        <ArchitectureDiagram
          mermaid={result.architecture.mermaid}
          description={result.architecture.description}
        />
      );
    }

    if (activeTab === "key-files") {
      return <KeyFilesList keyFiles={result.keyFiles} />;
    }

    return (
      <OnboardingGuide
        sections={result.onboardingSections}
        whereToStart={result.whereToStart}
      />
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white">
        <ProgressStream steps={steps} currentStep={currentStep} isLoading={isLoading} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="text-lg font-semibold text-red-200">Analysis failed</h2>
          <p className="mt-2 text-sm text-red-100">{error}</p>
          <button
            type="button"
            onClick={() => {
              void handleRetry();
            }}
            className="mt-4 rounded-lg bg-linear-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  if (!result || !repoData) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
          <span className="mb-5 inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm font-medium text-purple-200">
            AI-Powered Repo Analysis
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Understand any codebase in minutes
          </h1>
          <p className="mt-4 text-zinc-300">
            Paste a GitHub repo URL and let RepoSage generate a developer onboarding
            guide.
          </p>

          <form
            className="mt-8 w-full"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAnalyze();
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-purple-500"
              />
              <button
                type="submit"
                className="h-12 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 px-6 text-sm font-semibold text-white transition hover:from-purple-400 hover:to-blue-400"
              >
                Analyze Repo
              </button>
            </div>
            {inputError ? <p className="mt-3 text-left text-sm text-red-400">{inputError}</p> : null}
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {exampleRepos.map((repo) => (
              <button
                key={repo}
                type="button"
                onClick={() => setUrl(repo)}
                className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-purple-400 hover:text-white"
              >
                {repo}
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h1 className="text-3xl font-bold text-white">{repoData.full_name}</h1>
          <p className="mt-2 text-zinc-300">
            {repoData.description ?? "No description provided."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1">
              {repoData.language ?? "Unknown"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1">
              ⭐ {repoData.stars}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1">
              {result.estimatedComplexity}
            </span>
          </div>
          <a
            href={repoData.html_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm text-blue-300 underline-offset-4 hover:underline"
          >
            Open on GitHub
          </a>
        </section>

        <section className="border-b border-zinc-800">
          <nav className="flex flex-wrap gap-6">
            {[
              { key: "overview", label: "Overview" },
              { key: "architecture", label: "Architecture" },
              { key: "key-files", label: "Key Files" },
              { key: "onboarding", label: "Onboarding Guide" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`relative pb-3 text-sm font-medium ${
                    isActive ? "text-white" : "text-zinc-400"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-linear-to-r from-purple-500 to-blue-500 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </section>

        {renderTabContent()}
      </div>
    </main>
  );
}
