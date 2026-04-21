"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

type ArchitectureDiagramProps = {
  mermaid: string;
  description: string;
};

export function ArchitectureDiagram({
  mermaid: mermaidCode,
  description,
}: ArchitectureDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!containerRef.current) {
        return;
      }

      mermaid.initialize({ startOnLoad: false, theme: "dark" });

      try {
        const id = `reposage-mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setRenderError(false);
        }
      } catch {
        if (isMounted) {
          setRenderError(true);
        }
      }
    };

    void renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [mermaidCode]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      {!renderError ? (
        <div
          ref={containerRef}
          className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4"
        />
      ) : (
        <div className="rounded-xl border border-red-500/40 bg-zinc-950 p-4">
          <p className="text-sm font-medium text-red-300">Could not render diagram</p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-300">
            <code>{mermaidCode}</code>
          </pre>
        </div>
      )}
      <p className="mt-4 text-sm text-zinc-400">{description}</p>
    </section>
  );
}
