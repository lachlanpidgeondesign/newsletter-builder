import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Copy,
  Download,
  Edit3,
  Eye,
  GripVertical,
  History,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  FilePlus,
} from "lucide-react";

import { BLOCK_TYPES } from "./blocks/index.js";
import { generateMJML, compileMJML } from "./lib/mjml.js";
import {
  saveDraft,
  loadDraft,
  exportDraftFile,
  importDraftFile,
} from "./lib/storage.js";
import { getEdition } from "./lib/editions.js";
import { SUPABASE_CONFIG_OK } from "./lib/supabase.js";
import { signInWithGoogle, signOut, useCurrentUser } from "./lib/auth.js";
import SignInGate from "./components/SignInGate.jsx";
import SaveEditionDialog from "./components/SaveEditionDialog.jsx";
import EditionsLibrary from "./components/EditionsLibrary.jsx";
import EditionsHome from "./components/EditionsHome.jsx";
import VersionHistoryPanel from "./components/VersionHistoryPanel.jsx";
import {
  heartbeat,
  clearPresence,
  useActiveEditors,
} from "./lib/presence.js";

function makeSnapshot(subject, blocks) {
  return JSON.stringify({ subject, blocks });
}

function getDefaultReleaseDate() {
  return new Date().toISOString().slice(0, 10);
}

function getNextNumericId(blocks) {
  return (
    blocks
      .map((b) => (typeof b.id === "number" ? b.id : 0))
      .reduce((a, b) => Math.max(a, b), 0) + 1
  );
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

// ---------- Palette item (draggable source) ----------
function PaletteItem({ type, def }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: "palette", type },
  });
  const Icon = def.icon;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2.5 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 border border-stone-200 rounded cursor-grab active:cursor-grabbing transition select-none ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Icon className="w-4 h-4 text-stone-600" />
      <span className="text-xs text-stone-700">{def.label}</span>
    </div>
  );
}

