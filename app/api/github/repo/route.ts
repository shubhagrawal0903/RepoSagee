import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { githubClient } from "@/lib/github/client";
import { isValidGithubUrl, parseGithubUrl } from "@/lib/utils/parseGithubUrl";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isValidGithubUrl(url)) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo } = parseGithubUrl(url);
    const repoMetadata = await githubClient.getRepo(owner, repo);

    return NextResponse.json({ repo: repoMetadata }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("not found")) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: "GitHub rate limit exceeded" },
        { status: 429 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
