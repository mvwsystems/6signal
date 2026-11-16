# /get lead-magnet pages — generator

Source for `public/get/`: the 36 comment-keyword asset pages (one per MP4 in the
"AI Adoption in AEC" playbook), their PDFs and the nine .xlsx templates.
The pages are static HTML; forms post to `app/api/get-lead`, TALK and BID call
`app/api/get-ai`, and `next.config.js` rewrites `/get/<keyword>` to
`/get/<keyword>/index.html`.

Edit content in `assets.json` (parsed from the playbook PDF) and `extras.py`
(content the playbook promised but did not spell out), styles and tools in
`static/`. Then, from this folder:

```bash
python3 sheets.py xlsx          # rebuild the .xlsx templates (openpyxl)
python3 build.py                # writes site/get/
cp ../../public/6SIGDashboardLogo.png site/
(cd site && python3 -m http.server 8765 &)
python3 pdfs.py                 # prints every page to its PDF (Playwright + Chrome)
rm -rf ../../public/get && cp -r site/get ../../public/get
```

`extract.py <playbook.pdf> assets.json && python3 fixup.py` re-parses the
playbook from scratch (PyMuPDF); only needed if the PDF changes.
