"""Assemble the static site.

Each file in src/pages/ starts with a front-matter comment:

    <!--
    title: Page title
    description: Meta description
    page: solar            (marks the matching nav link as current)
    cta_query: ?service=solar   (optional, appended to the CTA band link)
    -->

and may use these placeholders: {{nav}}, {{cta}}, {{footer}}.
Output goes to public/<same name>. Run:  python tools/build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "src", ROOT / "public"
partial = lambda name: (SRC / "partials" / f"{name}.html").read_text(encoding="utf8")

HEAD = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#004073">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="assets/img/solar-install-team.jpg">
  <script>document.documentElement.classList.add('js')</script>
  <link rel="icon" href="favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png">
  <link rel="icon" type="image/png" sizes="512x512" href="assets/favicon-512.png">
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
  <link rel="preload" href="assets/fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="styles.css">
</head>
<body data-page="{page}">
"""
TAIL = '\n<script src="main.js"></script>\n</body>\n</html>\n'


def build_page(path):
    raw = path.read_text(encoding="utf8")
    m = re.match(r"\s*<!--(.*?)-->\s*", raw, re.S)
    meta = dict(
        (k.strip(), v.strip())
        for k, v in (line.split(":", 1) for line in m.group(1).strip().splitlines() if ":" in line)
    )
    body = raw[m.end():]

    nav = partial("nav")
    page = meta.get("page", "")
    # mark the current page: the link itself, and the dropdown that contains it
    nav = nav.replace(f'data-page="{page}"', f'data-page="{page}" aria-current="page"')
    for group, pages in {"solutions": ("solar", "security", "communications", "it"), "company": ("about",)}.items():
        if page in pages:
            nav = nav.replace(f'class="dd" data-group="{group}"', f'class="dd is-current" data-group="{group}"')

    body = (body.replace("{{nav}}", nav)
                .replace("{{cta}}", partial("cta").replace("{{cta_query}}", meta.get("cta_query", "")))
                .replace("{{footer}}", partial("footer")))
    html = HEAD.format(**{k: meta.get(k, "") for k in ("title", "description", "page")}) + partial("sprite") + body + TAIL
    html = re.sub(r"[ \t]*<!--.*?-->[ \t]*\n?", "", html, flags=re.S)
    (OUT / path.name).write_text(html, encoding="utf8")
    return path.name


if __name__ == "__main__":
    built = [build_page(p) for p in sorted((SRC / "pages").glob("*.html"))]
    print("built:", ", ".join(built))
