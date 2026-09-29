"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import clsx from "clsx";
import type { Agent } from "@/lib/api";

export default function AgentPicker({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Agent[];
  selectedId: string;
  onSelect: (agentId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = agents.find((a) => a.id === selectedId) || agents[0];

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-white/60 px-2.5 py-1.5 text-sm text-ink transition-colors hover:bg-white"
      >
        <span>{selected?.icon}</span>
        <span className="font-medium">{selected?.name}</span>
        <ChevronDown size={14} className={clsx("text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 z-20 w-72 rounded-xl border border-border bg-white shadow-panel">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={14} className="text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Agent dhoondo..."
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => {
                    onSelect(a.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={clsx(
                    "flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-cream",
                    a.id === selectedId && "bg-accent-soft"
                  )}
                >
                  <span className="mt-0.5">{a.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{a.name}</span>
                    <span className="block truncate text-xs text-muted">{a.description}</span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted">Koi agent nahi mila</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
