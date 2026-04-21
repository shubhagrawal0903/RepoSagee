import { GraduationCap } from "lucide-react";
import type { OnboardingSection } from "@/lib/agent/types";

type OnboardingGuideProps = {
  sections: OnboardingSection[];
  whereToStart: string;
};

export function OnboardingGuide({
  sections,
  whereToStart,
}: OnboardingGuideProps) {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="mb-4 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-zinc-200" />
        <h3 className="text-lg font-semibold text-white">Onboarding Guide</h3>
      </div>

      <article className="mb-5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
          Where to Start
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-blue-100">
          {whereToStart}
        </p>
      </article>

      <div className="space-y-5">
        {sortedSections.map((section, index) => (
          <article
            key={`${section.title}-${section.order}`}
            className={index !== sortedSections.length - 1 ? "border-b border-zinc-800 pb-5" : ""}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
                {index + 1}
              </span>
              <h4 className="text-base font-semibold text-white">{section.title}</h4>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
              {section.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
