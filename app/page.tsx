import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

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

export default async function HomePage() {
  const { userId } = await auth();

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

          <form className="mt-8 w-full">
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                type="url"
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
