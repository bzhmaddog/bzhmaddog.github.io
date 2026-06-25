# Resume

Built with [JSON Resume](https://jsonresume.org/). Content lives in
`resume.en.json` and is rendered to `index.html` via
[`resume-cli`](https://www.npmjs.com/package/resume-cli).

> All commands below are run from the **repo root**.

## Commands

```bash
npm run build          # render resume.en.json -> resume/index.html
npm run pdf            # generate resume/resume.pdf (single-page)
npm run validate       # validate resume.en.json against the schema
npm run audit          # ATS (Applicant Tracking System) score
```

## Customising the theme

The theme is vendored locally in `resume/theme/`. Edit `resume/theme/style.css`
to override styles. To change the layout or markup, edit `resume/theme/resume.hbs`.
