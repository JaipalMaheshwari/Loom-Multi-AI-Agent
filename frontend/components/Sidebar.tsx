"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Circle,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
} from "lucide-react";
import clsx from "clsx";
import type { Conversation, ModelStatus } from "@/lib/api";

function formatWait(seconds: number) {
  if (seconds <= 0) return "ready";
  const mins = Math.ceil(seconds / 60);
  return `${mins}m`;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  modelStatus,
  open,
  onToggleSidebar,
}: {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onRename: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  modelStatus: ModelStatus[];
  open: boolean;
  onToggleSidebar: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [modelsOpen, setModelsOpen] = useState(false);

  function startEdit(c: Conversation) {
    setEditingId(c.id);
    setDraftTitle(c.title);
  }

  function commitEdit(id: number) {
    const trimmed = draftTitle.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  }

  return (
    <>
      {open && (
        <div
          onClick={onToggleSidebar}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 h-full w-[268px] shrink-0 overflow-hidden border-r border-border bg-sidebar transition-transform duration-200",
          "md:static md:z-auto md:transition-[width] md:duration-200",
          open ? "translate-x-0 md:w-[268px]" : "-translate-x-full md:w-0 md:translate-x-0 md:border-r-0"
        )}
      >
      <div className="flex h-full w-[268px] flex-col">
        <div className="flex items-center justify-between px-3 pb-1 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Sparkles size={18} strokeWidth={1.8} />
            </div>
            <span className="font-serif text-[15px] font-semibold text-ink">Loom</span>
          </div>
          <button
            onClick={onToggleSidebar}
            className="rounded p-1 text-ink-soft hover:bg-cream-dark"
            title="Close sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <div className="p-3 pt-2">
          <button
            onClick={onNewChat}
            className="flex w-full items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-cream shadow-soft transition-colors hover:bg-accent-hover"
          >
            <Plus size={16} strokeWidth={2.5} />
            New chat
          </button>
        </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <p className="px-2 pb-1.5 pt-2 text-xs font-medium uppercase tracking-wide text-muted">
          Recents
        </p>
        <ul className="flex flex-col gap-0.5">
          {conversations.map((c) => (
            <li key={c.id}>
              {editingId === c.id ? (
                <div className="flex items-center gap-1 rounded-lg bg-cream px-2 py-1.5">
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(c.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
                  />
                  <button
                    onClick={() => commitEdit(c.id)}
                    className="rounded p-1 text-ink-soft hover:bg-cream-dark"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded p-1 text-ink-soft hover:bg-cream-dark"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className={clsx(
                    "group flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition-colors",
                    activeId === c.id
                      ? "bg-cream text-ink"
                      : "text-ink-soft hover:bg-cream/70"
                  )}
                >
                  <button
                    onClick={() => onSelect(c.id)}
                    className="min-w-0 flex-1 truncate text-left"
                    title={c.title}
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => startEdit(c)}
                    className="hidden rounded p-1 hover:bg-cream-dark group-hover:block"
                    title="Rename"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="hidden rounded p-1 text-danger hover:bg-cream-dark group-hover:block"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </li>
          ))}
          {conversations.length === 0 && (
            <li className="px-2 py-4 text-sm text-muted">
              Koi chat nahi hai abhi — naya shuru karo.
            </li>
          )}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setModelsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-1 py-1 text-xs font-medium uppercase tracking-wide text-muted hover:text-ink-soft"
        >
          <span>Models</span>
          <ChevronDown
            size={14}
            className={clsx("transition-transform", modelsOpen && "rotate-180")}
          />
        </button>
        {modelsOpen && (
          <ul className="mt-1 flex flex-col gap-1">
            {modelStatus.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between px-1 py-0.5 text-xs text-ink-soft"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Circle
                    size={7}
                    fill={m.available ? "#7A8F5C" : "#C15F3C"}
                    strokeWidth={0}
                  />
                  <span className="truncate">{m.id}</span>
                </span>
                <span className="shrink-0 text-muted">
                  {m.available ? "ready" : formatWait(m.seconds_remaining)}
                </span>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>
      </aside>
    </>
  );
}
