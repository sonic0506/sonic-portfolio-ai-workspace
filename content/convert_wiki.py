#!/usr/bin/env python3
"""Rebuild content/ from the Notion wiki export and the study notes (rules: content/README.md).

    python3 content/convert_wiki.py "/path/to/notion-wikis" "/path/to/sonic-study-notes/notes" \
        "/path/to/ai-github-study-automation/learning-notes"

Regenerates projects/, blog/, skills.md and taxonomy.md. Choices that need judgment
(slugs, categories, tags, featured) live in the tables below; everything else is mechanical.
"""
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

OUT = Path(__file__).resolve().parent
CREATED = "2026-10-04"

# wiki folder -> (slug, organization). `template/` is a fictional example and is not listed.
PROJECTS = {
    "AI 개발자 포트폴리오": ("ai-portfolio", None),
    "VIORA": ("viora", "슬로그업"),
    "현대모비스 브링앤티": ("bring-and-t", None),
    "EVAR": ("evar", None),
    "USB 모뎀 설정 웹": ("usb-modem-web", None),
    "순찰 로봇 관제 PoC": ("patrol-robot", None),
    "SK쉴더스·캡스홈·사이버가드": ("sk-shieldus", None),
    "ECOYA EARTH": ("ecoya-earth", None),
    "플러스팟": ("pluspot", None),
    "부스트리": ("boostree", None),
    "오픈마일": ("openmile", None),
    "SK렌터카 다이렉트": ("sk-rentacar", None),
    "민팃": ("mintit", None),
}
FEATURED = {"ai-portfolio", "viora", "bring-and-t"}

# (wiki folder, decision file stem) -> (slug, category, tags). Category follows the decision doc's "유형" row.
BLOGS = {
    ("AI 개발자 포트폴리오", "01-no-answer-judgment"): ("ai-portfolio-no-answer", "기술선택", ["rag", "임베딩", "성능 측정"]),
    ("AI 개발자 포트폴리오", "02-faq-matching"): ("ai-portfolio-faq-matching", "기술선택", ["rag", "faq", "프롬프트"]),
    ("AI 개발자 포트폴리오", "03-docs-driven-ai-workflow"): ("ai-portfolio-docs-workflow", "협업", ["ai 개발", "문서화"]),
    ("ECOYA EARTH", "01-content-template-management"): ("ecoya-content-template", "기술선택", ["템플릿", "webview", "관리자"]),
    ("ECOYA EARTH", "02-mobile-web-navigation"): ("ecoya-mobile-web-navigation", "기술선택", ["모바일 웹", "브라우저 히스토리", "실기기 테스트"]),
    ("EVAR", "01-related-page-navigation"): ("evar-related-page-tabs", "협업", ["정보 구조", "관리자"]),
    ("EVAR", "02-credit-creation-and-assignment"): ("evar-credit-flow", "협업", ["업무 흐름", "관리자"]),
    ("SK렌터카 다이렉트", "01-live-pip-layout"): ("sk-rentacar-live-pip", "트러블슈팅", ["라이브 방송", "레이아웃"]),
    ("SK렌터카 다이렉트", "02-promotion-section-renderer"): ("sk-rentacar-promotion-sections", "기술선택", ["관리자", "템플릿"]),
    ("SK쉴더스·캡스홈·사이버가드", "01-webflow-vue-integration"): ("sk-webflow-vue", "기술선택", ["webflow", "vue"]),
    ("SK쉴더스·캡스홈·사이버가드", "02-subscription-flow"): ("sk-subscription-flow", "협업", ["결제", "테스트 시나리오"]),
    ("USB 모뎀 설정 웹", "01-offline-scope"): ("usb-modem-offline-scope", "기술선택", ["오프라인", "service worker"]),
    ("VIORA", "01-processing-location"): ("viora-processing-location", "기술선택", ["온디바이스", "음성 AI", "성능 측정"]),
    ("VIORA", "02-hardware-proposals"): ("viora-hardware-proposals", "협업", ["센서", "bluetooth"]),
    ("민팃", "01-react-scope-under-contract"): ("mintit-react-scope", "기술선택", ["기술 도입", "레거시"]),
    ("부스트리", "01-hospital-web-and-deployment"): ("boostree-seed-and-deploy", "기술선택", ["배포 자동화", "멀티 사이트"]),
    ("부스트리", "02-aws-infra-cost"): ("boostree-aws-infra-cost", "트러블슈팅", ["aws", "비용 절감", "멀티 사이트"]),
    ("순찰 로봇 관제 PoC", "01-request-response-correlation"): ("patrol-robot-request-correlation", "기술선택", ["websocket", "프로토콜"]),
    ("순찰 로봇 관제 PoC", "02-stream-process-cleanup"): ("patrol-robot-stream-cleanup", "트러블슈팅", ["websocket", "ffmpeg", "프로세스 관리"]),
    ("오픈마일", "01-url-query-state"): ("openmile-url-query-state", "기술선택", ["url 상태", "관리자"]),
    ("오픈마일", "02-map-auto-refresh"): ("openmile-map-auto-refresh", "트러블슈팅", ["지도", "상태 관리"]),
    ("플러스팟", "01-client-logout-cleanup"): ("pluspot-logout-cleanup", "트러블슈팅", ["인증", "상태 관리"]),
    ("현대모비스 브링앤티", "01-fsd-boundaries"): ("bring-and-t-fsd-boundaries", "기술선택", ["fsd", "폴더 구조"]),
    ("현대모비스 브링앤티", "02-ai-page-workflow"): ("bring-and-t-ai-workflow", "협업", ["ai 개발", "코드 리뷰"]),
}

