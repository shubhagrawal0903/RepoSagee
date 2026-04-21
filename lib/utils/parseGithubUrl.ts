type ParsedGithubUrl = {
  owner: string;
  repo: string;
};

const HTTPS_GITHUB_REPO_REGEX =
  /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/tree\/[^/\s]+(?:\/.*)?)?\/?$/i;
const SSH_GITHUB_REPO_REGEX = /^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i;

export function parseGithubUrl(url: string): ParsedGithubUrl {
  const trimmedUrl = url.trim();
  const httpsMatch = trimmedUrl.match(HTTPS_GITHUB_REPO_REGEX);
  const sshMatch = trimmedUrl.match(SSH_GITHUB_REPO_REGEX);
  const match = httpsMatch ?? sshMatch;

  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  const owner = match[1];
  const repo = match[2];

  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL");
  }

  return { owner, repo };
}

export function isValidGithubUrl(url: string): boolean {
  try {
    parseGithubUrl(url);
    return true;
  } catch {
    return false;
  }
}

// parseGithubUrl("https://github.com/vercel/next.js") => { owner: "vercel", repo: "next.js" }
// parseGithubUrl("https://github.com/vercel/next.js.git") => { owner: "vercel", repo: "next.js" }
// parseGithubUrl("git@github.com:vercel/next.js.git") => { owner: "vercel", repo: "next.js" }
// parseGithubUrl("https://invalid.com") => throws Error("Invalid GitHub URL")
