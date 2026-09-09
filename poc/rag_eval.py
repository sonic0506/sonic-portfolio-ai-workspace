#!/usr/bin/env python3
"""samples/ 콘텐츠로 청킹 경계와 검색 품질을 측정하는 PoC 하네스.

의존성 없음. 표준 라이브러리만 사용한다.

  python3 poc/rag_eval.py chunks     # 청킹 측정 (API 키 불필요)
  python3 poc/rag_eval.py selftest   # 자체 검증 (API 키 불필요)
  python3 poc/rag_eval.py search     # 임베딩 + 검색 평가 (OPENAI_API_KEY 필요)

측정 대상은 DATA_MODEL / ADR-0005의 두 가지다.
  1. 섹션 1개 = 청크 1개가 성립하지 않는다는 판단이 실제 콘텐츠에서 맞는가
  2. 공개 범위 필터(document.visible)가 검색 결과에서 실제로 동작하는가
"""

import json
import os
import re
import statistics
import sys
import urllib.request
from pathlib import Path

SAMPLES = Path(__file__).resolve().parent.parent / "samples"

# ponytail: 토큰 대신 문자 수로 잰다. tiktoken 의존성 없이 경계 비교는 가능하다.
# 절대 토큰 예산(8191)을 확인해야 할 때 tiktoken을 붙인다.
MAX_CHARS = 1200
MIN_CHARS = 200

EMBED_MODEL = "text-embedding-3-small"

# 관리자 전용/메타 필드. Document 생성 대상에서 제외한다 (DATA_MODEL 공백 5번).
ADMIN_FIELDS = {"admin_note", "open_questions", "sample_note", "draft_note"}

QUESTIONS_BLOCK = re.compile(r"^:::questions\s*$.*?^:::\s*$", re.MULTILINE | re.DOTALL)

# 기대 출처. 비공개 문서(offline-first-boundary)는 어떤 기대값에도 들어가지 않는다.
EVAL = [
    ("React Native를 사용한 프로젝트 경험이 있나요?", {"viora"}),
    ("AI 관련 프로젝트 경험을 정리해주세요.", {"viora"}),
    ("폐쇄망에서 실시간 영상을 어떻게 전송했나요?", {"yujin-robot", "websocket-binary-video"}),
    ("브라우저에서 USB 기기와 직접 통신한 경험이 있나요?", {"syncmaster", "web-serial-usb"}),
    ("오프라인 우선 앱에서 동기화 충돌을 어떻게 처리했나요?", {"syncmaster"}),
    ("WebRTC 대신 WebSocket을 선택한 이유가 뭔가요?", {"yujin-robot", "websocket-binary-video"}),
    ("OAuth 인증 관련 트러블슈팅 경험을 설명해주세요.", set()),  # 근거 없음 (RAG-003)
]


def parse_front_matter(text):
    """YAML 부분집합 파서. 샘플 front matter가 쓰는 형태만 처리한다."""
    if not text.startswith("---\n"):
        return {}, text
    end = text.index("\n---\n", 3)
    head, body = text[4:end], text[end + 5:]

    # 'key:' 뒤가 리스트인지 맵인지는 다음 줄에서 정해지므로 생성을 미룬다.
    meta, pending = {}, None
    for line in head.split("\n"):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.startswith("  - "):                      # 블록 리스트 항목
            meta.setdefault(pending, []).append(_scalar(line[4:]))
            continue
        if line.startswith("  ") and ":" in line:        # 중첩 맵 (links:)
            k, _, v = line.strip().partition(":")
            meta.setdefault(pending, {})[k.strip()] = _scalar(v)
            continue
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        pending = key
        if not value:
            continue
        elif value.startswith("["):
            meta[key] = [_scalar(v) for v in value[1:-1].split(",") if v.strip()]
        else:
            meta[key] = _scalar(value)
    return meta, body


def _scalar(v):
    v = v.strip().strip('"').strip("'")
    return {"true": True, "false": False, "null": None, "": None}.get(v.lower(), v)


