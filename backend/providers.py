"""
Har provider ke liye ek chhota adapter function — sab ka output same
shape mein wapas aata hai (plain text string), taake baaki code ko
farq na pade ke jawab kis model se aaya.
"""
import os
import requests


class RateLimitError(Exception):
    """Model ki free limit khatam ho gayi hai (429)."""
    def __init__(self, retry_after=None):
        self.retry_after = retry_after
        super().__init__("Rate limit / quota exceeded")


class ProviderError(Exception):
    """Koi aur error — missing key, network issue, bad response waghera."""
    pass


def _openai_compatible(base_url, api_key, model, messages):
    """Groq, OpenRouter, Mistral, Together — sab isi OpenAI-style API ko follow karte hain."""
    url = f"{base_url}/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "temperature": 0.7}
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code == 429:
        retry_after = resp.headers.get("Retry-After")
        raise RateLimitError(retry_after=int(retry_after) if retry_after and retry_after.isdigit() else None)
    if resp.status_code >= 400:
        raise ProviderError(f"{resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _gemini(api_key, model, messages, image=None):
    """image (optional) = {"mime_type": "image/png", "data": "<base64>"} —
    sirf sabse aakhri (current) user message ke saath attach hoti hai."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    contents = []
    last_user_idx = max(i for i, m in enumerate(messages) if m["role"] == "user")
    for i, m in enumerate(messages):
        role = "user" if m["role"] in ("user", "system") else "model"
        parts = [{"text": m["content"]}]
        if image is not None and i == last_user_idx:
            parts.append({"inline_data": {"mime_type": image["mime_type"], "data": image["data"]}})
        contents.append({"role": role, "parts": parts})
    resp = requests.post(url, json={"contents": contents}, timeout=60)
    if resp.status_code == 429:
        raise RateLimitError()
    if resp.status_code >= 400:
        raise ProviderError(f"{resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise ProviderError("Unexpected Gemini response shape: " + str(data)[:300])


PROVIDER_BASE_URLS = {
    "groq": "https://api.groq.com/openai/v1",
    "openrouter": "https://openrouter.ai/api/v1",
    "mistral": "https://api.mistral.ai/v1",
    "together": "https://api.together.xyz/v1",
}


def call_model(cfg, messages, image=None):
    """cfg = ek entry from config.MODELS. Returns reply text ya raises RateLimitError/ProviderError.
    image (optional) sirf vision:True models ko diya jata hai (model_manager filter karta hai)."""
    api_key = os.getenv(cfg["api_key_env"])
    if not api_key:
        raise ProviderError(f"API key missing: .env mein {cfg['api_key_env']} set karo")

    provider = cfg["provider"]
    if provider in PROVIDER_BASE_URLS:
        return _openai_compatible(PROVIDER_BASE_URLS[provider], api_key, cfg["model"], messages)
    elif provider == "gemini":
        return _gemini(api_key, cfg["model"], messages, image=image)
    else:
        raise ProviderError(f"Unknown provider: {provider}")