CATEGORIES = [  # (code, name, color, rag) in display order. rag: used as chat evidence (ADR-0018)
    # Real project experience (2026-10-05 user decision)
    ("troubleshooting", "트러블슈팅", "#C2553A", True),
    ("tech-choice", "기술선택", "#3F6FB5", True),
    ("collaboration", "협업", "#2F8A6E", True),
    # Study posts: shown on the site, kept out of chat evidence
    ("frontend", "프론트엔드", "#C7772A", False),
    ("backend", "백엔드", "#5E7FA8", False),
    ("ai", "AI", "#C2477A", False),
    ("architecture", "아키텍처", "#7F5FC0", False),
    ("infra", "배포·인프라", "#B35A3F", False),
    ("ai-tools", "AI 도구", "#5B8C2A", False),
]
TAG_CODES = {
    "템플릿": "template", "webview": "webview", "관리자": "admin", "모바일 웹": "mobile-web",
    "브라우저 히스토리": "browser-history", "실기기 테스트": "device-testing", "정보 구조": "information-architecture",
    "업무 흐름": "workflow", "webflow": "webflow", "vue": "vue", "결제": "payment", "테스트 시나리오": "test-scenario",
    "온디바이스": "on-device", "음성 AI": "voice-ai", "성능 측정": "measurement", "센서": "sensor",
    "bluetooth": "bluetooth", "배포 자동화": "deploy-automation", "멀티 사이트": "multi-site", "인증": "auth",
    "상태 관리": "state-management", "fsd": "fsd", "폴더 구조": "folder-structure", "ai 개발": "ai-development",
    "코드 리뷰": "code-review", "rag": "rag", "임베딩": "embedding", "faq": "faq", "프롬프트": "prompt",
    "문서화": "documentation", "라이브 방송": "live-streaming", "레이아웃": "layout", "오프라인": "offline",
    "service worker": "service-worker", "기술 도입": "tech-adoption", "레거시": "legacy", "aws": "aws",
    "비용 절감": "cost-optimization", "websocket": "websocket", "프로토콜": "protocol", "ffmpeg": "ffmpeg",
    "프로세스 관리": "process-management", "url 상태": "url-state", "지도": "map",
}