def load_documents():
    """샘플 파일 -> Document. 관리자 전용 필드와 추천 질문 블록은 제외한다."""
    docs = []
    for path in sorted(SAMPLES.rglob("*.md")):
        if path.name == "README.md" or path.name == "skills.md":
            continue
        meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
        if "type" not in meta:
            continue
        for field in ADMIN_FIELDS:
            meta.pop(field, None)
        # 추천 질문은 UI 요소이고 근거가 아니다. 색인 본문에서 제거한다.
        content = QUESTIONS_BLOCK.sub("", body).strip()
        docs.append({
            "id": meta["id"],
            "type": meta["type"].upper(),
            "title": meta["title"],
            "visible": bool(meta.get("published")),
            "content": content,
            "path": str(path.relative_to(SAMPLES.parent)),
        })
    return docs


def split_sections(content):
    """'## 제목' 기준으로 (제목, 본문) 목록을 만든다."""
    parts = re.split(r"^## +(.+)$", content, flags=re.MULTILINE)
    lead = parts[0].strip()
    sections = [("(도입)", lead)] if lead else []
    for i in range(1, len(parts), 2):
        sections.append((parts[i].strip(), parts[i + 1].strip()))
    return sections


def chunk_by_section(doc):
    """전략 A — 섹션 1개 = 청크 1개."""
    return [{"doc_id": doc["id"], "sections": [t], "text": f"{t}\n\n{b}"}
            for t, b in split_sections(doc["content"]) if b]


def chunk_bounded(doc):
    """전략 B — 섹션 기준. 길면 문단 경계로 쪼개고, 짧으면 직전 청크에 붙인다.

    병합이 섹션 경계를 넘으므로 출처는 단일 제목이 아니라 제목 목록으로 남긴다.
    """
    out = []
    for title, body in split_sections(doc["content"]):
        if not body:
            continue
        for piece in _split_long(body):
            text = f"{title}\n\n{piece}"
            # 새 조각이 짧거나, 직전 청크가 아직 짧으면(문서 첫 섹션이 짧은 경우) 합친다
            if out and (len(text) < MIN_CHARS or len(out[-1]["text"]) < MIN_CHARS):
                out[-1]["text"] += "\n\n" + text
                out[-1]["sections"].append(title)
            else:
                out.append({"doc_id": doc["id"], "sections": [title], "text": text})
    return out


def _split_long(body):
    """MAX_CHARS를 넘으면 빈 줄 기준으로 나눈다. 한 문단이 통째로 길면 그대로 둔다."""
    if len(body) <= MAX_CHARS:
        return [body]
    pieces, cur = [], ""
    for para in body.split("\n\n"):
        if cur and len(cur) + len(para) + 2 > MAX_CHARS:
            pieces.append(cur)
            cur = para
        else:
            cur = f"{cur}\n\n{para}" if cur else para
    if cur:
        pieces.append(cur)
    return pieces


def report_chunks(docs):
    for name, fn in (("A: 섹션 = 청크", chunk_by_section), ("B: 경계 조정", chunk_bounded)):
        chunks = [c for d in docs for c in fn(d)]
        sizes = sorted(len(c["text"]) for c in chunks)
        over = [c for c in chunks if len(c["text"]) > MAX_CHARS]
        under = [c for c in chunks if len(c["text"]) < MIN_CHARS]
        print(f"\n### 전략 {name}")
        print(f"  청크 수      : {len(chunks)}")
        print(f"  길이(자)     : 최소 {sizes[0]} / 중앙 {int(statistics.median(sizes))} / 최대 {sizes[-1]}")
        multi = [c for c in chunks if len(c["sections"]) > 1]
        print(f"  {MAX_CHARS}자 초과  : {len(over)}  {[c['sections'][0] for c in over][:5]}")
        print(f"  {MIN_CHARS}자 미만   : {len(under)}  {[c['sections'][0] for c in under][:5]}")
        print(f"  섹션 병합    : {len(multi)}  {[' + '.join(c['sections']) for c in multi][:3]}")


