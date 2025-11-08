# Syricoff Portfolio (Flask)

Современное портфолио разработчика на Flask с генерацией страниц проектов из markdown-файлов. В комплекте: свежий интерфейс в стиле Google Material + developer vibe, светлая/тёмная тема и возможность собрать статический билд для деплоя на статический хостинг.

## Структура

- `app.py` — приложение Flask и загрузка проектов.
- `projects/` — markdown-файлы с front matter. Каждый файл превращается в карточку и отдельную страницу.
- `templates/` и `static/` — Jinja-шаблоны, стили, скрипты и изображения.
- `freeze.py` — экспорт сайта в статический вид при помощи Frozen-Flask.

## Запуск локально

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug
```

После старта сайт доступен на `http://localhost:5000`.

## Добавление проекта

1. Создайте файл в `projects/`, например `projects/2025-awesome-tool.md`.
2. Заполните front matter и markdown:

```yaml
---
title: "Awesome Tool"
summary: "Короткое описание проекта."
date: 2025-05-10
year: 2025
role: "Ведущий разработчик"
tech:
  - TypeScript
  - Next.js
card_accent: "#7c3aed"
cover: "img/project-cover-placeholder.svg"
hero_image: "img/project-cover-placeholder.svg"
github: "https://github.com/username/awesome-tool"
demo: "https://awesome-tool.dev"
---

## Контекст
Опишите проблему, которую решали.

## Результаты
- Что было сделано.
- Какая метрика улучшилась.
```

3. Сохраните файл — при перезапуске Flask страница появится автоматически.

## Статический билд

Если требуется разместить сайт на статическом хостинге:

```bash
flask --app app routes  # убедитесь, что роуты доступны
python freeze.py
```

Готовый HTML окажется в директории `build/`. Её можно загрузить в любой static hosting (например, GitHub Pages, Cloudflare Pages, Static.app).

### Автодеплой на GitHub Pages

В репозитории уже настроен workflow `.github/workflows/deploy.yml`:

1. Убедитесь, что ваш сайт хранится в ветке `main`.
2. В настройках репозитория (`Settings → Pages`) выберите **Source: GitHub Actions**.
3. При каждом пуше в `main` GitHub Actions установит зависимости, выполнит `python freeze.py`, и загрузит содержимое `build/` в GitHub Pages.

При необходимости можно запустить workflow вручную через вкладку **Actions**.

## Деплой на постоянный хостинг

- **Dynamic**: Render, Railway, Fly.io или любой VPS с Python 3.11+. Установите зависимости, выставьте `FLASK_APP=app.py`, запустите `gunicorn app:app`.
- **Static**: Используйте `freeze.py`, затем загрузите содержимое `build/` на выбранный статический хостинг.

## Персонализация

- Обновите текст и ссылки в `SITE_META` внутри `app.py`.
- Подправьте разделы в `templates/index.html` под свой опыт.
- Добавьте собственные изображения в `static/img/` и используйте их в front matter проектов.
