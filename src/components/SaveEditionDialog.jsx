import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { saveNewEdition, updateEdition } from "../lib/editions.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function SaveEditionDialog({
  isOpen,
  mode,
  editionId,
  subject,
  blocks,
  initialReleaseDate,
  initialStatus,
  onClose,
  onSaved,
}) {
  const [formSubject, setFormSubject] = useState(subject || "");
  const [releaseDate, setReleaseDate] = useState(initialReleaseDate || todayIso());
  const [status, setStatus] = useState(initialStatus || "draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const isUpdate = mode === "update" && !!editionId;
  const title = isUpdate ? "Update Edition" : "Save New Edition";
  const confirmLabel = isUpdate ? "Update" : "Save";

  useEffect(() => {
    if (!isOpen) return;
    setFormSubject(subject || "");
    setReleaseDate(initialReleaseDate || todayIso());
    setStatus(initialStatus || "draft");
    setError("");
    setToast("");
  }, [isOpen, subject, initialReleaseDate, initialStatus]);

  const canSubmit = useMemo(() => {
    return !!formSubject.trim() && !!releaseDate && (status === "draft" || status === "published");
  }, [formSubject, releaseDate, status]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setError("");
    setLoading(true);

    try {
      const payload = {
        subject: formSubject.trim(),
        releaseDate,
        status,
        blocks,
      };

      const savedEdition = isUpdate
        ? await updateEdition(editionId, payload)
        : await saveNewEdition(payload);

      setToast(isUpdate ? "Edition updated" : "Edition saved");
      onSaved?.(savedEdition);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e) {
      setError(e?.message || "Failed to save edition.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={loading ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-stone-200">
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-xs text-stone-500 hover:text-stone-700 disabled:opacity-60"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Subject</label>
              <input
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-amber-400"
                placeholder="Edition subject"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Release date</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-amber-400"
                disabled={loading}
              />
            </div>

            <fieldset>
              <legend className="block text-xs font-medium text-stone-700 mb-2">Status</legend>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="radio"
                    name="edition-status"
                    value="draft"
                    checked={status === "draft"}
                    onChange={() => setStatus("draft")}
                    disabled={loading}
                  />
                  Draft
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="radio"
                    name="edition-status"
                    value="published"
                    checked={status === "published"}
                    onChange={() => setStatus("published")}
                    disabled={loading}
                  />
                  Published
                </label>
              </div>
            </fieldset>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-1.5 text-xs rounded bg-stone-200 hover:bg-stone-300 text-stone-800 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="px-3 py-1.5 text-xs rounded bg-amber-400 hover:bg-amber-300 text-stone-900 font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {loading ? "Saving..." : confirmLabel}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-stone-900 text-white text-xs px-3 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
