from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import agents
import db
import file_utils
import memory
import model_manager

app = FastAPI(title="Self-Learning AI Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

db.init_db()

BASE_PROMPT = (
    "Tum ek madadgar, dosaana AI assistant ho jo user ki zaban mein "
    "(Roman Urdu/English mix ho to usi mein) jawab dete ho. Jawab clear "
    "aur seedha do."
)


class NewConversation(BaseModel):
    title: str = "New chat"
    agent_id: str = "general"


class RenameConversation(BaseModel):
    title: str


class SetAgent(BaseModel):
    agent_id: str


class ChatRequest(BaseModel):
    conversation_id: int
    message: str
    image_base64: str | None = None
    image_mime: str | None = None


# ---------- file upload ----------

@app.post("/api/upload")
async def api_upload(file: UploadFile = File(...)):
    raw = await file.read()
    if len(raw) > file_utils.MAX_UPLOAD_BYTES:
        raise HTTPException(400, "File 8MB se bari hai, chhoti file try karo.")

    if file_utils.is_image(file.filename):
        try:
            mime, b64 = file_utils.read_image(file.filename, raw)
        except file_utils.UnsupportedFileType as e:
            raise HTTPException(400, str(e))
        return {"filename": file.filename, "is_image": True, "mime_type": mime, "content": b64}

    try:
        text, truncated = file_utils.extract_text(file.filename, raw)
    except file_utils.UnsupportedFileType as e:
        raise HTTPException(400, str(e))

    if not text:
        raise HTTPException(400, "File se koi text nahi nikla (khaali ya scanned image ho sakti hai).")

    return {"filename": file.filename, "is_image": False, "content": text, "truncated": truncated}


# ---------- agents ----------

@app.get("/api/agents")
def api_list_agents():
    return agents.list_agents()


# ---------- conversation endpoints ----------

@app.get("/api/conversations")
def api_list_conversations():
    return db.list_conversations()


@app.post("/api/conversations")
def api_create_conversation(body: NewConversation):
    conv_id = db.create_conversation(body.title, body.agent_id)
    return {"id": conv_id, "title": body.title, "agent_id": body.agent_id}


@app.put("/api/conversations/{conv_id}")
def api_rename_conversation(conv_id: int, body: RenameConversation):
    db.rename_conversation(conv_id, body.title)
    return {"ok": True}


@app.put("/api/conversations/{conv_id}/agent")
def api_set_conversation_agent(conv_id: int, body: SetAgent):
    db.set_conversation_agent(conv_id, body.agent_id)
    return {"ok": True}


@app.delete("/api/conversations/{conv_id}")
def api_delete_conversation(conv_id: int):
    db.delete_conversation(conv_id)
    return {"ok": True}


@app.get("/api/conversations/{conv_id}/messages")
def api_get_messages(conv_id: int):
    return db.get_messages(conv_id)


# ---------- model status ----------

@app.get("/api/models/status")
def api_models_status():
    return model_manager.get_models_status()


# ---------- chat ----------

@app.post("/api/chat")
def api_chat(body: ChatRequest):
    conv_id = body.conversation_id
    user_message = body.message.strip()
    if not user_message:
        raise HTTPException(400, "Empty message")

    db.add_message(conv_id, "user", user_message)

    history = db.get_messages(conv_id)

    agent_id = db.get_conversation_agent(conv_id)
    agent = agents.get_agent(agent_id)
    combined_prompt = f"{BASE_PROMPT}\n\n{agent['system_prompt']}"
    llm_messages = [{"role": "system", "content": combined_prompt}]

    mem_context = memory.get_relevant_memory(conv_id, user_message)
    if mem_context:
        llm_messages.append({"role": "system", "content": mem_context})

    for m in history:
        llm_messages.append({"role": m["role"], "content": m["content"]})

    image = None
    if body.image_base64 and body.image_mime:
        image = {"mime_type": body.image_mime, "data": body.image_base64}

    try:
        reply, model_used = model_manager.get_reply(llm_messages, image=image)
    except model_manager.NoVisionModelError:
        raise HTTPException(503, "Filhaal koi vision (image-samajhne wala) model configure nahi hai.")
    except model_manager.AllModelsBusyError as e:
        if e.soonest_id:
            mins = max(1, e.seconds_remaining // 60)
            msg = (
                f"Filhaal is kaam ke liye sab models apni limit tak pahunch chuke hain. "
                f"Sabse jaldi available hone wala model '{e.soonest_id}' hai, "
                f"jo taqreeban {mins} minute baad dobara available hoga."
            )
        else:
            msg = "Filhaal models busy hain. Thodi der baad dobara koshish karo."
        raise HTTPException(429, msg)

    db.add_message(conv_id, "assistant", reply, model_used=model_used)

    if len(history) == 1:
        auto_title = user_message[:40] + ("..." if len(user_message) > 40 else "")
        db.rename_conversation(conv_id, auto_title)

    return {"reply": reply, "model_used": model_used}
