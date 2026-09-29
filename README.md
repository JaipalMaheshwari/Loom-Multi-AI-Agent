# Self-Learning AI Agent (Multi-Model Failover + Chat UI)

Ye ek chhota lekin complete project hai:

- **Multiple free LLM models** — ek ki limit khatam ho to khud-b-khud agle par shift ho jata hai
- **Naya model add karna** — sirf `backend/config.py` mein ek line add karo, code kahin aur change nahi karna
- **Self-learning memory** — agent apni saari purani baatein SQLite database mein rakhta hai aur relevant purani baatein wapas context mein le aata hai
- **Claude/ChatGPT jesi UI** — sidebar mein chat history, rename/delete options, "New chat" button, aur live model status

---

## 1. Setup (ek dafa)

```bash
cd self_learning_agent/backend
python -m venv venv
source venv/bin/activate      # Windows par: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## 2. Free API keys lo

Jitne models `config.py` mein pehle se hain, unke liye free keys yahan se milengi:

| Provider    | Free key kahan se milegi                          |
|-------------|----------------------------------------------------|
| Groq        | https://console.groq.com/keys                     |
| Gemini      | https://aistudio.google.com/apikey                |
| OpenRouter  | https://openrouter.ai/keys (free models available) |
| Mistral     | https://console.mistral.ai/api-keys               |

`.env` file khol kar jo bhi key mil jaye wo daal do. Baaki khali chhod sakte ho — wo model bas use nahi hoga.

## 3. Run karo

```bash
uvicorn main:app --reload --port 8000
```

Browser mein kholo: **http://localhost:8000**

---

## Naya model kaise add karein

`backend/config.py` khol kar `MODELS` list mein neeche jaisi ek entry add karo:

```python
{
    "id": "mera-naya-model",
    "provider": "groq",              # ya "gemini" / "openrouter" / "mistral" / "together"
    "model": "provider-ka-model-id",
    "api_key_env": "GROQ_API_KEY",
},
```

Bas itna hi — baaki sab (failover, cooldown, UI status) khud-b-khud kaam karega.

Agar koi bilkul naya provider add karna ho (jo OpenAI-compatible na ho), to
`backend/providers.py` mein ek chhota adapter function likhna hoga — Gemini
ka example already usi file mein maujood hai.

---

## Ye kaam kaise karta hai

1. User message bhejta hai → backend saari conversation history + relevant
   purani memory (TF-IDF similarity se nikali gayi) ek saath LLM ko bhejta hai.
2. `model_manager.py` `config.py` ki list mein se pehla "available" model
   try karta hai.
3. Agar provider 429 (rate limit) return kare, to us model ko cooldown
   (default 24 ghante, ya jo provider ne "Retry-After" mein bataya) pe
   daal kar agla model try karta hai.
4. Jab sab models cooldown mein hon, UI mein message aata hai ke sabse
   jaldi available hone wala model kaunsa hai aur kitni der baad milega.
5. Sab kuch (chats, model status) `agent.db` (SQLite) mein save rehta hai
   — server restart hone par bhi data safe rehta hai.
