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
    const tree = await githubClient.getFileTree(owner, repo, repoMetadata.default_branch);

    const totalFiles = tree.filter((item) => item.type === "blob").length;
    const totalFolders = tree.filter((item) => item.type === "tree").length;

    return NextResponse.json(
      {
        tree,
        totalFiles,
        totalFolders,
        branch: repoMetadata.default_branch,
      },
      { status: 200 },
    );
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
