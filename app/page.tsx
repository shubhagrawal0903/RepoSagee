"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  useAuth,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { useRepoAnalysis } from "@/hooks/useRepoAnalysis";

const exampleRepos = [
  "https://github.com/vercel/next.js",
  "https://github.com/prisma/prisma",
  "https://github.com/t3-oss/create-t3-app",
];

const features = [
  {
    title: "File Structure",
    description: "Understand every folder and file instantly",
  },
  {
    title: "Tech Stack Detection",
    description: "Automatically identifies frameworks, ORMs, libraries",
  },
  {
    title: "Onboarding Guide",
    description: "Get a step-by-step guide like a senior dev wrote it",
  },
];

export default function HomePage() {
  const { userId } = useAuth();
  const { url, setUrl, isLoading, error, repoData, treeData, step, analyzeRepo } =
    useRepoAnalysis();
  const totalFiles = treeData?.filter((item) => item.type === "blob").length ?? 0;
  const totalFolders = treeData?.filter((item) => item.type === "tree").length ?? 0;
  const topPaths = treeData?.slice(0, 10) ?? [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <p className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-2xl font-bold text-transparent">
            RepoSage
          </p>
          <div className="flex items-center gap-3">
            {!userId ? (
              <>
              <SignInButton mode="modal">
                <button className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-linear-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-purple-400 hover:to-blue-400">
                  Sign Up
                </button>
              </SignUpButton>
              </>
            ) : (
              <>
              <Link
                href="/dashboard"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
              </>
            )}
          </div>
        </nav>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-12 text-center">
          <span className="mb-5 inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm font-medium text-purple-200">
            AI-Powered Repo Analysis
          </span>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Understand any codebase in minutes
          </h1>

          <p className="mt-5 max-w-2xl text-base text-zinc-300 sm:text-lg">
            Paste a GitHub repo URL and get an instant onboarding guide generated
            by AI - like a senior dev walking you through the code
          </p>

          <form
            className="mt-8 w-full"
            onSubmit={(event) => {
              event.preventDefault();
              void analyzeRepo(url);
            }}
          >
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="h-12 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 px-6 text-sm font-semibold text-white transition hover:from-purple-400 hover:to-blue-400"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Repo"
                )}
              </button>
            </div>
            {error ? <p className="mt-3 text-left text-sm text-red-400">{error}</p> : null}
            {isLoading && step ? (
              <p className="mt-3 text-left text-sm text-zinc-300">{step}</p>
            ) : null}
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {exampleRepos.map((repo) => (
              <a
                key={repo}
                href={repo}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-purple-400 hover:text-white"
              >
                {repo}
              </a>
            ))}
          </div>
        </section>

        {repoData ? (
          <section className="mx-auto mt-2 w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-2xl font-bold text-white">{repoData.full_name}</h2>
            <p className="mt-2 text-zinc-300">
              {repoData.description ?? "No description provided."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1">
                {repoData.language ?? "Unknown"}
              </span>
              <span className="text-zinc-200">⭐ {repoData.stars}</span>
              <span className="text-zinc-200">🍴 {repoData.forks}</span>
              <span className="text-zinc-200">
                Default branch: {repoData.default_branch}
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
        ) : null}

        {treeData ? (
          <section className="mx-auto mt-4 w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-200">
              <p>Total files: {totalFiles}</p>
              <p>Total folders: {totalFolders}</p>
            </div>
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="mb-3 text-sm font-medium text-zinc-300">Top 10 file paths</p>
              <ul className="space-y-1 font-mono text-xs text-zinc-200">
                {topPaths.map((item) => (
                  <li key={item.sha}>{item.path}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 pb-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"
            >
              <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
              <p className="mt-2 text-sm text-zinc-300">{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
