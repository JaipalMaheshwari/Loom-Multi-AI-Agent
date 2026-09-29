import time

import db
import providers
from config import MODELS, DEFAULT_COOLDOWN_SECONDS, SHORT_COOLDOWN_SECONDS


class AllModelsBusyError(Exception):
    def __init__(self, soonest_id, seconds_remaining):
        self.soonest_id = soonest_id
        self.seconds_remaining = seconds_remaining
        super().__init__("All models are currently rate-limited")


class NoVisionModelError(Exception):
    """Koi bhi vision-capable model available nahi hai (sab cooldown mein hain
    ya config mein koi vision:True model hai hi nahi)."""
    pass


def _status_map():
    return db.get_model_status_map()


def get_models_status():
    now = time.time()
    status_map = _status_map()
    result = []
    for cfg in MODELS:
        available_at = status_map.get(cfg["id"], 0)
        seconds_remaining = max(0, int(available_at - now))
        result.append({
            "id": cfg["id"],
            "provider": cfg["provider"],
            "available": seconds_remaining == 0,
            "seconds_remaining": seconds_remaining,
        })
    return result


def _soonest_model(status_map, now):
    future = [(mid, at) for mid, at in status_map.items() if at > now]
    if not future:
        return None, 0
    mid, at = min(future, key=lambda x: x[1])
    return mid, int(at - now)


def get_reply(messages, image=None):
    """
    messages: [{"role": "system"/"user"/"assistant", "content": "..."}]
    image (optional): {"mime_type": "...", "data": "<base64>"}
    Returns (reply_text, model_id_used).
    Raises AllModelsBusyError agar sab (text) models cooldown mein hon,
    ya NoVisionModelError agar image di gayi ho aur koi vision model available na ho.
    """
    now = time.time()
    status_map = _status_map()

    candidates = MODELS
    if image is not None:
        candidates = [cfg for cfg in MODELS if cfg.get("vision")]
        if not candidates:
            raise NoVisionModelError()

    for cfg in candidates:
        available_at = status_map.get(cfg["id"], 0)
        if available_at > now:
            continue

        try:
            reply = providers.call_model(cfg, messages, image=image)
            return reply, cfg["id"]
        except providers.RateLimitError as e:
            cooldown = e.retry_after if e.retry_after else DEFAULT_COOLDOWN_SECONDS
            db.set_model_available_at(cfg["id"], now + cooldown)
            status_map[cfg["id"]] = now + cooldown
            continue
        except providers.ProviderError:
            db.set_model_available_at(cfg["id"], now + SHORT_COOLDOWN_SECONDS)
            status_map[cfg["id"]] = now + SHORT_COOLDOWN_SECONDS
            continue

    if image is not None:
        vision_status = {cfg["id"]: status_map.get(cfg["id"], 0) for cfg in candidates}
        soonest_id, seconds_remaining = _soonest_model(vision_status, now)
        raise AllModelsBusyError(soonest_id, seconds_remaining)

    soonest_id, seconds_remaining = _soonest_model(status_map, now)
    raise AllModelsBusyError(soonest_id, seconds_remaining)