# "주요 기술" cleanup. Parentheses are dropped first ("Next.js(App Router)" -> "Next.js").
SKILL_ALIASES = {
    "Java 21": "Java", "Java Spring 환경": "Spring", "OpenAI gpt-4.1-mini": "OpenAI",
    "text-embedding-3-small": "OpenAI", "Material-UI": "MUI", "antd": "Ant Design", "formik": "Formik",
}
SKILL_SKIP = {"FSD"}  # an architecture approach, kept as a blog tag instead
SKILL_CODES = {"네이버 지도": "naver-maps", "토스페이먼츠 결제위젯": "toss-payments-widget",
               "나이스평가정보 CheckPlus": "nice-checkplus"}

# Study notes (Obsidian llm-wiki): blog category from the first matching note tag (2026-10-05 user decision).
NOTE_CATEGORIES = [("ai", "AI"), ("architecture", "아키텍처"), ("devops", "배포·인프라"),
                   ("frontend", "프론트엔드"), ("api", "백엔드"), ("network", "백엔드")]
# [[target]], [[target|label]], [[target\|label]] (escaped inside tables), optional #heading
WIKILINK_RE = re.compile(r"(?<!!)\[\[([^\]|\\#]+)(?:#[^\]|\\]*)?(?:\\?\|([^\]]+))?\]\]")
# Fenced code closes only on the same fence character at least as long (```` may wrap ```), or inline code.
CODE_RE = re.compile(r"^[ \t]*(`{3,}|~{3,})[^\n]*\n.*?^[ \t]*\1[`~]*[ \t]*$|`[^`\n]*`", re.S | re.M)


def split_code(text):
    """[(is_code, part)] so prose edits never touch code."""
    parts, pos = [], 0
    for m in CODE_RE.finditer(text):
        parts += [(False, text[pos:m.start()]), (True, m.group(0))]
        pos = m.end()
    return parts + [(False, text[pos:])]

# AI tool study series (learning-notes/<tool>/README.md + 01..08): one tool -> one blog post (2026-10-05).
SERIES_CATEGORY = "AI 도구"
NAV_RE = re.compile(r"^\[[^\]]+\]\([^)]+\.md\)(\s*·\s*\[[^\]]+\]\([^)]+\.md\))*$")  # ← prev · 목차 · next →
SERIES_LINK_RE = re.compile(r"\[([^\]]+)\]\(((?:README|\d{2}-[^)#]+)\.md)(?:#([^)]+))?\)")

LINK_RE = re.compile(r"^- \[(.+?)\]\(decisions/([^)]+)\.md\)")
IMAGE_RE = re.compile(r"^!\[[^\]]*\]\([^)]*\)\s*$")
MD_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+\.md)\)")


def q(value):
    return json.dumps(value, ensure_ascii=False)


def front_matter(fields):
    lines = ["---"]
    for key, value in fields.items():
        if isinstance(value, dict):
            lines.append(f"{key}:")
            lines += [f"  {k}: {q(v)}" for k, v in value.items()]
        else:
            lines.append(f"{key}: {q(value)}")
    return "\n".join(lines + ["---", ""])


def split_sections(text):
    """(title, [(heading, body)]) for a '# title' + '## section' document; text before the first ## is section ''."""
    lines = text.split("\n")
    title = lines[0].removeprefix("# ").strip()
    sections, heading, body = [], "", []
    for line in lines[1:]:
        if line.startswith("## "):
            sections.append((heading, body))
            heading, body = line[3:].strip(), []
        else:
            body.append(line)
    sections.append((heading, body))
    return title, sections


def drop_images(body):
    kept = [line for line in body if not IMAGE_RE.match(line)]
    return kept, len(body) - len(kept)


def tidy(lines):
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def table_value(body, key):
    for line in body:
        m = re.match(rf"^\| {re.escape(key)} \| (.*) \|$", line)
        if m:
            return m.group(1).strip()
    return None


def parse_period(value):
    m = re.match(r"(\d{4})\.(\d{2})\s*~\s*(?:(\d{4})\.(\d{2})|진행 중)", value)
    start = f"{m.group(1)}-{m.group(2)}"
    end = f"{m.group(3)}-{m.group(4)}" if m.group(3) else None
    return start, end


