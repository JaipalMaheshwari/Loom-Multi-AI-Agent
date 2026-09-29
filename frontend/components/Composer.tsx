"use client";

import { useRef, useState } from "react";
import { ArrowUp, Paperclip, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
import AgentPicker from "@/components/AgentPicker";
import { api, type Agent, type UploadResult } from "@/lib/api";

export default function Composer({
  onSend,
  disabled,
  agents,
  selectedAgentId,
  onAgentChange,
}: {
  onSend: (text: string, attachment?: UploadResult) => void;
  disabled?: boolean;
  agents: Agent[];
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const result = await api.uploadFile(file);
      setAttachment(result);
    } catch (err: any) {
      setUploadError(err.message || "File upload nahi ho saki.");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    const trimmed = value.trim();
    if (disabled || uploading) return;
    if (!trimmed && !attachment) return;

    const text = trimmed || "Is file ko analyse karo";
    onSend(text, attachment ?? undefined);

    setValue("");
    setAttachment(null);
    setUploadError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  return (
    <div className="border-t border-border bg-cream px-4 pb-5 pt-3">
      <div className="mx-auto flex max-w-[720px] flex-col gap-2 rounded-2xl border border-border bg-white/70 px-3 py-2 shadow-soft focus-within:border-accent/50">
        {(attachment || uploading || uploadError) && (
          <div className="flex items-center gap-2 rounded-lg bg-cream px-2.5 py-1.5 text-xs text-ink-soft">
            {uploading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>File padh rahe hain...</span>
              </>
            ) : uploadError ? (
              <>
                <span className="flex-1 text-danger">{uploadError}</span>
                <button onClick={() => setUploadError(null)} className="rounded p-0.5 hover:bg-cream-dark">
                  <X size={13} />
                </button>
              </>
            ) : (
              attachment && (
                <>
                  {attachment.is_image ? <ImageIcon size={13} /> : <FileText size={13} />}
                  <span className="flex-1 truncate">
                    {attachment.filename}
                    {attachment.truncated && " (bara file, sirf shuru ka hissa use hoga)"}
                  </span>
                  <button onClick={() => setAttachment(null)} className="rounded p-0.5 hover:bg-cream-dark">
                    <X size={13} />
                  </button>
                </>
              )
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Message likho..."
          className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-ink placeholder:text-muted focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AgentPicker agents={agents} selectedId={selectedAgentId} onSelect={onAgentChange} />
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json,.pdf,.docx,.png,.jpg,.jpeg,.webp,.gif"
              onChange={handleFilePick}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-cream disabled:opacity-50"
              title="File attach karo"
            >
              <Paperclip size={16} />
            </button>
          </div>
          <button
            onClick={submit}
            disabled={disabled || uploading || (!value.trim() && !attachment)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-cream transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-border disabled:text-muted"
            aria-label="Send message"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-[720px] text-center text-xs text-muted">
        Agent purani baatein yaad rakhta hai aur zaroorat par khud dusre model par shift ho jata hai.
      </p>
    </div>
  );
}
