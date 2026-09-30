import { FileText, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/lib/api";

const MARKERS = [
  { tag: "<!--attachment:", isImage: false },
  { tag: "<!--image:", isImage: true },
] as const;

function splitAttachment(content: string) {
  for (const { tag, isImage } of MARKERS) {
    const idx = content.indexOf(tag);
    if (idx === -1) continue;

    const visibleText = content.slice(0, idx).trimEnd();
    const rest = content.slice(idx + tag.length);
    const endIdx = rest.indexOf("-->");
    const filename = endIdx === -1 ? null : rest.slice(0, endIdx);

    return { visibleText: visibleText || "Is file ko analyse karo", filename, isImage };
  }
  return { visibleText: content, filename: null as string | null, isImage: false };
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    const { visibleText, filename, isImage } = splitAttachment(message.content);
    return (
      <div className="flex w-full flex-col items-end gap-1.5">
        {filename && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white/60 px-2.5 py-1.5 text-xs text-ink-soft">
            {isImage ? <ImageIcon size={13} /> : <FileText size={13} />}
            <span className="max-w-[220px] truncate">{filename}</span>
          </div>
        )}
        <div className="flex w-full justify-end">
          <div className="max-w-[88%] rounded-[22px] rounded-br-md bg-bubble px-4 py-2.5 text-[15px] font-normal leading-relaxed text-ink sm:max-w-[75%]">
            {visibleText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="prose-agent font-serif text-[16px] leading-[1.7] text-ink">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        {message.model_used && (
          <p className="mt-1.5 text-xs text-muted">{message.model_used}</p>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 py-1">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
      </div>
    </div>
  );
}
