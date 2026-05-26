// Drafts persist per-browser via localStorage.
// JSON import/export lets teammates share drafts as files.

const KEY = "newsletter-builder:draft";

export function saveDraft(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save draft:", e);
  }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Failed to load draft:", e);
    return null;
  }
}

export function exportDraftFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = (state.subject || "newsletter").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  a.href = url;
  a.download = `${name}.draft.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDraftFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result));
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}
