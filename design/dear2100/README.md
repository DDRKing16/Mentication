# Dear 2100

The active route embeds public/dear2100-updated/index.html. app.js is the editable app logic extracted from the supplied build; assets/vendor.js retains its bundled React/UI/schema dependencies. Artwork, fonts and the supplied stylesheet remain unchanged.

Run `node scripts/build-dear2100.mjs` after editing. The normal prebuild runs this too. Do not edit generated assets/app.js directly.

Storage uses Web Locks and compare-before-write to prevent stale tabs overwriting saved books. Invalid/future-format data blocks writes. Explicit recovery preserves a raw recovery copy; migrations preserve the original under dear2100-book-v1-before-migration. Legacy default ratings cannot be distinguished from explicit ratings and are therefore unrecorded in migrated working copies. Raw backups retain the original data.

Validation at expedited merge: 53 test files / 402 tests passed, including six storage protection tests. Live pre-change and local mobile entry/practical stages were inspected in muted isolated Chrome. The user explicitly requested immediate merge before completion of full journey checks, final lint, typecheck and build. Native, final desktop journey, host back/forward, and remaining outcome/resume checks were not completed.
