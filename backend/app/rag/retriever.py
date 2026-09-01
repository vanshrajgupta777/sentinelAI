"""
Local RAG Pipeline
==================
Minimal, self-contained retrieval pipeline. Uses deterministic
bag-of-words + TF-IDF style scoring (no neural embeddings required)
so the prototype runs anywhere Python runs, without Qdrant or any
external vector DB.

Persistence: numpy .npy files for the term matrix, JSON for the
chunk index. Everything stays inside the local data directory.
"""
from __future__ import annotations

import json
import math
import re
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np


@dataclass
class Chunk:
    id: str
    document_id: str
    document_name: str
    text: str
    page: int


def _tokenize(text: str) -> List[str]:
    text = (text or "").lower()
    return re.findall(r"[a-z0-9][a-z0-9\-]{1,}", text)


def chunk_text(text: str, chunk_size: int = 350, overlap: int = 50) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []
    words = text.split()
    chunks: List[str] = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += max(1, chunk_size - overlap)
    return chunks


class LocalRetriever:
    """A real local retriever. Not a placeholder.

    The index is built lazily on first query. For a prototype with
    a handful of documents, the in-memory TF-IDF matrix is fast
    enough and stays entirely on-device.
    """

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.docs_dir = base_dir / "documents"
        self.emb_dir = base_dir / "embeddings"
        self.meta_dir = base_dir / "metadata"
        for d in (self.docs_dir, self.emb_dir, self.meta_dir):
            d.mkdir(parents=True, exist_ok=True)
        self._chunks: List[Chunk] = []
        self._vocab: Dict[str, int] = {}
        self._idf: Optional[np.ndarray] = None
        self._matrix: Optional[np.ndarray] = None  # csr-ish: dense for prototype
        self._loaded = False

    # ---- Ingest ----

    def ingest(self, document_id: str, document_name: str, text: str, page_count: int) -> int:
        chunks_text = chunk_text(text)
        for i, c in enumerate(chunks_text):
            self._chunks.append(
                Chunk(
                    id=f"{document_id}::{i}",
                    document_id=document_id,
                    document_name=document_name,
                    text=c,
                    page=0,
                )
            )
        self._persist_document(document_id, document_name, chunks_text)
        self._loaded = False
        return len(chunks_text)

    def _persist_document(self, document_id: str, name: str, chunks: List[str]) -> None:
        (self.docs_dir / f"{document_id}.json").write_text(
            json.dumps({"id": document_id, "name": name, "chunks": chunks}, indent=2)
        )

    def list_documents(self) -> List[Dict]:
        out: List[Dict] = []
        for p in sorted(self.docs_dir.glob("*.json")):
            data = json.loads(p.read_text())
            out.append(
                {
                    "id": data["id"],
                    "name": data["name"],
                    "chunks": len(data.get("chunks", [])),
                }
            )
        return out

    # ---- Index ----

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        # Load all chunks from disk
        chunks: List[Chunk] = []
        for p in sorted(self.docs_dir.glob("*.json")):
            data = json.loads(p.read_text())
            for i, c in enumerate(data.get("chunks", [])):
                chunks.append(
                    Chunk(
                        id=f"{data['id']}::{i}",
                        document_id=data["id"],
                        document_name=data["name"],
                        text=c,
                        page=0,
                    )
                )
        self._chunks = chunks

        if not self._chunks:
            self._matrix = np.zeros((0, 0), dtype=np.float32)
            self._idf = np.zeros((0,), dtype=np.float32)
            self._loaded = True
            return

        # Build vocabulary and document frequency
        df: Counter = Counter()
        tokenized: List[List[str]] = []
        for ch in self._chunks:
            toks = _tokenize(ch.text)
            tokenized.append(toks)
            df.update(set(toks))
        vocab = {term: i for i, term in enumerate(sorted(df.keys()))}
        self._vocab = vocab
        n_docs = len(self._chunks)
        idf = np.array(
            [math.log((1 + n_docs) / (1 + df[t])) + 1.0 for t in sorted(df.keys())],
            dtype=np.float32,
        )
        self._idf = idf

        # Build TF-IDF matrix (dense; for prototype scale this is fine)
        rows = np.zeros((n_docs, len(vocab)), dtype=np.float32)
        for i, toks in enumerate(tokenized):
            if not toks:
                continue
            tf = Counter(toks)
            denom = float(len(toks))
            for term, count in tf.items():
                j = vocab.get(term)
                if j is None:
                    continue
                rows[i, j] = (count / denom) * idf[j]
        # L2-normalize rows for cosine similarity
        norms = np.linalg.norm(rows, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        rows = rows / norms
        self._matrix = rows
        self._loaded = True

    # ---- Query ----

    def query(self, text: str, k: int = 3) -> List[Dict]:
        self._ensure_loaded()
        if not self._chunks or self._matrix is None or self._matrix.shape[0] == 0:
            return []
        toks = _tokenize(text)
        if not toks:
            return []
        tf = Counter(toks)
        denom = float(len(toks))
        vec = np.zeros((1, len(self._vocab)), dtype=np.float32)
        for term, count in tf.items():
            j = self._vocab.get(term)
            if j is None:
                continue
            vec[0, j] = (count / denom) * float(self._idf[j])
        n = np.linalg.norm(vec)
        if n == 0:
            return []
        vec = vec / n
        scores = (self._matrix @ vec.T).ravel()
        top = np.argsort(-scores)[:k]
        results: List[Dict] = []
        for idx in top:
            if scores[idx] <= 0:
                continue
            ch = self._chunks[int(idx)]
            results.append(
                {
                    "document_id": ch.document_id,
                    "document_name": ch.document_name,
                    "chunk": int(idx),
                    "snippet": ch.text[:280],
                    "score": float(scores[idx]),
                }
            )
        return results
