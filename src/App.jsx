import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  Download,
  Edit3,
  Eye,
  Code,
  GripVertical,
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
function CanvasBlock({ block, onUpdate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const Editor = BLOCK_TYPES[block.type]?.Editor;
  if (!Editor) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white rounded-lg shadow-sm border border-stone-200 hover:border-stone-300 transition mb-3"
    >
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
          onClick={onRemove}
          className="p-1.5 bg-white border border-stone-200 rounded hover:bg-red-50 hover:border-red-200"
          aria-label="Delete block"
        >
          <Trash2 className="w-3.5 h-3.5 text-stone-500 hover:text-red-600" />
        </button>
      </div>
      <div className="p-6">
        <Editor block={block} update={onUpdate} />
      </div>
    </div>
  );
}

// ---------- Droppable canvas wrapper ----------
function CanvasDropArea({ children, isEmpty }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-lg transition ${
        isOver && isEmpty ? "bg-amber-50 border-2 border-dashed border-amber-300" : ""
      }`}
    >
      {children}
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

// ---------- App ----------
const STARTER_BLOCK = {
  id: "starter",
  ...BLOCK_TYPES.heading_text.create(),
  heading: "Welcome to Today's Edition",
  body: "We've got a great selection of puzzles for you today. Drag blocks from the left to add more content above the games section.",
};

export default function App() {
  const [subject, setSubject] = useState("Your Daily Puzzles");
  const [blocks, setBlocks] = useState([STARTER_BLOCK]);
  const [view, setView] = useState("edit");
  const [activeDrag, setActiveDrag] = useState(null);
  const [copied, setCopied] = useState(false);
  const nextId = useRef(1);

  // Load draft on mount
  useEffect(() => {
    const saved = loadDraft();
    if (saved && Array.isArray(saved.blocks)) {
      setSubject(saved.subject || "Newsletter");
      setBlocks(saved.blocks);
      const maxNumericId = saved.blocks
        .map((b) => (typeof b.id === "number" ? b.id : 0))
        .reduce((a, b) => Math.max(a, b), 0);
      nextId.current = maxNumericId + 1;
    }
  }, []);

  // Autosave on change (debounced)
  useEffect(() => {
    const t = setTimeout(() => saveDraft({ subject, blocks }), 300);
    return () => clearTimeout(t);
  }, [subject, blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

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

  const handleDragStart = (event) => {
    setActiveDrag(event.active);
  };

  const handleDragEnd = (event) => {
    setActiveDrag(null);
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
    setSubject("New Newsletter");
    setBlocks([{ id: nextId.current++, ...BLOCK_TYPES.heading_text.create() }]);
  };

  const handleImport = async () => {
    try {
      const data = await importDraftFile();
      if (data && Array.isArray(data.blocks)) {
        setSubject(data.subject || "Newsletter");
        setBlocks(data.blocks);
      }
    } catch (e) {
      alert("Could not read that file.");
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-stone-100">
        {/* Top bar */}
        <header className="bg-stone-900 text-stone-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-400 flex items-center justify-center text-stone-900 font-bold text-sm">
              N
            </div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent border-b border-stone-700 focus:border-amber-400 outline-none px-1 py-0.5 text-sm w-72"
            />
          </div>

          <div className="flex items-center gap-1 bg-stone-800 rounded p-1">
            {[
              { id: "edit", label: "Edit", icon: Edit3 },
              { id: "preview", label: "Preview", icon: Eye },
              { id: "html", label: "HTML", icon: Code },
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

          <div className="flex gap-2">
            <button
              onClick={handleNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded text-xs"
              title="Start a new newsletter (current draft downloads as JSON)"
            >
              <FilePlus className="w-3.5 h-3.5" />
              New
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded text-xs"
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
        </header>

        <div className="flex">
          {/* Palette */}
          {view === "edit" && (
            <aside className="w-56 bg-white border-r border-stone-200 p-4 min-h-[calc(100vh-56px)]">
              <h2 className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-3">
                Blocks
              </h2>
              <div className="space-y-2">
                {Object.entries(BLOCK_TYPES).map(([key, def]) => (
                  <PaletteItem key={key} type={key} def={def} />
                ))}
              </div>
              <p className="text-[11px] text-stone-500 mt-4 leading-relaxed">
                Drag onto the canvas. Click any text to edit. Drafts autosave to this browser.
              </p>
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
          <main className="flex-1 p-8 flex justify-center">
            {view === "edit" && (
              <div className="w-full max-w-2xl">
                <LockedHeader />
                <CanvasDropArea isEmpty={blocks.length === 0}>
                  <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.map((block) => (
                      <CanvasBlock
                        key={block.id}
                        block={block}
                        onUpdate={(patch) => updateBlock(block.id, patch)}
                        onRemove={() => removeBlock(block.id)}
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
                  Compiled email preview. Resize the window to see mobile stacking.
                </p>
                <iframe
                  title="preview"
                  srcDoc={compiled.html}
                  className="w-full bg-white rounded-lg shadow-sm border border-stone-200"
                  style={{ height: "calc(100vh - 180px)" }}
                />
              </div>
            )}

            {view === "html" && (
              <div className="w-full max-w-4xl">
                <p className="text-xs text-stone-500 mb-3">
                  Compiled email-safe HTML. Paste this into Sailthru.
                </p>
                <pre
                  className="bg-stone-900 text-stone-100 text-xs p-5 rounded-lg overflow-auto"
                  style={{ height: "calc(100vh - 180px)" }}
                >
                  <code>{compiled.html}</code>
                </pre>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDrag?.data.current?.source === "palette" ? (
          <div className="flex items-center gap-2 p-2.5 bg-white border border-amber-300 rounded shadow-lg">
            <span className="text-xs text-stone-700">
              {BLOCK_TYPES[activeDrag.data.current.type]?.label}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
