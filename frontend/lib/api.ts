export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type Conversation = {
  id: number;
  title: string;
  agent_id: string;
  updated_at: number;
};

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  model_used?: string | null;
  created_at?: number;
};

export type ModelStatus = {
  id: string;
  provider: string;
  available: boolean;
  seconds_remaining: number;
};

export type Agent = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type UploadResult = {
  filename: string;
  is_image: boolean;
  content: string;
  truncated?: boolean;
  mime_type?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  listConversations: () => request<Conversation[]>("/api/conversations"),

  createConversation: (title = "New chat", agentId = "general") =>
    request<{ id: number; title: string; agent_id: string }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ title, agent_id: agentId }),
    }),

  renameConversation: (id: number, title: string) =>
    request<{ ok: boolean }>(`/api/conversations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    }),

  setConversationAgent: (id: number, agentId: string) =>
    request<{ ok: boolean }>(`/api/conversations/${id}/agent`, {
      method: "PUT",
      body: JSON.stringify({ agent_id: agentId }),
    }),

  deleteConversation: (id: number) =>
    request<{ ok: boolean }>(`/api/conversations/${id}`, {
      method: "DELETE",
    }),

  getMessages: (id: number) =>
    request<Message[]>(`/api/conversations/${id}/messages`),

  getModelsStatus: () => request<ModelStatus[]>("/api/models/status"),

  listAgents: () => request<Agent[]>("/api/agents"),

  uploadFile: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body?.detail || detail;
      } catch {}
      throw new Error(detail);
    }
    return res.json();
  },

  sendChat: (
    conversationId: number,
    message: string,
    image?: { base64: string; mime: string }
  ) =>
    request<{ reply: string; model_used: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        image_base64: image?.base64,
        image_mime: image?.mime,
      }),
    }),
};
