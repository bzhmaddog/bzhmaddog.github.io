# Resume

Built with [JSON Resume](https://jsonresume.org/). The resume content lives in
language-specific data files (`resume.fr.json`) and is rendered to HTML with a
theme via [`resume-cli`](https://www.npmjs.com/package/resume-cli).

## Install

```bash
npm install
```

## Commands (French)

```bash
npm run resume:validate:fr   # validate resume.fr.json against the schema
npm run resume:build:fr      # render -> fr.html
npm run resume:serve:fr      # live preview at http://localhost:4000
npm run resume:audit:fr      # ATS (Applicant Tracking System) score
npm run resume:build         # alias for resume:build:fr
```

## Adding another language

Create `resume.<lang>.json` (e.g. `resume.en.json`) and use the matching
scripts (`resume:build:en`, `resume:serve:en`, ...). JSON Resume has no built-in
i18n, so each language is a separate data file.

## Theme

Rendering uses `jsonresume-theme-class`. Browse alternatives at
<https://jsonresume.org/themes/> and pass `--theme jsonresume-theme-<slug>` to
`resume export` after installing it.