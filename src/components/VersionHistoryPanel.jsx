import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, History, Loader2, RotateCcw } from "lucide-react";
import { listVersions, restoreVersion } from "../lib/editions.js";
import { BLOCK_TYPES } from "../blocks/index.js";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function statusBadge(status) {
  return status === "published"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-stone-200 text-stone-800";
}

function VersionPreview({ version }) {
  const blocks = Array.isArray(version?.blocks) ? version.blocks : [];

  return (
    <div className="space-y-3">
      <div className="rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700 flex items-center justify-between">
        <div>
          <p className="font-semibold text-stone-900">{version.subject || "Untitled"}</p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Saved {formatDateTime(version.savedAt)} by {version.savedBy || "-"}
          </p>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusBadge(version.status)}`}>
          {version.status || "draft"}
        </span>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
        {blocks.length === 0 && (
          <p className="text-xs text-stone-500 text-center py-8">This version has no blocks.</p>
        )}
        {blocks.map((block) => {
          const Editor = BLOCK_TYPES[block.type]?.Editor;
          if (!Editor) {
            return (
              <div key={block.id} className="text-[11px] text-stone-400 italic">
                Unknown block type: {block.type}
              </div>
            );
          }
          return (
            <fieldset
              key={block.id}
              disabled
              className="border border-stone-200 rounded p-4 m-0 min-w-0"
            >
              <Editor block={block} update={() => {}} readOnly />
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

export default function VersionHistoryPanel({
  isOpen,
  editionId,
  onClose,
  onRestored,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    if (!isOpen || !editionId) return;
    let cancelled = false;
    setError("");
    setLoading(true);
    setSelectedId(null);

    listVersions(editionId)
      .then((data) => {
        if (cancelled) return;
        setVersions(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Could not load version history.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, editionId]);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedId) || null,
    [versions, selectedId]
  );

  const handleRestore = async (versionId) => {
    const ok = confirm(
      "This will overwrite the current edition. The current state will be saved to history first, so you can undo this."
    );
    if (!ok) return;

    setRestoringId(versionId);
    setError("");
    try {
      const restored = await restoreVersion(versionId);
      onRestored?.(restored);
      onClose?.();
    } catch (e) {
      setError(e?.message || "Could not restore that version.");
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-stone-100">
            <div className="flex items-center gap-2">
              {selectedVersion && (
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-stone-800 hover:bg-stone-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to list
                </button>
              )}
              <History className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold">Version history</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-stone-300 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            {loading && (
              <div className="py-16 flex items-center justify-center gap-2 text-stone-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading version history...
              </div>
            )}

            {!loading && error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            {!loading && !error && versions.length === 0 && (
              <div className="py-16 text-center text-stone-500 text-sm">
                No previous versions yet. Saves to this edition will appear here.
              </div>
            )}

            {!loading && !error && versions.length > 0 && !selectedVersion && (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-lg border border-stone-200 bg-white p-3 hover:border-amber-300 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(v.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {v.subject || "Untitled"}
                        </p>
                        <p className="text-xs text-stone-600 mt-1">
                          {formatDateTime(v.savedAt)} | By: {v.savedBy || "-"}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusBadge(v.status)}`}
                        >
                          {v.status || "draft"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedId(v.id)}
                          className="px-2 py-1 text-[11px] rounded border border-stone-300 hover:bg-stone-50"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestore(v.id)}
                          disabled={restoringId === v.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-amber-400 hover:bg-amber-300 text-stone-900 font-medium disabled:opacity-60"
                        >
                          {restoringId === v.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Restore
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && selectedVersion && (
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleRestore(selectedVersion.id)}
                    disabled={restoringId === selectedVersion.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-amber-400 hover:bg-amber-300 text-stone-900 font-medium disabled:opacity-60"
                  >
                    {restoringId === selectedVersion.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Restore this version
                  </button>
                </div>
                <VersionPreview version={selectedVersion} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
