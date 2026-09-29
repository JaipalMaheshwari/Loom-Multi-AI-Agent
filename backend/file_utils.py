"""
Uploaded files se text nikalne ka kaam yahan hota hai. Model khud files
"dekh" nahi sakta (ye text-only chat API hai) — isliye file ka content
text mein convert karke usay conversation mein bhej dete hain, taake
model usay "padh" kar answer de sake.

Naya file-type support karna ho to bas ek naya "elif" branch add karo.
"""

import base64
import io

MAX_CHARS = 24000  # itne characters se zyada extract nahi karte (context overflow se bachne ke liye)
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB

TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".json", ".log"}

IMAGE_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


class UnsupportedFileType(Exception):
    pass


def is_image(filename: str) -> bool:
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in IMAGE_MIME_TYPES


def read_image(filename: str, raw: bytes) -> tuple[str, str]:
    """Image ko text mein convert NAHI karte — seedha base64 mein Vision
    model (Gemini) ko bhejte hain. Returns (mime_type, base64_string)."""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    mime = IMAGE_MIME_TYPES.get(ext)
    if not mime:
        raise UnsupportedFileType(f"'{ext}' image type support nahi hai.")
    return mime, base64.b64encode(raw).decode("ascii")


def extract_text(filename: str, raw: bytes) -> tuple[str, bool]:
    """
    Returns (text, truncated).
    truncated=True agar MAX_CHARS se zyada content tha aur humne kaat diya.
    """
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext in TEXT_EXTENSIONS:
        text = raw.decode("utf-8", errors="ignore")

    elif ext == ".pdf":
        text = _extract_pdf(raw)

    elif ext == ".docx":
        text = _extract_docx(raw)

    else:
        raise UnsupportedFileType(
            f"'{ext or 'unknown'}' file type support nahi hai. "
            f"Supported: .txt .md .csv .json .pdf .docx"
        )

    text = text.strip()
    truncated = len(text) > MAX_CHARS
    if truncated:
        text = text[:MAX_CHARS]

    return text, truncated


def _extract_pdf(raw: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(raw))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n\n".join(pages)


def _extract_docx(raw: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(raw))
    return "\n".join(p.text for p in doc.paragraphs)
