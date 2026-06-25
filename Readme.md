# bzhmaddog.github.io

Personal GitHub Pages site — [bzhmaddog.github.io](https://bzhmaddog.github.io)

## Structure

```
index.html        # homepage (Bootstrap 5, links to sub-projects)
resume/           # JSON Resume — see resume/Readme.md
img/              # root-level assets
```

> **H5DMD** (`/H5DMD/`) lives in a separate repository and is deployed independently.

## Dev

```bash
npm install
npm run dev       # watch + serve at http://localhost:3000
npm run build     # rebuild resume/index.html
npm run pdf       # generate resume/resume.pdf (single-page)
npm run audit     # ATS score for the resume
```

## Pre-commit hook

A [husky](https://typicode.github.io/husky/) pre-commit hook automatically rebuilds `resume/index.html` and `resume/resume.pdf` before every commit and stages both files, so the generated artefacts are always in sync with the source.

The hook is installed automatically by `npm install` via the `prepare` script. To test it manually:

```bash
bash .husky/pre-commit
```

## Deploy

Push to `master` — GitHub Pages serves the repo root automatically.
