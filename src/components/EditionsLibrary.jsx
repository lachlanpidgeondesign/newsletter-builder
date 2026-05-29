import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, Trash2 } from "lucide-react";
import { deleteEdition, listEditions } from "../lib/editions.js";

function formatDate(dateLike) {
  if (!dateLike) return "-";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function formatDateTime(dateLike) {
  if (!dateLike) return "-";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function EditionsLibrary({
  isOpen,
  onClose,
  onLoadEdition,
  activeEditionId,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const loadItems = async () => {
    setError("");
    setLoading(true);
    try {
      const editions = await listEditions();
      setItems(editions);
    } catch (e) {
      setError(e?.message || "Failed to fetch editions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadItems();
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const handleDelete = async (id) => {
    const ok = confirm("Delete this edition? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    try {
      await deleteEdition(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      setError(e?.message || "Could not delete edition.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoad = async (id) => {
    setLoadingId(id);
    try {
      const didLoad = await onLoadEdition(id);
      if (didLoad) {
        onClose();
      }
    } catch (e) {
      setError(e?.message || "Could not load that edition.");
    } finally {
      setLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-semibold text-stone-900">Editions Library</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs border border-stone-300 rounded px-2 py-1 bg-white"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-stone-500 hover:text-stone-700"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto">
            {loading && (
              <div className="py-16 flex items-center justify-center gap-2 text-stone-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading editions...
              </div>
            )}

            {!loading && error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredItems.length === 0 && (
              <div className="py-16 text-center text-stone-500 text-sm">
                No editions found for this filter.
              </div>
            )}

            {!loading && !error && filteredItems.length > 0 && (
              <div className="space-y-2">
                {filteredItems.map((edition) => {
                  const isActive = activeEditionId === edition.id;
                  const statusClass =
                    edition.status === "published"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-200 text-stone-800";

                  return (
                    <button
                      key={edition.id}
                      type="button"
                      onClick={() => handleLoad(edition.id)}
                      className={`w-full text-left rounded-lg border p-3 transition hover:border-amber-300 hover:bg-amber-50 ${
                        isActive ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-900 truncate">{edition.subject || "Untitled"}</p>
                          <p className="text-xs text-stone-600 mt-1">
                            Release: {formatDate(edition.releaseDate)} | By: {edition.createdBy || "-"}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-1">
                            Created: {formatDateTime(edition.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusClass}`}>
                            {edition.status}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(edition.id);
                            }}
                            disabled={deletingId === edition.id || loadingId === edition.id}
                            className="p-1.5 rounded border border-stone-300 hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                            title="Delete edition"
                          >
                            {deletingId === edition.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-stone-600 hover:text-red-600" />
                            )}
                          </button>
                        </div>
                      </div>
                      {loadingId === edition.id && (
                        <p className="text-[11px] text-stone-500 mt-2">Loading edition...</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
