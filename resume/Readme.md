# Resume

Built with [JSON Resume](https://jsonresume.org/). Content lives in
`resume.en.json` and is rendered to `index.html` via
[`resume-cli`](https://www.npmjs.com/package/resume-cli).

> All commands below are run from the **repo root**.

## Commands

```bash
npm run dev            # watch + serve at http://localhost:3000 (rebuild on change)
npm run build          # one-shot render -> resume/index.html
npm run watch          # rebuild on change (theme/** or resume.en.json), no server
npm run serve          # static server only at http://localhost:3000, no watch
npm run validate       # validate resume.en.json against the schema
npm run audit          # ATS (Applicant Tracking System) score
```

## Customising the theme

The theme is vendored locally in `resume/theme/`. Edit `resume/theme/style.css`
to override styles — changes are picked up automatically when running `npm run dev`
from the repo root. To change the layout or markup, edit `resume/theme/resume.hbs`.