def parse_skills(value):
    names = []
    for part in re.split(r"[,/]", re.sub(r"\([^)]*\)", "", value)):
        name = re.sub(r"^[^:]+:\s*", "", part.strip())
        name = SKILL_ALIASES.get(name, name)
        if name and name not in SKILL_SKIP and name not in names:
            names.append(name)
    return names


def bold_labels(body):
    return [m.group(1).strip().rstrip(":").strip() for line in body if (m := re.match(r"^- \*\*(.+?)\*\*", line))]


def mentions(text, name):
    return re.search(rf"(?<![A-Za-z]){re.escape(name)}(?![A-Za-z])", text, re.IGNORECASE) is not None


def convert_project(folder):
    slug, organization = PROJECTS[folder]
    title, sections = split_sections((WIKI / folder / "README.md").read_text())
    by_heading = dict(sections)
    overview = by_heading["프로젝트 개요"]
    period_start, period_end = parse_period(table_value(overview, "기간"))
    skills = parse_skills(table_value(overview, "주요 기술"))
    summary = tidy(overview).split("\n\n")[0]

    related, blog_summaries, out_sections, images = [], {}, [], 0
    for heading, body in sections:
        if heading == "결정사항 / 트러블슈팅":
            current = None
            for line in body:
                if m := LINK_RE.match(line):
                    current = BLOGS[(folder, m.group(2))][0]
                    related.append(current)
                    blog_summaries[current] = []
                elif current and line.startswith("  ") and line.strip():
                    blog_summaries[current].append(line.strip())
                elif line.strip():
                    # A note after the list ("공통 원칙은 브링앤티 문서에…") links other projects' posts: keep the links as references.
                    current = None
                    for other, stem in re.findall(r"\]\(\.\./([^/)]+)/decisions/([^)]+)\.md\)", line):
                        related.append(BLOGS[(unquote(other), stem)][0])
            continue
        if not heading:
            continue
        if heading == "프로젝트 개요":
            body = [line for line in body if not re.match(r"^\| (기간|주요 기술) \|", line)]
        body, dropped = drop_images(body)
        images += dropped
        out_sections.append(f"## {heading}\n\n{tidy(body)}")

    highlights = bold_labels(by_heading.get("주요 성과") or by_heading.get("학습 내용") or [])
    notes = [f"원본 이미지 {images}개는 이미지 업로드 기능이 없어 뺐다."] if images else []
    meta = {
        "type": "project", "id": slug, "title": title, "summary": summary, "highlights": highlights,
        "period_start": period_start, "period_end": period_end, "ongoing": period_end is None,
        "organization": organization, "position": table_value(overview, "나의 역할"), "contribution": None,
        "featured": slug in FEATURED, "published": True, "thumbnail": None, "skills": skills,
        "links": {"github": None, "service": None}, "related_blogs": related, "open_questions": notes,
    }
    text = front_matter(meta) + "\n" + "\n\n".join(out_sections) + "\n"
    return slug, period_start, skills, text, {s: " ".join(v) for s, v in blog_summaries.items()}


def convert_blog(folder, stem, summary, project_skills):
    slug, category, tags = BLOGS[(folder, stem)]
    title, sections = split_sections((WIKI / folder / "decisions" / f"{stem}.md").read_text())
    notes, related, out_sections, images = [], [], [], 0
    blog_by_file = {f"{s}.md": v[0] for (f, s), v in BLOGS.items() if f == folder}
    for heading, body in sections:
        kept = []
        for line in body:
            if "프로젝트 본문으로 돌아가기" in line:
                continue
            for text, target in MD_LINK_RE.findall(line):
                name = target.split("/")[-1]
                if name in blog_by_file:
                    related.append(blog_by_file[name])
                else:
                    notes.append(f"참고: {text}({target}, 블로그로 옮기지 않은 원본).")
            if MD_LINK_RE.search(line) and line.strip().startswith("참고:"):
                continue  # a lone pointer to an excluded file
            kept.append(MD_LINK_RE.sub(r"\1", line))
        body, dropped = drop_images(kept)
        images += dropped
        text = re.sub(r"\n*---$", "", tidy(body))  # separator left behind by a removed trailing note
        if text:
            out_sections.append(f"## {heading or '개요'}\n\n{text}")
    if images:
        notes.append(f"원본 이미지 {images}개는 이미지 업로드 기능이 없어 뺐다.")
    body_text = "\n\n".join(out_sections)
    meta = {
        "type": "blog", "id": slug, "title": title, "summary": summary,
        "created_at": CREATED, "updated_at": CREATED, "published": True,
        "category": category, "tags": tags,
        "skills": [s for s in project_skills if mentions(body_text, s)],
        "related_projects": [], "related_blogs": related, "open_questions": notes,
    }
    return slug, meta["skills"], front_matter(meta) + "\n" + body_text + "\n"


