#!/usr/bin/env python3
"""고정 질문(FAQ) 매칭 기준 거리 측정 하네스.

등록 질문과 방문자 질문의 코사인 거리(pgvector `<=>`와 같은 값: 1 - 코사인 유사도)를 재서,
"같은 뜻"과 "다른 뜻"이 어느 거리에서 갈리는지 본다. 표준 라이브러리만 사용한다.

  python3 poc/faq_threshold.py            # OPENAI_API_KEY 환경변수 또는 backend/.env 사용
  python3 poc/faq_threshold.py --save     # poc/results/<날짜>-faq-threshold.json 저장

아래 FAQ / CASES를 고쳐서 실제로 등록할 질문으로 바꿔 재도 된다.
"""

import datetime
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESULTS = Path(__file__).resolve().parent / "results"
EMBED_MODEL = "text-embedding-3-small"

# 등록할 고정 질문 (결정 1-A: 질문 1개씩)
FAQ = {
    "live": "어디에 사시나요?",
    "contact": "연락은 어떻게 드리면 되나요?",
    "job": "지금 이직을 준비하고 계신가요?",
}

# (방문자 질문, 기대 FAQ 키 또는 None)
#  - 기대 키: 이 FAQ로 답해야 하는 같은 뜻의 질문
#  - None: 어떤 FAQ로도 답하면 안 되는 질문 (비슷해 보이지만 뜻이 다른 것 포함)
CASES = [
    ("어디에 살고 계신가요?", "live"),
    ("어디 거주중이신가요?", "live"),
    ("사는 곳이 어디예요?", "live"),
    ("집이 어디세요?", "live"),
    ("거주지가 어디인가요?", "live"),
    ("어디서 일하세요?", None),
    ("고향이 어디세요?", None),
    ("이사 계획이 있으신가요?", None),
    ("출퇴근은 어떻게 하시나요?", None),
    ("어떻게 연락할 수 있나요?", "contact"),
    ("연락처 알려주세요", "contact"),
    ("컨택하려면 어디로 하면 되나요?", "contact"),
    ("깃허브 주소가 뭔가요?", None),
    ("연봉은 얼마를 생각하시나요?", None),
    ("구직 중이신가요?", "job"),
    ("새로운 회사를 찾고 계세요?", "job"),
    ("채용 제안을 받고 계신가요?", "job"),
    ("퇴사한 이유가 뭔가요?", None),
    ("지금 다니는 회사는 어디인가요?", None),
    ("React 경험이 있나요?", None),
    ("폐쇄망에서 실시간 영상을 어떻게 전송했나요?", None),
    ("AI 관련 프로젝트 경험을 정리해주세요.", None),
]


def api_key():
    key = os.environ.get("OPENAI_API_KEY")
    if key:
        return key
    env = ROOT / "backend" / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("OPENAI_API_KEY="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
                if value:
                    return value
    sys.exit("OPENAI_API_KEY 가 필요합니다 (환경변수 또는 backend/.env).")


def embed(texts):
    req = urllib.request.Request(
        "https://api.openai.com/v1/embeddings",
        data=json.dumps({"model": EMBED_MODEL, "input": texts}).encode(),
        headers={"Authorization": f"Bearer {api_key()}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return [d["embedding"] for d in json.load(r)["data"]]


def distance(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    return 1 - dot / (na * nb)


def main():
    keys = list(FAQ)
    vecs = embed([FAQ[k] for k in keys] + [q for q, _ in CASES])
    faq_vecs = dict(zip(keys, vecs[: len(keys)]))
    rows = []
    for (question, expected), v in zip(CASES, vecs[len(keys):]):
        dists = {k: distance(v, faq_vecs[k]) for k in keys}
        best = min(dists, key=dists.get)
        rows.append({"question": question, "expected": expected, "best": best,
                     "distance": round(dists[best], 4),
                     "all": {k: round(d, 4) for k, d in dists.items()}})

    # 맞게 걸려야 하는 것: expected == best 인 경우의 거리
    should = [r["distance"] for r in rows if r["expected"] is not None and r["expected"] == r["best"]]
    # 걸리면 안 되는 것: expected None 이거나, 다른 FAQ가 더 가까운 경우
    must_not = [r["distance"] for r in rows if r["expected"] is None or r["expected"] != r["best"]]

    print(f"\n모델 {EMBED_MODEL} / 거리 = 1 - 코사인 유사도 (작을수록 비슷)\n")
    print(f"{'판정':<6}{'거리':>8}  {'가장 가까운 FAQ':<10} 질문")
    for r in sorted(rows, key=lambda r: r["distance"]):
        label = ("같은뜻" if r["expected"] else "다른뜻")
        warn = "  <- 다른 FAQ가 더 가까움" if r["expected"] and r["expected"] != r["best"] else ""
        print(f"{label:<6}{r['distance']:>8.4f}  {r['best']:<14} {r['question']}{warn}")

    worst_should = max(should) if should else None
    best_must_not = min(must_not) if must_not else None
    print()
    print(f"같은 뜻 중 가장 먼 거리  : {worst_should}")
    print(f"다른 뜻 중 가장 가까운 거리: {best_must_not}")
    if worst_should is not None and best_must_not is not None:
        if worst_should < best_must_not:
            print(f"→ 분리됨. 기준은 {worst_should:.4f} ~ {best_must_not:.4f} 사이 (오답을 막으려면 작은 쪽에 가깝게)")
        else:
            print("→ 겹침. 한 가지 거리 기준만으로는 완전히 나눌 수 없다. 다른 표현 등록(결정 1-B) 또는 보수적 기준 필요")

    if "--save" in sys.argv:
        RESULTS.mkdir(exist_ok=True)
        path = RESULTS / f"{datetime.date.today().isoformat()}-faq-threshold.json"
        path.write_text(json.dumps({
            "measured_at": datetime.datetime.now().astimezone().isoformat(),
            "embed_model": EMBED_MODEL, "faq": FAQ, "rows": rows,
            "worst_should_match": worst_should, "closest_must_not_match": best_must_not,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n저장: {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
