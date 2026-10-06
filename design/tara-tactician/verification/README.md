# Tara final verification

The practice-first visual gate at `4da45b8` was independently reviewed and approved. The sole requested visual polish is applied: the native reflection select says “Choose an answer”; its unknown action option remains available. The final production screenshots here show that change.

A regression check also corrected direct-live editing: its editor starts with the displayed “Let me take a moment” suggestion and does not populate unchosen backup fields.

Passed: 33 Tara unit tests; all 435 project tests in 54 files; lint; typecheck; standard production build; isolated Tara production build; 20 development-browser scenarios; and 2 complete production-mobile flows. Browser and production JSON record exact coverage, including legacy drafts/recaps, explicit rehearsal confirmation, all five prediction results, failure/retry/deletion, refresh/Back/revisit, keyboard/focus, reduced motion, enlarged text and long private wording. No browser page errors or production request failures occurred. The standard build retains the existing large-chunk warning.

`production-results.json` includes screenshot dimensions and SHA-256 hashes. All fixtures are synthetic; no personal data or real-world outcomes are claimed. 320px screenshots set the root font to 24px, 150% of the default, and use reduced-motion preference. The earlier full visual gate remains at `../screenshots/practice-first-gate/`.

Reproduce development-browser checks with Vite running on port 5174:

```sh
node scripts/tara-tactician.browser.mjs
```

Build the isolated production preview without changing host registration:

```sh
node --input-type=module -e "import { build } from 'vite'; await build({build:{outDir:'/workspace/tara-practice-build',emptyOutDir:true,rollupOptions:{input:'/workspace/Mentication/design/tara-tactician/preview.html'}}});"
python3 -m http.server 5180 --bind 127.0.0.1 --directory /workspace/tara-practice-build
```

Then, in another terminal:

```sh
node scripts/tara-tactician.production.mjs
```

Both browser scripts accept `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `TARA_PREVIEW_URL` and `TARA_EVIDENCE_DIR` overrides. The defaults describe this executor and can be changed for another environment. No dependencies were added.

Parent owns catalogue/router registration, coarse outcome allowlisting, memory/export integration and combined navigation tests. Callback props are unchanged. Additive `predictionResult` is separate from legacy difficulty `predictionComparison`; neither is inferred from the other. The unchanged `mentation.tara-tactician.v1` container supports legacy records and rejects future experience versions without overwriting data. Native iOS testing remains outstanding. This is task-branch work; no main merge or deployment occurred.
