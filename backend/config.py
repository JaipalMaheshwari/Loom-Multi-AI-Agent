"""
==========================================================
YAHAN SE MODELS ADD/REMOVE KARO — bas isi list ko edit karo
==========================================================

Har model ek dictionary hai:
  id            -> koi bhi unique naam (UI mein yahi dikhega)
  provider      -> "groq" | "gemini" | "openrouter" | "mistral" | "together"
  model         -> provider ka asal model name
  api_key_env   -> .env file mein jis naam se API key rakhi hai
  vision        -> (optional) True agar ye model images samajh sakta hai

Naya model add karna ho to bas neeche list mein ek naya dict daal do.
Provider agar OpenAI-compatible hai (Groq, OpenRouter, Mistral, Together,
Fireworks, DeepInfra waghera) to woh already supported hai — sirf entry
add karo, code mein kuch change nahi karna.

Order matters: agent upar se neeche try karta hai, jo pehla available
mile wahi use hota hai.
"""

MODELS = [
    {
        "id": "groq-gpt-oss-120b",
        "provider": "groq",
        "model": "openai/gpt-oss-120b",
        "api_key_env": "GROQ_API_KEY",
    },
    {
        "id": "mistral-large",
        "provider": "mistral",
        "model": "mistral-large-latest",
        "api_key_env": "MISTRAL_API_KEY",
    },
    {
        # NOTE: exact model ID Google ki list se verify karo (README/chat mein command hai)
        # "vision": True -> images sirf isi (ya kisi aur vision:True) model ko
        # bheji jaati hain, kyunke baaki (Groq/Mistral/OpenRouter free) models text-only hain.
        "id": "gemini-flash-lite",
        "provider": "gemini",
        "model": "gemini-3.5-flash-lite",
        "api_key_env": "GEMINI_API_KEY",
        "vision": True,
    },
    {
        "id": "groq-qwen-3.8-27b",
        "provider": "groq",
        "model": "qwen/qwen3.8-27b",
        "api_key_env": "GROQ_API_KEY",
    },
    {
        "id": "openrouter-gpt-oss-120b",
        "provider": "openrouter",
        "model": "openai/gpt-oss-120b:free",
        "api_key_env": "OPENROUTER_API_KEY",
    },
    {
        "id": "groq-gpt-oss-20b",
        "provider": "groq",
        "model": "openai/gpt-oss-20b",
        "api_key_env": "GROQ_API_KEY",
    },
    {
        "id": "mistral-small",
        "provider": "mistral",
        "model": "mistral-small-latest",
        "api_key_env": "MISTRAL_API_KEY",
    },
    {
        "id": "openrouter-auto",
        "provider": "openrouter",
        "model": "openrouter/free",
        "api_key_env": "OPENROUTER_API_KEY",
    },
]

DEFAULT_COOLDOWN_SECONDS = 24 * 60 * 60
SHORT_COOLDOWN_SECONDS = 60
MEMORY_TOP_K = 4
DB_PATH = "agent.db"
