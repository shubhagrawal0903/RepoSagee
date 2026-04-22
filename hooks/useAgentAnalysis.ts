"use client";

import { useState } from "react";
import type { AgentStep, AnalysisResult } from "@/lib/agent/types";

export function useAgentAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState("");

  const startAnalysis = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setSteps([]);
    setResult(null);
    setCurrentStep("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? "Failed to start analysis");
      }

      if (!response.body) {
        throw new Error("Streaming not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = chunk
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

          const eventLine = lines.find((line) => line.startsWith("event:"));
          const dataLine = lines.find((line) => line.startsWith("data:"));

          if (!eventLine || !dataLine) {
            continue;
          }

          const eventName = eventLine.replace("event:", "").trim();
          const json = dataLine.replace("data:", "").trim();
          const data = JSON.parse(json) as {
            message?: string;
            result?: AnalysisResult;
          } & AgentStep;

          if (eventName === "started") {
            setCurrentStep("Analysis started...");
          } else if (eventName === "step") {
            setSteps((prev) => {
              const exists = prev.findIndex((step) => step.id === data.id);
              if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = data;
                return updated;
              }

              return [...prev, data];
            });
            if (data.name) {
              setCurrentStep(data.name);
            }
          } else if (eventName === "complete") {
            setResult(data.result ?? null);
            setIsLoading(false);
            setCurrentStep("");
          } else if (eventName === "error") {
            setError(data.message ?? "Analysis failed");
            setIsLoading(false);
            setCurrentStep("");
          }
        }
      }
    } catch (streamError) {
      setError(
        streamError instanceof Error ? streamError.message : "Analysis failed",
      );
      setIsLoading(false);
      setCurrentStep("");
    }
  };

  return { isLoading, error, steps, result, currentStep, startAnalysis };
}
