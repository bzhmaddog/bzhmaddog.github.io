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
npm run audit     # ATS score for the resume
```

## Deploy

Push to `master` — GitHub Pages serves the repo root automatically.
