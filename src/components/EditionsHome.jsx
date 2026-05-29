import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  FilePlus,
  Loader2,
  LogOut,
  Search,
  Trash2,
} from "lucide-react";
import { deleteEdition, listEditions } from "../lib/editions.js";
import { compileMJML, generateMJML } from "../lib/mjml.js";

function EditionThumbnail({ edition }) {
  const html = useMemo(() => {
    try {
      const mjml = generateMJML(edition.blocks || [], edition.subject || "");
      return compileMJML(mjml).html;
    } catch (e) {
      return "";
    }
  }, [edition.blocks, edition.subject]);

  if (!html) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: "#EFF0FF" }}>
        <FileText className="w-8 h-8 text-stone-400" />
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex justify-center overflow-hidden"
      style={{ backgroundColor: "#EFF0FF" }}
    >
      <iframe
        title={`Preview of ${edition.subject || "edition"}`}
        srcDoc={html}
        sandbox=""
        scrolling="no"
        className="pointer-events-none border-0"
        style={{
          width: "600px",
          height: "880px",
          transform: "scale(0.4)",
          transformOrigin: "top center",
          backgroundColor: "#EFF0FF",
        }}
      />
    </div>
  );
}

function formatDate(dateLike) {
  if (!dateLike) return "-";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(dateLike) {
  if (!dateLike) return "-";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(dateLike);
}

function userInitials(user) {
  const meta = user?.user_metadata || {};
  const fullName =
    meta.full_name ||
    meta.name ||
    [meta.given_name, meta.family_name].filter(Boolean).join(" ");

  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    const initials = (first + last).toUpperCase();
    if (initials) return initials;
  }

  const email = user?.email || "";
  if (!email) return "?";
  const local = email.split("@")[0] || "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return local.slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function EditionsHome({
  user,
  onOpenEdition,
  onCreateNew,
  onSignOut,
  signOutLoading,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [openingId, setOpeningId] = useState(null);

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
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    let list = items;
    if (filter !== "all") {
      list = list.filter((item) => item.status === filter);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((item) => {
        return (
          (item.subject || "").toLowerCase().includes(term) ||
          (item.createdBy || "").toLowerCase().includes(term)
        );
      });
    }
    return list;
  }, [items, filter, search]);

  const handleDelete = async (event, id) => {
    event.stopPropagation();
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

  const handleOpen = async (id) => {
    setOpeningId(id);
    try {
      await onOpenEdition(id);
    } catch (e) {
      setError(e?.message || "Could not open edition.");
      setOpeningId(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-stone-100">
      {/* Top bar */}
      <header className="bg-stone-900 text-stone-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-amber-400 flex items-center justify-center text-stone-900 font-bold text-sm">
            N
          </div>
          <h1 className="text-sm font-semibold">Newsletter Builder</h1>
        </div>

        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search editions by subject or author"
              className="w-full bg-stone-800 border border-stone-700 focus:border-amber-400 rounded pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder:text-stone-500 outline-none"
            />
          </div>
        </div>

        {user?.email && (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full bg-amber-400 text-stone-900 font-bold text-[11px] flex items-center justify-center"
              title={user.email}
            >
              {userInitials(user)}
            </div>
            <span className="text-[11px] text-stone-300 max-w-[180px] truncate" title={user.email}>
              {user.email}
            </span>
            <button
              onClick={onSignOut}
              disabled={signOutLoading}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-stone-800 hover:bg-stone-700 disabled:opacity-60"
            >
              <LogOut className="w-3 h-3" />
              {signOutLoading ? "Signing out..." : "Sign out"}
            </button>
          </div>
        )}
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-stone-900">My editions</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-stone-300 rounded px-2 py-1 bg-white"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <span className="text-[11px] text-stone-500">
            {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
          </span>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-900 rounded-full text-xs font-semibold shadow-sm"
        >
          <FilePlus className="w-3.5 h-3.5" />
          New edition
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {loading && (
          <div className="py-24 flex items-center justify-center gap-2 text-stone-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading editions...
          </div>
        )}

        {!loading && error && (
          <div className="max-w-xl mx-auto bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
            {error}
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="py-24 text-center text-stone-500">
            <FileText className="w-10 h-10 mx-auto text-stone-400 mb-3" />
            <p className="text-sm">No editions yet.</p>
            <button
              onClick={onCreateNew}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-900 rounded-full text-xs font-semibold"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Create your first edition
            </button>
          </div>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* New edition card */}
            <button
              type="button"
              onClick={onCreateNew}
              className="group bg-white border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50 rounded-lg p-5 flex flex-col items-center justify-center min-h-[180px] transition"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center mb-2">
                <FilePlus className="w-5 h-5 text-amber-700" />
              </div>
              <p className="text-sm font-semibold text-stone-800">New edition</p>
              <p className="text-[11px] text-stone-500 mt-1">Start a blank newsletter</p>
            </button>

            {filteredItems.map((edition) => {
              const isOpening = openingId === edition.id;
              const isDeleting = deletingId === edition.id;
              const statusClass =
                edition.status === "published"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-200 text-stone-800";

              return (
                <div
                  key={edition.id}
                  onClick={() => handleOpen(edition.id)}
                  className="group relative bg-white border border-stone-200 hover:border-amber-300 hover:shadow-md rounded-lg overflow-hidden cursor-pointer transition flex flex-col"
                >
                  {/* Thumbnail preview */}
                  <div
                    className="relative h-40 border-b border-stone-200 overflow-hidden"
                    style={{ backgroundColor: "#EFF0FF" }}
                  >
                    <EditionThumbnail edition={edition} />
                  </div>

                  {/* Body */}
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-stone-900 line-clamp-2">
                        {edition.subject || "Untitled"}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusClass}`}>
                        {edition.status}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-stone-500 space-y-0.5">
                      <p>Release: {formatDate(edition.releaseDate)}</p>
                      <p className="truncate" title={edition.createdBy}>
                        By {edition.createdBy || "-"}
                      </p>
                      <p>Updated {formatRelative(edition.updatedAt || edition.createdAt)}</p>
                    </div>
                  </div>

                  {/* Hover overlay action */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, edition.id)}
                    disabled={isDeleting || isOpening}
                    className="absolute top-2 right-2 p-1.5 rounded bg-white/90 border border-stone-200 opacity-0 group-hover:opacity-100 hover:border-red-300 hover:bg-red-50 disabled:opacity-60 transition"
                    title="Delete edition"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-stone-600 hover:text-red-600" />
                    )}
                  </button>

                  {isOpening && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
