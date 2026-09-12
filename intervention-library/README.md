# Mentication Elite Intervention Library

This folder is the canonical planning and asset package for the 17-intervention library.

## Final deliverables

- `final/boards/` — one approved, copy-ready design board per intervention.
- `final/assets/` — one curated signature visual per intervention. Existing approved work is retained; only six missing systems were generated.
- `final/manifest.json` — file inventory and SHA-256 checksums for the final boards and assets.
- `../../output/pdf/mentation-elite-intervention-library.pdf` — compiled intervention library.

## Working records

- `data/interventions.json` — canonical names, goals, design systems, purpose, science, sequences, visual/audio direction and Mentication upgrades.
- `evidence/psychoeducation-evidence-register.md` — evidence and limits for all 17 interventions.
- `sequence-approval-register.md` — reviewed canonical pathways and cross-library safety conditions.
- `asset-generation-register.md` — provenance and creative direction for the six newly generated assets.
- `source-assets/` — preserved copies of the supplied boards/assets and existing project visuals. These are references, not the final set.

Rebuild the complete package with:

```bash
/Users/dylandesai-rogers/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3.12 scripts/build_intervention_library.py --all
```