def embed(texts):
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY 가 필요합니다. chunks / selftest 는 키 없이 실행됩니다.")
    out = []
    for i in range(0, len(texts), 64):
        req = urllib.request.Request(
            "https://api.openai.com/v1/embeddings",
            data=json.dumps({"model": EMBED_MODEL, "input": texts[i:i + 64]}).encode(),
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req) as r:
            out += [d["embedding"] for d in json.load(r)["data"]]
    return out


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    return dot / (na * nb) if na and nb else 0.0


def run_search(docs, top_k=5):
    visible = {d["id"] for d in docs if d["visible"]}
    chunks = [c for d in docs for c in chunk_bounded(d)]
    print(f"청크 {len(chunks)}개 임베딩 중... (모델 {EMBED_MODEL})")
    vecs = embed([c["text"] for c in chunks])
    qvecs = embed([q for q, _ in EVAL])

    hits = 0
    for (q, expected), qv in zip(EVAL, qvecs):
        scored = sorted(
            ((cosine(qv, v), c) for v, c in zip(vecs, chunks) if c["doc_id"] in visible),
            key=lambda x: -x[0],
        )[:top_k]
        found = {c["doc_id"] for _, c in scored}
        ok = expected <= found if expected else True
        hits += ok
        print(f"\nQ. {q}")
        print(f"   기대 {sorted(expected) or '없음(근거 부족 기대)'} / 상위 {sorted(found)}  {'OK' if ok else 'MISS'}")
        for s, c in scored:
            print(f"     {s:.3f}  {c['doc_id']} / {' + '.join(c['sections'])}")
    print(f"\n기대 출처 포함: {hits}/{len(EVAL)}")
    print("비공개 문서가 결과에 없어야 한다 (offline-first-boundary).")


def selftest(docs):
    ids = {d["id"] for d in docs}
    assert len(docs) == 6, f"문서 6건이어야 함, 실제 {len(docs)}"
    assert "offline-first-boundary" in ids

    by_id = {d["id"]: d for d in docs}
    assert by_id["offline-first-boundary"]["visible"] is False, "Draft 글이 visible이면 안 됨"
    assert by_id["syncmaster"]["visible"] is True

    blob = "\n".join(d["content"] for d in docs)
    assert ":::questions" not in blob, "추천 질문 블록이 색인 본문에 남았다"
    assert "AI가 작성한 샘플 초안" not in blob, "관리자 전용 필드가 본문에 섞였다"
    assert "측정값 확보 여부" not in blob, "open_questions가 본문에 섞였다"

    for d in docs:
        a, b = chunk_by_section(d), chunk_bounded(d)
        assert a and b, f"{d['id']} 청크가 비었다"
        assert all(c["text"].strip() and c["sections"] for c in b)
        # 병합 후에는 짧은 청크가 남지 않는다 (문서 전체가 짧은 경우 제외)
        assert all(len(c["text"]) >= MIN_CHARS for c in b[:-1]) or len(b) == 1, \
            f"{d['id']}: MIN_CHARS 미만 청크가 남았다"
        # 병합한 청크는 출처 섹션을 모두 보존한다
        assert sum(len(c["sections"]) for c in b) == len(a), \
            f"{d['id']}: 병합 과정에서 섹션 출처가 사라졌다"

    # 공개 필터가 실제로 걸러내는지
    visible = {d["id"] for d in docs if d["visible"]}
    searchable = [c for d in docs for c in chunk_bounded(d) if c["doc_id"] in visible]
    assert all(c["doc_id"] != "offline-first-boundary" for c in searchable)
    print(f"selftest OK — 문서 {len(docs)}건, 검색 대상 청크 {len(searchable)}개")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "chunks"
    documents = load_documents()
    if cmd == "chunks":
        print(f"문서 {len(documents)}건 "
              f"(공개 {sum(d['visible'] for d in documents)} / 비공개 {sum(not d['visible'] for d in documents)})")
        for d in documents:
            print(f"  {'○' if d['visible'] else '×'} {d['type']:8} {d['id']:26} {len(d['content']):>6}자")
        report_chunks(documents)
    elif cmd == "search":
        run_search(documents)
    elif cmd == "dim":
        print(f"{EMBED_MODEL} embedding dim = {len(embed(['차원 확인'])[0])}")
    elif cmd == "selftest":
        selftest(documents)
    else:
        sys.exit(__doc__)
