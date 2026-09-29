import sqlite3
import time
from contextlib import contextmanager

from config import DB_PATH


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT 'New chat',
                agent_id TEXT NOT NULL DEFAULT 'general',
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
        """)
        # Purani database files mein agent_id column nahi hoga — usko yahan
        # add kar dete hain. Agar pehle se hai to error ignore kar dete hain.
        try:
            conn.execute(
                "ALTER TABLE conversations ADD COLUMN agent_id TEXT NOT NULL DEFAULT 'general'"
            )
        except sqlite3.OperationalError:
            pass
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                model_used TEXT,
                created_at REAL NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS model_status (
                model_id TEXT PRIMARY KEY,
                available_at REAL NOT NULL DEFAULT 0
            )
        """)


# ---------- conversations ----------

def create_conversation(title="New chat", agent_id="general"):
    now = time.time()
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO conversations (title, agent_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (title, agent_id, now, now),
        )
        return cur.lastrowid


def list_conversations():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, title, agent_id, updated_at FROM conversations ORDER BY updated_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def rename_conversation(conv_id, title):
    with get_conn() as conn:
        conn.execute("UPDATE conversations SET title = ? WHERE id = ?", (title, conv_id))


def set_conversation_agent(conv_id, agent_id):
    with get_conn() as conn:
        conn.execute("UPDATE conversations SET agent_id = ? WHERE id = ?", (agent_id, conv_id))


def get_conversation_agent(conv_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT agent_id FROM conversations WHERE id = ?", (conv_id,)
        ).fetchone()
        return row["agent_id"] if row else "general"


def touch_conversation(conv_id):
    with get_conn() as conn:
        conn.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (time.time(), conv_id))


def delete_conversation(conv_id):
    with get_conn() as conn:
        conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
        conn.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))


# ---------- messages ----------

def add_message(conv_id, role, content, model_used=None):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content, model_used, created_at) VALUES (?, ?, ?, ?, ?)",
            (conv_id, role, content, model_used, time.time()),
        )
    touch_conversation(conv_id)


def get_messages(conv_id):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT role, content, model_used, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC",
            (conv_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_all_messages_except(conv_id, limit=500):
    """Long-term memory ke liye — doosri conversations ke messages."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT conversation_id, role, content FROM messages WHERE conversation_id != ? ORDER BY id DESC LIMIT ?",
            (conv_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]


# ---------- model cooldown status ----------

def set_model_available_at(model_id, timestamp):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO model_status (model_id, available_at) VALUES (?, ?) "
            "ON CONFLICT(model_id) DO UPDATE SET available_at = excluded.available_at",
            (model_id, timestamp),
        )


def get_model_status_map():
    with get_conn() as conn:
        rows = conn.execute("SELECT model_id, available_at FROM model_status").fetchall()
        return {r["model_id"]: r["available_at"] for r in rows}
