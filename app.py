from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import markdown
import yaml
from flask import Flask, abort, render_template

BASE_DIR = Path(__file__).resolve().parent
CONTENT_DIR = BASE_DIR / "projects"
DEFAULT_COVER = "img/project-cover-placeholder.svg"
DEFAULT_ACCENT = "#3f8efc"
MARKDOWN_EXTENSIONS = ["fenced_code", "tables", "codehilite"]

SITE_META: Dict[str, Any] = {
    "title": "Syricoff",
    "tagline": "Студент программной инженерии МГТУ им. Н. Э. Баумана",
    "description": (
        "Учусь строить аккуратный код, пробую веб и бэкенд на пет-проектах и ищу возможности для стажировок."
    ),
    "brand_avatar": "img/avatar.png",
    "contacts": {
        "email": "Syricov50@ya.ru",
        "telegram": "https://t.me/syricoff",
        "github": "https://github.com/syricoff",
    },
    "nav": [
        {"href": "#top", "label": "Главная"},
        {"href": "#about", "label": "Обо мне"},
        {"href": "#projects", "label": "Проекты"},
        {"href": "#contact", "label": "Контакты"},
    ],
}


@dataclass(slots=True)
class Project:
    slug: str
    title: str
    summary: str
    year: Optional[int]
    role: Optional[str]
    tech: List[str]
    github: Optional[str]
    demo: Optional[str]
    card_accent: str
    cover: Optional[str]
    hero_image: Optional[str]
    date: Optional[datetime]
    content: str
    excerpt: str

    @property
    def year_display(self) -> Optional[str]:
        return str(self.year) if self.year is not None else None


class ProjectRepository:
    def __init__(self, content_dir: Path):
        self.content_dir = content_dir
        self.content_dir.mkdir(parents=True, exist_ok=True)

    def list_projects(self) -> List[Project]:
        projects = [self._load_project(path) for path in self._iter_sources()]
        return sorted(
            projects, key=lambda item: item.date or datetime.min, reverse=True
        )

    def get_project(self, slug: str) -> Optional[Project]:
        path = self.content_dir / f"{slug}.md"
        if not path.exists():
            return None
        return self._load_project(path)

    def _iter_sources(self) -> Iterable[Path]:
        return sorted(self.content_dir.glob("*.md"))

    def _load_project(self, path: Path) -> Project:
        raw = path.read_text(encoding="utf-8")
        metadata, body = self._split_front_matter(raw)
        html = markdown.markdown(
            body, extensions=MARKDOWN_EXTENSIONS, output_format="html5"
        )

        date_value = metadata.get("date")
        parsed_date = self._parse_date(date_value)
        year = metadata.get("year")
        try:
            year = int(year) if year is not None else None
        except ValueError:
            year = None

        summary = metadata.get("summary")
        excerpt = self._build_excerpt(html)
        if not summary:
            summary = excerpt

        project = Project(
            slug=path.stem,
            title=metadata.get("title", path.stem.replace("-", " ").title()),
            summary=summary,
            year=year,
            role=metadata.get("role"),
            tech=self._ensure_list(metadata.get("tech")),
            github=metadata.get("github"),
            demo=metadata.get("demo"),
            card_accent=metadata.get("card_accent", DEFAULT_ACCENT),
            cover=self._normalize_asset(metadata.get("cover")),
            hero_image=self._normalize_asset(metadata.get("hero_image")),
            date=parsed_date,
            content=html,
            excerpt=excerpt,
        )
        return project

    @staticmethod
    def _split_front_matter(raw: str) -> tuple[Dict[str, Any], str]:
        lines = raw.splitlines()
        if lines and lines[0].strip() == "---":
            for idx in range(1, len(lines)):
                if lines[idx].strip() == "---":
                    front_matter = "\n".join(lines[1:idx])
                    body = "\n".join(lines[idx + 1 :])
                    metadata = yaml.safe_load(front_matter) or {}
                    return metadata, body.strip()
        return {}, raw.strip()

    @staticmethod
    def _parse_date(value: Any) -> Optional[datetime]:
        if not value:
            return None
        if isinstance(value, datetime):
            return value
        try:
            return datetime.fromisoformat(str(value))
        except ValueError:
            try:
                return datetime.strptime(str(value), "%Y-%m-%d")
            except ValueError:
                return None

    @staticmethod
    def _build_excerpt(html: str, *, length: int = 180) -> str:
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) <= length:
            return text
        clipped = text[: length + 1].rsplit(" ", 1)[0]
        return f"{clipped}…"

    @staticmethod
    def _ensure_list(value: Any) -> List[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item) for item in value]
        return [str(value)]

    @staticmethod
    def _normalize_asset(value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        if value.startswith("http://") or value.startswith("https://"):
            return value
        cleaned = value.lstrip("/")
        if cleaned.startswith("static/"):
            cleaned = cleaned[len("static/") :]
        return cleaned


app = Flask(__name__)
app.config.update(
    TEMPLATES_AUTO_RELOAD=True,
    FREEZER_DESTINATION=str(BASE_DIR / "build"),
    FREEZER_RELATIVE_URLS=True,
    FREEZER_BASE_URL="http://localhost:5000",
)

repository = ProjectRepository(CONTENT_DIR)


@app.context_processor
def inject_globals() -> Dict[str, Any]:
    return {
        "site_meta": SITE_META,
        "default_cover": DEFAULT_COVER,
        "default_hero": DEFAULT_COVER,
        "current_year": datetime.utcnow().year,
    }


@app.route("/")
def index():
    projects = repository.list_projects()
    return render_template("index.html", projects=projects)


@app.route("/projects/<slug>/")
def project(slug: str):
    project_item = repository.get_project(slug)
    if project_item is None:
        abort(404)
    return render_template("project.html", project=project_item)


@app.errorhandler(404)
def not_found(error):  # type: ignore[override]
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)
