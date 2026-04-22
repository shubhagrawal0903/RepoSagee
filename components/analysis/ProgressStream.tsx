"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { AgentStep } from "@/lib/agent/types";

type ProgressStreamProps = {
  steps: AgentStep[];
  currentStep: string;
  isLoading: boolean;
};

export function ProgressStream({
  steps,
  currentStep,
  isLoading,
}: ProgressStreamProps) {
  return (
    <section className="mx-auto mt-4 w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-white">Agent Progress</h3>
        {isLoading ? (
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
        ) : null}
      </div>

      <ul className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li
            key={`${step.id}-${index}`}
            className={`flex items-center gap-2 text-sm ${
              step.status === "running" ? "animate-pulse" : ""
            }`}
          >
            {step.status === "pending" ? (
              <span className="text-zinc-400">○</span>
            ) : null}
            {step.status === "running" ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            ) : null}
            {step.status === "complete" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : null}
            {step.status === "error" ? (
              <XCircle className="h-4 w-4 text-red-400" />
            ) : null}
            <span className="text-zinc-200">{step.name}</span>
          </li>
        ))}
      </ul>

      {currentStep ? (
        <p className="mt-4 text-sm italic text-blue-300">{currentStep}</p>
      ) : null}
    </section>
  );
}
