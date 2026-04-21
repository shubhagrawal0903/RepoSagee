import { auth } from "@clerk/nextjs/server";
import { runRepoSageAgent } from "@/lib/agent";
import type { AgentStep } from "@/lib/agent/types";
import { isValidGithubUrl } from "@/lib/utils/parseGithubUrl";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { url?: string };
  const url = body.url?.trim();

  if (!url) {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  if (!isValidGithubUrl(url)) {
    return Response.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          new TextEncoder().encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      try {
        sendEvent("started", { message: "Analysis started" });

        const result = await runRepoSageAgent(url, (step: AgentStep) => {
          sendEvent("step", step);
        });

        sendEvent("complete", { result });
      } catch (error: unknown) {
        sendEvent("error", {
          message: error instanceof Error ? error.message : "Analysis failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