// ---------- Sortable canvas block ----------
function CanvasBlock({ block, onUpdate, onRemove, onDuplicate, readOnly = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver, active } =
    useSortable({ id: block.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const Editor = BLOCK_TYPES[block.type]?.Editor;
  if (!Editor) return null;

  // Show indicator above this block when something is being dragged over it
  const showIndicator = isOver && !isDragging && active;

  return (
    <div ref={setNodeRef} style={style}>
      {showIndicator && (
        <div className="flex items-center gap-2 py-1 mb-1">
          <div className="w-3 h-3 rounded-full border-2 border-amber-400 flex-shrink-0" />
          <div className="flex-1 h-0.5 bg-amber-400 rounded" />
        </div>
      )}
      <div className="group relative bg-white rounded-lg shadow-sm border border-stone-200 hover:border-stone-300 transition mb-3">
        {!readOnly && (
          <div className="absolute left-0 top-0 bottom-0 -translate-x-full pr-2 flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 bg-white border border-stone-200 rounded cursor-grab active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-3.5 h-3.5 text-stone-500" />
            </button>
            <button
              onClick={onDuplicate}
              className="p-1.5 bg-white border border-stone-200 rounded hover:bg-amber-50 hover:border-amber-200"
              aria-label="Duplicate block"
            >
              <Copy className="w-3.5 h-3.5 text-stone-500 hover:text-amber-700" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 bg-white border border-stone-200 rounded hover:bg-red-50 hover:border-red-200"
              aria-label="Delete block"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-500 hover:text-red-600" />
            </button>
          </div>
        )}
        <fieldset disabled={readOnly} className="p-6 m-0 border-0 min-w-0">
          <Editor block={block} update={onUpdate} readOnly={readOnly} />
        </fieldset>
      </div>
    </div>
  );
}

// ---------- Droppable canvas wrapper ----------
function CanvasDropArea({ children, isEmpty, isActive }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-lg transition ${
        isOver && isEmpty ? "bg-amber-50 border-2 border-dashed border-amber-300" : ""
      } ${isActive && !isEmpty ? "" : ""}`}
    >
      {children}
      {isOver && !isEmpty && (
        <div className="flex items-center gap-2 py-1 mt-1">
          <div className="w-3 h-3 rounded-full border-2 border-amber-400 flex-shrink-0" />
          <div className="flex-1 h-0.5 bg-amber-400 rounded" />
        </div>
      )}
    </div>
  );
}

// ---------- Locked section previews ----------
function LockedHeader() {
  return (
    <div className="relative mb-3">
      <div className="bg-[#594FE6] rounded-t-xl p-7 flex justify-center">
        <img
          src="https://i.dailymail.co.uk/i/pix/2026/04/01/DMplusGames-white.png"
          alt="Daily Mail Games"
          className="h-7"
        />
      </div>
      <div className="absolute top-2 right-2 bg-white/90 text-[10px] text-stone-500 px-2 py-0.5 rounded font-medium">
        Locked
      </div>
    </div>
  );
}

function LockedFooter() {
  const games = [
    { name: "GuessWord", color: "#FEF7EC", border: "#F8CD8B" },
    { name: "Colour Connect", color: "#EEF0FF", border: "#9AA3FF", badge: "NEW" },
    { name: "Master Quiz", color: "#E5FAF5", border: "#66E0C4" },
    { name: "Quick Crossword", color: "#FEF7EC", border: "#F8CD8B" },
    { name: "Mini Sudoku", color: "#FBEAF2", border: "#E583B1" },
  ];
  return (
    <div className="relative mt-3">
      <div className="bg-white rounded-b-xl p-6 space-y-4 opacity-80">
        <h2 className="text-center text-xl font-extrabold text-stone-900" style={{ fontFamily: "'Literata', Inter, sans-serif" }}>
          Today&apos;s Puzzles
        </h2>
        <p className="text-center text-sm text-stone-600">
          Your daily dose of brain-teasing fun – two great games to play today.
        </p>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border p-3 text-center" style={{ backgroundColor: "#FEF7EC", borderColor: "#F8CD8B" }}>
            <p className="font-extrabold text-sm" style={{ fontFamily: "'Literata', Inter, sans-serif" }}>Trace</p>
            <p className="text-xs text-stone-500 mt-1">Can you beat the clock?</p>
          </div>
          <div className="flex-1 rounded-xl border p-3 text-center" style={{ backgroundColor: "#EEF0FF", borderColor: "#9AA3FF" }}>
            <p className="font-extrabold text-sm" style={{ fontFamily: "'Literata', Inter, sans-serif" }}>Relink <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded ml-1 uppercase">New</span></p>
            <p className="text-xs text-stone-500 mt-1">Find the imposters</p>
          </div>
        </div>
        <hr className="border-stone-200" />
        <p className="text-center text-sm font-extrabold text-stone-900" style={{ fontFamily: "'Literata', Inter, sans-serif" }}>More popular games</p>
        <div className="space-y-2">
          {games.map((g) => (
            <div key={g.name} className="flex items-center gap-3 rounded-xl border px-3 py-2" style={{ backgroundColor: g.color, borderColor: g.border }}>
              <div className="w-8 h-8 rounded" style={{ backgroundColor: g.border }} />
              <span className="text-xs font-bold text-stone-800">{g.name}</span>
              {g.badge && <span className="text-[9px] bg-stone-900 text-white px-1 py-0.5 rounded uppercase">{g.badge}</span>}
            </div>
          ))}
        </div>
        <div className="text-center pt-2">
          <span className="inline-block bg-stone-900 text-white text-xs font-bold px-6 py-2.5 rounded-full">Play now →</span>
        </div>
      </div>
      <div className="absolute top-2 right-2 bg-white/90 text-[10px] text-stone-500 px-2 py-0.5 rounded font-medium">
        Locked
      </div>
    </div>
  );
}

// ---------- Read-only banner ----------
function ReadOnlyBanner({ releaseDate, onUnlock, onDuplicate }) {
  const formatted = (() => {
    if (!releaseDate) return "an earlier date";
    const d = new Date(releaseDate);
    if (Number.isNaN(d.getTime())) return releaseDate;
    return d.toLocaleDateString();
  })();
  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-2 flex-1">
        <Lock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-900 leading-relaxed">
          This edition was published on <strong>{formatted}</strong>. Editing is locked to prevent accidental changes.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onDuplicate}
          className="px-3 py-1.5 text-xs rounded bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium"
        >
          Duplicate as new draft
        </button>
        <button
          onClick={onUnlock}
          className="px-3 py-1.5 text-xs rounded bg-amber-400 hover:bg-amber-300 text-stone-900 font-medium"
        >
          Unlock for editing
        </button>
      </div>
    </div>
  );
}

// ---------- App ----------
const STARTER_BLOCK = {
  id: "starter",
  ...BLOCK_TYPES.heading_text.create(),
  heading: "Welcome to Today's Edition",
  body: "We've got a great selection of puzzles for you today. Drag blocks from the left to add more content above the games section.",
};

export default function App() {
  const user = useCurrentUser();
  const [mode, setMode] = useState("home");
  const [subject, setSubject] = useState("Your Daily Puzzles");
  const [blocks, setBlocks] = useState([STARTER_BLOCK]);
  const [view, setView] = useState("edit");
  const [activeDrag, setActiveDrag] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saveMode, setSaveMode] = useState("create");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [loadedEdition, setLoadedEdition] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [baselineSnapshot, setBaselineSnapshot] = useState(
    makeSnapshot("Your Daily Puzzles", [STARTER_BLOCK])
  );
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const nextId = useRef(1);

  // Load draft on mount
  useEffect(() => {
    const saved = loadDraft();
    if (saved && Array.isArray(saved.blocks)) {
      const nextSubject = saved.subject || "Newsletter";
      const nextBlocks = saved.blocks;
      setSubject(nextSubject);
      setBlocks(nextBlocks);
      nextId.current = getNextNumericId(nextBlocks);
      setBaselineSnapshot(makeSnapshot(nextSubject, nextBlocks));
      return;
    }

    setBaselineSnapshot(makeSnapshot("Your Daily Puzzles", [STARTER_BLOCK]));
  }, []);

  // Autosave on change (debounced)
  useEffect(() => {
    const t = setTimeout(() => saveDraft({ subject, blocks }), 300);
    return () => clearTimeout(t);
  }, [subject, blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const hasUnsavedChanges =
    makeSnapshot(subject, blocks) !== baselineSnapshot;

  const isReadOnly = loadedEdition?.status === "published" && !isUnlocked;

  const addBlock = (type, atIndex) => {
    const id = nextId.current++;
    const newBlock = { id, ...BLOCK_TYPES[type].create() };
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(atIndex ?? prev.length, 0, newBlock);
      return next;
    });
  };

  const updateBlock = (id, patch) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const duplicateBlock = (id) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index < 0) return prev;
      const clone = { ...prev[index], id: nextId.current++ };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const handleDragStart = (event) => {
    setActiveDrag(event.active);
  };

  const handleDragEnd = (event) => {
    setActiveDrag(null);
    if (isReadOnly) return;
    const { active, over } = event;
    if (!over) return;

    const fromPalette = active.data.current?.source === "palette";

    if (fromPalette) {
      // Dropped onto canvas-area or onto a specific block (insert above it)
      const overId = over.id;
      const overIndex = blocks.findIndex((b) => b.id === overId);
      if (overIndex >= 0) {
        addBlock(active.data.current.type, overIndex);
      } else {
        // Dropped on canvas drop area
        addBlock(active.data.current.type);
      }
      return;
    }

    // Reorder within canvas
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        setBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  // Compile MJML lazily — only when we need it
  const compiled = useMemo(() => {
    const mjml = generateMJML(blocks, subject);
    const { html, errors } = compileMJML(mjml);
    return { mjml, html, errors };
  }, [blocks, subject]);

  const copyHTML = async () => {
    try {
      await navigator.clipboard.writeText(compiled.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadHTML = () => {
    const blob = new Blob([compiled.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(subject || "newsletter").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNew = () => {
    if (!confirm("Start a new newsletter? Current draft will be saved.")) return;
    exportDraftFile({ subject, blocks });
    const nextSubject = "New Newsletter";
    const nextBlocks = [{ id: nextId.current++, ...BLOCK_TYPES.heading_text.create() }];
    setSubject(nextSubject);
    setBlocks(nextBlocks);
    setLoadedEdition(null);
    setIsUnlocked(false);
    setBaselineSnapshot(makeSnapshot(nextSubject, nextBlocks));
  };

  const handleImport = async () => {
    try {
      const data = await importDraftFile();
      if (data && Array.isArray(data.blocks)) {
        const nextSubject = data.subject || "Newsletter";
        const nextBlocks = data.blocks;
        setSubject(nextSubject);
        setBlocks(nextBlocks);
        nextId.current = getNextNumericId(nextBlocks);
        setLoadedEdition(null);
        setIsUnlocked(false);
        setBaselineSnapshot(makeSnapshot(nextSubject, nextBlocks));
      }
    } catch (e) {
      alert("Could not read that file.");
    }
  };

  const openSaveDialog = (mode) => {
    setSaveMode(mode);
    setIsSaveDialogOpen(true);
  };

  const handleEditionSaved = (edition) => {
    const nextSubject = edition.subject || subject;
    setSubject(nextSubject);
    setLoadedEdition({
      id: edition.id,
      releaseDate: edition.releaseDate || getDefaultReleaseDate(),
      status: edition.status || "draft",
    });
    setIsUnlocked(false);
    setBaselineSnapshot(makeSnapshot(nextSubject, blocks));
  };

  const handleLoadEdition = async (editionId) => {
    if (hasUnsavedChanges) {
      const ok = confirm("Are you sure? Current draft will be lost.");
      if (!ok) return false;
    }

    const edition = await getEdition(editionId);
    const nextSubject = edition.subject || "Newsletter";
    const nextBlocks = Array.isArray(edition.blocks) ? edition.blocks : [];

    setSubject(nextSubject);
    setBlocks(nextBlocks);
    nextId.current = getNextNumericId(nextBlocks);
    setLoadedEdition({
      id: edition.id,
      releaseDate: edition.releaseDate || getDefaultReleaseDate(),
      status: edition.status || "draft",
    });
    setIsUnlocked(false);
    setBaselineSnapshot(makeSnapshot(nextSubject, nextBlocks));
    return true;
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
      setLoadedEdition(null);
      setMode("home");
    } catch (e) {
      alert(e?.message || "Could not sign out.");
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleSignIn = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setAuthError(e?.message || "Could not start Google sign-in.");
      setAuthLoading(false);
    }
  };

  const startNewEdition = () => {
    const nextSubject = "Untitled edition";
    const nextBlocks = [{ id: nextId.current++, ...BLOCK_TYPES.heading_text.create() }];
    setSubject(nextSubject);
    setBlocks(nextBlocks);
    setLoadedEdition(null);
    setIsUnlocked(false);
    setBaselineSnapshot(makeSnapshot(nextSubject, nextBlocks));
    setMode("editor");
  };

  const handleUnlock = () => {
    const ok = confirm(
      "Are you sure? Changes to a published edition affect the historical record."
    );
    if (!ok) return;
    setIsUnlocked(true);
  };

  const handleDuplicateAsDraft = () => {
    const cloned = blocks.map((b) => ({ ...b, id: nextId.current++ }));
    const nextSubject = subject?.startsWith("Copy of ") ? subject : `Copy of ${subject || "Untitled"}`;
    setSubject(nextSubject);
    setBlocks(cloned);
    setLoadedEdition(null);
    setIsUnlocked(false);
    // Leave snapshot at previous baseline so the new draft shows as unsaved changes.
    setBaselineSnapshot(makeSnapshot("", []));
  };

  const handleOpenUpdateDialog = () => {
    if (loadedEdition?.status === "published") {
      const ok = confirm("You're updating a published edition. Continue?");
      if (!ok) return;
    }
    openSaveDialog("update");
  };

  const handleVersionRestored = (edition) => {
    const nextSubject = edition.subject || "Newsletter";
    const nextBlocks = Array.isArray(edition.blocks) ? edition.blocks : [];
    setSubject(nextSubject);
    setBlocks(nextBlocks);
    nextId.current = getNextNumericId(nextBlocks);
    setLoadedEdition({
      id: edition.id,
      releaseDate: edition.releaseDate || getDefaultReleaseDate(),
      status: edition.status || "draft",
    });
    setIsUnlocked(false);
    setBaselineSnapshot(makeSnapshot(nextSubject, nextBlocks));
  };

  const openEditionFromHome = async (editionId) => {
    const ok = await handleLoadEdition(editionId);
    if (ok) setMode("editor");
  };

  const backToHome = () => {
    if (hasUnsavedChanges) {
      const ok = confirm("Leave editor? Unsaved changes will be lost.");
      if (!ok) return;
    }
    setMode("home");
  };

  const [dismissedPresenceBanner, setDismissedPresenceBanner] = useState(false);

  if (!user) {
    return (
      <div className="h-screen flex flex-col bg-stone-100">
        <header className="bg-stone-900 text-stone-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-7 h-7 rounded bg-amber-400 flex items-center justify-center text-stone-900 font-bold text-sm">
            N
          </div>
          <h1 className="text-sm font-semibold">Newsletter Builder</h1>
        </header>
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-400 text-stone-900 font-bold text-lg flex items-center justify-center mx-auto mb-4">
              N
            </div>
            <h2 className="text-xl font-semibold text-stone-900">Welcome</h2>
            <p className="text-sm text-stone-600 mt-2">
              Sign in with your work Google account to view and edit shared editions.
            </p>
            {!SUPABASE_CONFIG_OK && (
              <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-3 text-left">
                Supabase configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as GitHub Actions secrets and re-run the deploy.
              </div>
            )}
            <button
              onClick={handleSignIn}
              disabled={authLoading || !SUPABASE_CONFIG_OK}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-sm font-medium disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              {authLoading ? "Signing in..." : "Sign in with Google"}
            </button>
            {authError && (
              <p className="mt-3 text-xs text-red-600">{authError}</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (mode === "home") {
    return (
      <EditionsHome
        user={user}
        onOpenEdition={openEditionFromHome}
        onCreateNew={startNewEdition}
        onSignOut={handleSignOut}
        signOutLoading={signOutLoading}
      />
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="h-screen flex flex-col bg-stone-100">
        {/* Top bar */}
        <header className="flex flex-col z-20 flex-shrink-0">
          {/* Row 1: back, name, save, profile */}
          <div className="bg-stone-900 text-stone-100 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={backToHome}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-stone-800 hover:bg-stone-700"
                title="Back to editions"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Editions
              </button>
              <div className="w-7 h-7 rounded bg-amber-400 flex items-center justify-center text-stone-900 font-bold text-sm">
                N
              </div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isReadOnly}
                className="bg-transparent border-b border-stone-700 focus:border-amber-400 outline-none px-1 py-0.5 text-sm w-72 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center gap-2">
              <SignInGate user={user}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openSaveDialog("create")}
                    disabled={isReadOnly}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isReadOnly ? "Unlock or duplicate this edition to save changes" : "Save the current newsletter as a new named edition"}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save as New Edition
                  </button>
                  {loadedEdition?.id && (
                    <button
                      onClick={handleOpenUpdateDialog}
                      disabled={isReadOnly}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isReadOnly ? "Unlock this edition to update it" : "Update the loaded edition"}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Update edition
                    </button>
                  )}
                  {loadedEdition?.id && (
                    <button
                      onClick={() => setIsVersionHistoryOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded text-xs"
                      title="View previous versions of this edition"
                    >
                      <History className="w-3.5 h-3.5" />
                      Version history
                    </button>
                  )}
                </div>
              </SignInGate>

              {user?.email && (
                <div className="ml-2 pl-2 border-l border-stone-700 flex items-center gap-2">
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
                    onClick={handleSignOut}
                    disabled={signOutLoading}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-stone-800 hover:bg-stone-700 disabled:opacity-60"
                  >
                    <LogOut className="w-3 h-3" />
                    {signOutLoading ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: edit/preview, new, load, copy, download */}
          <div className="bg-stone-800 text-stone-100 px-6 py-2 grid grid-cols-3 items-center border-t border-stone-700">
            <div />

            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 bg-stone-900 rounded p-1">
                {[
                  { id: "edit", label: "Edit", icon: Edit3 },
                  { id: "preview", label: "Preview", icon: Eye },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setView(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition ${
                        view === t.id
                          ? "bg-stone-100 text-stone-900"
                          : "text-stone-300 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-700 rounded text-xs"
                title="Start a new newsletter (current draft downloads as JSON)"
              >
                <FilePlus className="w-3.5 h-3.5" />
                New
              </button>
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-700 rounded text-xs"
                title="Load a saved draft JSON"
              >
                <Upload className="w-3.5 h-3.5" />
                Load
              </button>
              <button
                onClick={copyHTML}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy HTML"}
              </button>
              <button
                onClick={downloadHTML}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-900 rounded text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Palette */}
          {view === "edit" && (
            <aside className="w-56 bg-white border-r border-stone-200 p-4 overflow-y-auto flex-shrink-0">
              <h2 className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-3">
                Blocks
              </h2>
              {isReadOnly ? (
                <div className="rounded border border-stone-200 bg-stone-50 p-3 text-center">
                  <Lock className="w-4 h-4 text-stone-400 mx-auto mb-2" />
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Blocks are locked while viewing a published edition.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {Object.entries(BLOCK_TYPES).map(([key, def]) => (
                      <PaletteItem key={key} type={key} def={def} />
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-4 leading-relaxed">
                    Drag onto the canvas. Click any text to edit. Drafts autosave to this browser.
                  </p>
                </>
              )}
              {compiled.errors.length > 0 && (
                <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                  <strong>MJML warnings:</strong>
                  <ul className="list-disc pl-4 mt-1">
                    {compiled.errors.slice(0, 3).map((e, i) => (
                      <li key={i}>{e.message || e.formattedMessage}</li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          )}

          {/* Main panel */}
          <main className="flex-1 p-8 flex justify-center overflow-y-auto">
            {view === "edit" && (
              <div className="w-full max-w-2xl">
                {isReadOnly && (
                  <ReadOnlyBanner
                    releaseDate={loadedEdition?.releaseDate}
                    onUnlock={handleUnlock}
                    onDuplicate={handleDuplicateAsDraft}
                  />
                )}
                <LockedHeader />
                <CanvasDropArea isEmpty={blocks.length === 0} isActive={!!activeDrag}>
                  <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.map((block) => (
                      <CanvasBlock
                        key={block.id}
                        block={block}
                        onUpdate={(patch) => updateBlock(block.id, patch)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onRemove={() => removeBlock(block.id)}
                        readOnly={isReadOnly}
                      />
                    ))}
                  </SortableContext>
                  {blocks.length === 0 && (
                    <div className="text-center py-20 text-stone-400">
                      <p className="text-sm">Drag a block here to start</p>
                    </div>
                  )}
                </CanvasDropArea>
                <LockedFooter />
              </div>
            )}

            {view === "preview" && (
              <div className="w-full max-w-2xl">
                <p className="text-xs text-stone-500 mb-3">
                  Compiled email preview. Drag the bottom-right corner to test responsive widths.
                </p>
                <div
                  className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-auto"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: "320px",
                    height: "calc(100vh - 180px)",
                    resize: "horizontal",
                  }}
                >
                  <iframe
                    title="preview"
                    srcDoc={compiled.html}
                    className="w-full bg-white"
                    style={{ height: "100%" }}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <SaveEditionDialog
        isOpen={isSaveDialogOpen}
        mode={saveMode}
        editionId={loadedEdition?.id || null}
        subject={subject}
        blocks={blocks}
        initialReleaseDate={loadedEdition?.releaseDate || getDefaultReleaseDate()}
        initialStatus={loadedEdition?.status || "draft"}
        onClose={() => setIsSaveDialogOpen(false)}
        onSaved={handleEditionSaved}
      />

      <EditionsLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onLoadEdition={handleLoadEdition}
        activeEditionId={loadedEdition?.id || null}
      />

      <VersionHistoryPanel
        isOpen={isVersionHistoryOpen}
        editionId={loadedEdition?.id || null}
        onClose={() => setIsVersionHistoryOpen(false)}
        onRestored={handleVersionRestored}
      />

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDrag?.data.current?.source === "palette" ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-amber-400 rounded-lg shadow-lg">
            {(() => {
              const Icon = BLOCK_TYPES[activeDrag.data.current.type]?.icon;
              return Icon ? <Icon className="w-4 h-4 text-amber-600" /> : null;
            })()}
            <span className="text-xs font-medium text-stone-800">
              {BLOCK_TYPES[activeDrag.data.current.type]?.label}
            </span>
          </div>
        ) : activeDrag ? (
          <div className="bg-white rounded-lg shadow-xl border-2 border-amber-400 px-4 py-3 opacity-90 max-w-md">
            <span className="text-xs font-medium text-stone-600">Moving block…</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Presence heartbeat/cleanup
const prevEditionIdRef = useRef(null);
useEffect(() => {
  let interval;
  const editionId = loadedEdition?.id;
  if (editionId && user?.email) {
    heartbeat(editionId);
    interval = setInterval(() => heartbeat(editionId), 30000);
  }
  // On edition switch or unload, clear previous presence
  return () => {
    if (prevEditionIdRef.current && user?.email) {
      clearPresence(prevEditionIdRef.current);
    }
    clearInterval(interval);
    prevEditionIdRef.current = editionId;
  };
}, [loadedEdition?.id, user?.email]);

// On window unload, best-effort clear
useEffect(() => {
  const editionId = loadedEdition?.id;
  function handleUnload() {
    if (editionId && user?.email) {
      clearPresence(editionId);
    }
  }
  window.addEventListener("beforeunload", handleUnload);
  return () => window.removeEventListener("beforeunload", handleUnload);
}, [loadedEdition?.id, user?.email]);

// Poll for other active editors
const activeEditors = useActiveEditors(loadedEdition?.id);