def read_note(path):
    """(front matter text, title, body after the H1) of one study note."""
    m = re.match(r"^---\n(.*?)\n---\n", path.read_text(), re.S)
    title_line, _, body = path.read_text()[m.end():].lstrip().partition("\n")
    return m.group(1), title_line.removeprefix("# ").strip(), body.strip()


def convert_note(path, titles):
    slug = path.stem
    fm, title, body = read_note(path)
    targets = re.findall(r"\[\[([^\]|#]+)", fm)  # prerequisites + related

    def link(m):
        target, label = m.group(1).strip(), m.group(2)
        if target not in titles:
            raise SystemExit(f"{path.name}: broken link [[{target}]]")
        targets.append(target)
        return f"[{(label or titles[target]).strip()}](/blog/{target})"

    # Code blocks keep their [[ ]] as written; only prose links become site links.
    body = "".join(part if code else WIKILINK_RE.sub(link, part) for code, part in split_code(body))
    note_tags = [t.strip() for t in re.search(r"^tags:\s*\[(.*)\]", fm, re.M).group(1).split(",")]
    category = next(name for tag, name in NOTE_CATEGORIES if tag in note_tags)
    # A note tag whose code an existing tag already uses (embedding -> 임베딩) joins that tag.
    by_code = {code: name for name, code in TAG_CODES.items()}
    tags = []
    for tag in note_tags:
        name = by_code.get(tag, tag)
        TAG_CODES.setdefault(name, tag)
        tags.append(name)
    first = body.split("\n## ", 1)[0].partition("\n")[2] if body.startswith("## ") else body
    paragraph = next(p for p in first.strip().split("\n\n") if not p.lstrip().startswith(("```", "|", ">", "#")))
    summary = re.sub(r"\*\*|`", "", re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", " ".join(paragraph.split("\n"))))
    created = re.search(r"^created:\s*(\S+)", fm, re.M).group(1)
    related = list(dict.fromkeys(t for t in targets if t != slug))
    meta = {
        "type": "blog", "id": slug, "title": title, "summary": summary,
        "created_at": created, "updated_at": created, "published": True,
        "category": category, "tags": tags, "skills": [],
        "related_projects": [], "related_blogs": related, "open_questions": [],
    }
    return slug, tags, front_matter(meta) + "\n" + body + "\n"


def plain(text):
    """Heading text as the page renders it (no inline markdown)."""
    return re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text).replace("`", "").replace("**", "").strip()


def heading_id(text):
    """Same id as frontend/portfolio/src/lib/headings.ts headingId()."""
    return "h-" + re.sub(r"[\W_]+", "-", text.strip().lower()).strip("-")


def github_slug(text):
    """GitHub-style anchor the source files use in `file.md#anchor` links."""
    return re.sub(r"\s", "-", re.sub(r"[^\w\s-]", "", text.strip().lower()))


def prose_sub(pattern, repl, text, flags=0):
    """re.sub outside code blocks and inline code."""
    return "".join(part if code else re.sub(pattern, repl, part, flags=flags) for code, part in split_code(text))


