# bzhmaddog.github.io

Personal GitHub Pages site — [bzhmaddog.github.io](https://bzhmaddog.github.io)

## Structure

```
index.html              # homepage (Bootstrap 5, project cards)
package.json            # root npm manifest — all scripts and devDependencies
.husky/
└── pre-commit          # auto-rebuilds HTML + PDF before every commit
resume/
├── resume.en.json      # source of truth (JSON Resume schema)
├── index.html          # generated — do not edit manually
├── resume.pdf          # generated — do not edit manually
├── export-pdf.js       # puppeteer script for single-page PDF export
├── Readme.md           # resume-specific docs
└── theme/              # vendored spartan theme (Handlebars + CSS)
    ├── index.js        # renderer + custom helpers
    ├── resume.hbs      # Handlebars template
    ├── style.css       # stylesheet (edit here to customise)
    └── package.json    # theme metadata
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
