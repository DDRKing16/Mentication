import library from "../../intervention-library/data/interventions.json";

export const FLAGSHIP_EVIDENCE_VERSION = library.version;

export const FLAGSHIP_EVIDENCE = Object.freeze(
  Object.fromEntries(library.interventions.map((item) => [item.id, Object.freeze({
    psychoeducation: item.psychoeducation,
    evidenceGrade: item.evidenceGrade,
    limits: item.limits,
    sources: Object.freeze(item.sources),
    reviewedOn: library.reviewedOn,
  })])),
);

export const evidenceFor = (interventionId) => FLAGSHIP_EVIDENCE[interventionId] || null;