def series_source(series_dir, tool):
    """(repository, url, date) from studies/<owner>__<tool>.md, else registry + the git add date."""
    root = series_dir.parent
    for study in (root / "studies").glob(f"*__{tool}.md"):
        fm = study.read_text().split("\n---\n", 1)[0]
        get = lambda key: re.search(rf"^{key}:\s*(\S+)", fm, re.M).group(1)
        return get("repository"), get("url"), get("studiedAt")
    repos = json.loads((root / "data" / "registry.json").read_text())["repositories"]
    repo = next(r for r in repos if r.split("/")[1].lower() == tool)
    dates = subprocess.run(["git", "log", "--diff-filter=A", "--format=%ad", "--date=short", "--",
                            f"{tool}/README.md"], cwd=series_dir, capture_output=True,
                           text=True, check=True).stdout.split()
    return repo, f"https://github.com/{repo}", dates[-1]


def drop_nav(text):
    """Remove the closing '---' + '← prev · 목차 · next →' line; the merged post has its own table of contents."""
    lines = text.split("\n")
    if NAV_RE.match(lines[-1].strip()):
        lines.pop()
        while lines and lines[-1].strip() in ("", "---"):
            lines.pop()
    return "\n".join(lines)


def convert_series(series_dir, tool):
    folder = series_dir / tool
    files = [folder / "README.md"] + sorted(folder.glob("[0-9][0-9]-*.md"))
    docs = {p.name: p.read_text().strip() for p in files}
    titles = {name: text.split("\n", 1)[0].removeprefix("# ").strip() for name, text in docs.items()}
    # Chapters become ## sections, their ## become ### (which get ids); README links land on 개요.
    chapter_anchor = {name: heading_id("개요" if name == "README.md" else plain(t)) for name, t in titles.items()}
    heading_anchor = {}
    for name, text in docs.items():
        for h in re.findall(r"^## (.+)$", "".join(p for code, p in split_code(text) if not code), re.M):
            heading_anchor[(name, github_slug(plain(h)))] = heading_id(plain(h))

    readme = drop_nav(docs["README.md"].split("\n", 1)[1].strip())
    intro, _, rest = readme.partition("\n## ")
    summary = " ".join(l.removeprefix(">").strip() for l in intro.split("\n") if l.startswith(">")).strip()
    sections = [f"## 개요\n\n{intro.strip()}"]
    sections += ["## " + s.strip() for s in ("\n" + rest).split("\n## ") if s.strip() and not s.strip().startswith("문서 목차")]
    for path in files[1:]:
        body = drop_nav(docs[path.name].split("\n", 1)[1].strip())
        body = prose_sub(r"^(#{2,5}) ", r"#\1 ", body, re.M)
        sections.append(f"## {titles[path.name]}\n\n{body}")
    repo, url, created = series_source(series_dir, tool)
    sections.append(f"## 원본 저장소\n\n[{repo}]({url})")

    unresolved = []

    def relink(m):
        label, target, frag = m.groups()
        anchor = heading_anchor.get((target, frag)) if frag else None
        if frag and not anchor:
            unresolved.append(f"{target}#{frag}")
        return f"[{label}](#{anchor or chapter_anchor[target]})"

    body = prose_sub(SERIES_LINK_RE, relink, "\n\n".join(sections))
    meta = {
        "type": "blog", "id": tool, "title": titles["README.md"], "summary": summary,
        "created_at": created, "updated_at": created, "published": True,
        "category": SERIES_CATEGORY, "tags": [], "skills": [],
        "related_projects": [], "related_blogs": [], "open_questions": [],
    }
    return front_matter(meta) + "\n" + body + "\n", unresolved


