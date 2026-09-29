"""
"Self-learning" hissa: agent apni saari purani conversations yaad rakhta
hai (database mein). Jab naya sawal aaye, to yahan se woh purane messages
dhoonde jaate hain jo is sawal se sab se zyada relevant hain (TF-IDF +
cosine similarity — koi extra paid API nahi lagti), aur unhe context ke
taur pe LLM ko diya jaata hai. Isi tarha agent waqt ke saath "seekhta"
jaata hai — jitni zyada baatain hongi, utna behtar context milega.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import db
from config import MEMORY_TOP_K


def get_relevant_memory(current_conv_id, query, top_k=MEMORY_TOP_K):
    past = db.get_all_messages_except(current_conv_id, limit=500)
    past = [p for p in past if p["role"] == "user" and p["content"].strip()]
    if len(past) < 2:
        return ""  # itni memory nahi ke kuch nikala ja sake

    texts = [p["content"] for p in past]
    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform(texts + [query])
        sims = cosine_similarity(matrix[-1], matrix[:-1]).flatten()
    except ValueError:
        return ""

    ranked = sorted(zip(sims, texts), key=lambda x: x[0], reverse=True)
    top = [t for s, t in ranked[:top_k] if s > 0.15]
    if not top:
        return ""

    bullet_list = "\n".join(f"- {t}" for t in top)
    return (
        "Pichli conversations se yaad rakhi gayi relevant maloomat "
        "(agar is sawal se related ho to istemal karo, warna ignore karo):\n"
        f"{bullet_list}"
    )
