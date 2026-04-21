import type { TechStack } from "@/lib/agent/types";

type TechStackBadgesProps = {
  techStack: TechStack;
};

type CategoryConfig = {
  label: string;
  items: string[];
  badgeClass: string;
};

export function TechStackBadges({ techStack }: TechStackBadgesProps) {
  const categories: CategoryConfig[] = [
    {
      label: "Frameworks",
      items: techStack.frameworks,
      badgeClass: "bg-blue-500/20 text-blue-200 border-blue-400/30",
    },
    {
      label: "Languages",
      items: techStack.languages,
      badgeClass: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
    },
    {
      label: "ORMs",
      items: techStack.orms,
      badgeClass: "bg-green-500/20 text-green-200 border-green-400/30",
    },
    {
      label: "Databases",
      items: techStack.databases,
      badgeClass: "bg-green-500/20 text-green-200 border-green-400/30",
    },
    {
      label: "Auth",
      items: techStack.auth,
      badgeClass: "bg-purple-500/20 text-purple-200 border-purple-400/30",
    },
    {
      label: "Styling",
      items: techStack.styling,
      badgeClass: "bg-pink-500/20 text-pink-200 border-pink-400/30",
    },
    {
      label: "Testing",
      items: techStack.testing,
      badgeClass: "bg-yellow-500/20 text-yellow-200 border-yellow-400/30",
    },
    {
      label: "Devtools",
      items: techStack.devtools,
      badgeClass: "bg-zinc-500/20 text-zinc-200 border-zinc-400/30",
    },
    {
      label: "Other",
      items: techStack.other,
      badgeClass: "bg-slate-500/20 text-slate-200 border-slate-400/30",
    },
  ];

  return (
    <div className="space-y-4">
      {categories
        .filter((category) => category.items.length > 0)
        .map((category) => (
          <section key={category.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {category.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {category.items.map((item) => (
                <span
                  key={`${category.label}-${item}`}
                  className={`rounded-full border px-3 py-1 text-sm ${category.badgeClass}`}
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