def existing_skills():
    """name -> (code, usage) from the current skills.md, so codes stay stable across runs."""
    path = OUT / "skills.md"
    found = {}
    if path.exists():
        for line in path.read_text().split("\n"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if line.startswith("|") and len(cells) == 3 and cells[0] not in ("id", "---"):
                found[cells[1]] = (cells[0], cells[2])
    return found


def main():
    old_skills = existing_skills()
    for sub in ("projects", "blog"):
        (OUT / sub).mkdir(exist_ok=True)
        for old in (OUT / sub).glob("*.md"):
            old.unlink()

    projects = [(folder, *convert_project(folder)) for folder in PROJECTS]
    projects.sort(key=lambda p: p[2], reverse=True)  # newest start first; stable for ties
    usage = {}
    for index, (folder, slug, _, skills, text, summaries) in enumerate(projects, 1):
        (OUT / "projects" / f"{index:02d}-{slug}.md").write_text(text)
        for name in skills:
            usage.setdefault(name, []).append(slug)
        for (f, stem), (blog_slug, _, _) in BLOGS.items():
            if f == folder:
                b_slug, b_skills, b_text = convert_blog(f, stem, summaries.get(blog_slug), skills)
                (OUT / "blog" / f"{b_slug}.md").write_text(b_text)
                for name in b_skills:
                    usage[name].append(b_slug)

    rows, seen = [], set()
    for name in list(usage) + [n for n in old_skills if n not in usage and "profile" in old_skills[n][1]]:
        code = old_skills[name][0] if name in old_skills else (
            SKILL_CODES.get(name) or re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"))
        assert code and code not in seen, f"skill code clash or empty: {name} -> {code}"
        seen.add(code)
        used = usage.get(name, []) + (["profile"] if "profile" in old_skills.get(name, ("", ""))[1] else [])
        rows.append(f"| {code} | {name} | {', '.join(used)} |")
    (OUT / "skills.md").write_text(
        "# Shared Skill Catalog\n\n`id`는 참조 키, `name`은 표시명이다. `profile`은 프로필이 참조한다는 뜻이다. "
        "`convert_wiki.py`가 만든다.\n\n| id | name | 사용처 |\n|---|---|---|\n" + "\n".join(rows) + "\n")

    used_tags = []
    for _, _, tags in BLOGS.values():
        used_tags += [t for t in tags if t not in used_tags]

    notes = sorted(NOTES.glob("*.md")) if NOTES else []
    titles = {p.stem: read_note(p)[1] for p in notes}
    clash = set(titles) & {slug for slug, _, _ in BLOGS.values()}
    assert not clash, f"note slugs clash with wiki blogs: {clash}"
    for path in notes:
        slug, tags, text = convert_note(path, titles)
        (OUT / "blog" / f"{slug}.md").write_text(text)
        used_tags += [t for t in tags if t not in used_tags]

    tools = sorted(p.name for p in SERIES.iterdir() if (p / "README.md").exists()) if SERIES else []
    clash = set(tools) & (set(titles) | {slug for slug, _, _ in BLOGS.values()})
    assert not clash, f"series slugs clash with other blogs: {clash}"
    for tool in tools:
        text, unresolved = convert_series(SERIES, tool)
        (OUT / "blog" / f"{tool}.md").write_text(text)
        for link in unresolved:
            print(f"  {tool}: anchor not found, linked to the chapter instead: {link}")
    (OUT / "taxonomy.md").write_text(
        "# Blog Category / Tag Codes\n\n블로그 front matter의 표시명을 DB code로 바꾸는 표다. 표에 없는 이름은 시드가 실패한다. "
        "`convert_wiki.py`가 만든다.\n\n## Categories\n\n`rag`는 이 카테고리 글을 채팅 근거로 쓸지다(ADR-0018, 어드민에서 바꿀 수 있다).\n\n"
        "| code | name | display_order | color | rag |\n|---|---|---|---|---|\n"
        + "\n".join(f"| {c} | {n} | {i} | {color} | {str(rag).lower()} |"
                    for i, (c, n, color, rag) in enumerate(CATEGORIES))
        + "\n\n## Tags\n\n| code | name |\n|---|---|\n"
        + "\n".join(f"| {TAG_CODES[t]} | {t} |" for t in used_tags) + "\n")
    print(f"projects {len(projects)}, blogs {len(BLOGS)} + notes {len(notes)} + tools {len(tools)}, "
          f"skills {len(rows)}, tags {len(used_tags)}")


if __name__ == "__main__":
    WIKI = Path(sys.argv[1])
    NOTES = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    SERIES = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    main()
