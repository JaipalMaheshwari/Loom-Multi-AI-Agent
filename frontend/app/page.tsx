"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, PanelLeft } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Composer from "@/components/Composer";
import MessageBubble, { TypingIndicator } from "@/components/MessageBubble";
import {
  api,
  type Agent,
  type Conversation,
  type Message,
  type ModelStatus,
  type UploadResult,
} from "@/lib/api";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [modelStatus, setModelStatus] = useState<ModelStatus[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("general");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Mobile (< 768px) par sidebar default band rakhte hain, warna chat area
  // ke liye jagah hi nahi bachti. Desktop par khuli rehti hai jaisa pehle thi.
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    api.listConversations().then(setConversations).catch(() => {});
    api.getModelsStatus().then(setModelStatus).catch(() => {});
    api.listAgents().then(setAgents).catch(() => {});
    const interval = setInterval(() => {
      api.getModelsStatus().then(setModelStatus).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeId == null) {
      setMessages([]);
      return;
    }
    api.getMessages(activeId).then(setMessages).catch(() => {});
    const conv = conversations.find((c) => c.id === activeId);
    if (conv) setSelectedAgentId(conv.agent_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function closeSidebarOnMobile() {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  function handleSelectConversation(id: number) {
    setActiveId(id);
    closeSidebarOnMobile();
  }

  function handleNewChat() {
    setActiveId(null);
    setMessages([]);
    setErrorMsg(null);
    setSelectedAgentId("general");
    closeSidebarOnMobile();
  }

  async function handleRename(id: number, title: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    await api.renameConversation(id, title);
  }

  async function handleDelete(id: number) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    await api.deleteConversation(id);
  }

  async function handleAgentChange(agentId: string) {
    setSelectedAgentId(agentId);
    if (activeId != null) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, agent_id: agentId } : c))
      );
      await api.setConversationAgent(activeId, agentId);
    }
  }

  async function handleSend(text: string, attachment?: UploadResult) {
    let convId = activeId;
    setErrorMsg(null);

    if (convId == null) {
      const conv = await api.createConversation("New chat", selectedAgentId);
      convId = conv.id;
      setActiveId(conv.id);
      setConversations((prev) => [
        { id: conv.id, title: conv.title, agent_id: conv.agent_id, updated_at: Date.now() / 1000 },
        ...prev,
      ]);
    }

    let combinedContent = text;
    if (attachment?.is_image) {
      combinedContent = `${text}\n\n<!--image:${attachment.filename}-->`;
    } else if (attachment) {
      combinedContent = `${text}\n\n<!--attachment:${attachment.filename}-->\n${attachment.content}`;
    }

    setMessages((prev) => [...prev, { role: "user", content: combinedContent }]);
    setSending(true);

    try {
      const imagePayload =
        attachment?.is_image && attachment.mime_type
          ? { base64: attachment.content, mime: attachment.mime_type }
          : undefined;
      const { reply, model_used } = await api.sendChat(convId, combinedContent, imagePayload);
      setMessages((prev) => [...prev, { role: "assistant", content: reply, model_used }]);
      const updated = await api.listConversations();
      setConversations(updated);
    } catch (err: any) {
      setErrorMsg(err.message || "Kuch ghalat ho gaya.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex h-dvh bg-cream">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
        modelStatus={modelStatus}
        open={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-cream text-ink-soft shadow-soft transition-colors hover:bg-cream-dark"
          title="Open sidebar"
        >
          <PanelLeft size={16} />
        </button>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-[720px] flex-col justify-end gap-5 px-4 py-6 sm:px-6 sm:py-8">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-16 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Sparkles size={20} />
                </div>
                <h1 className="font-serif text-2xl text-ink">Aaj kis cheez mein madad chahiye?</h1>
                <p className="max-w-sm text-sm text-muted">
                  Message likho, agent purani baatchit ka context bhi yaad rakhega.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}

            {sending && <TypingIndicator />}

            {errorMsg && (
              <div className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-danger">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        <Composer
          onSend={handleSend}
          disabled={sending}
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentChange={handleAgentChange}
        />
      </section>
    </main>
  );
}
