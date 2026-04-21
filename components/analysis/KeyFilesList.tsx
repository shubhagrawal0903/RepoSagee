import { FileText, Folder } from "lucide-react";
import type { KeyFile } from "@/lib/agent/types";

type KeyFilesListProps = {
  keyFiles: KeyFile[];
};

const importanceOrder: Record<KeyFile["importance"], number> = {
  critical: 0,
  important: 1,
  helpful: 2,
};

const importanceStyles: Record<KeyFile["importance"], string> = {
  critical: "bg-red-500/20 text-red-200 border-red-400/30",
  important: "bg-yellow-500/20 text-yellow-200 border-yellow-400/30",
  helpful: "bg-blue-500/20 text-blue-200 border-blue-400/30",
};

const importanceLabel: Record<KeyFile["importance"], string> = {
  critical: "Critical",
  important: "Important",
  helpful: "Helpful",
};

export function KeyFilesList({ keyFiles }: KeyFilesListProps) {
  const sortedFiles = [...keyFiles].sort(
    (a, b) => importanceOrder[a.importance] - importanceOrder[b.importance],
  );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-zinc-200" />
        <h3 className="text-lg font-semibold text-white">Key Files</h3>
      </div>

      <div className="max-h-120 space-y-3 overflow-y-auto pr-1">
        {sortedFiles.map((file) => (
          <article
            key={`${file.path}-${file.importance}`}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-zinc-400" />
                <p className="font-mono text-sm text-zinc-100">{file.path}</p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${importanceStyles[file.importance]}`}
              >
                {importanceLabel[file.importance]}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{file.purpose}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
