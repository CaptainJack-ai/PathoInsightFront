const makeStageContent = (caseName) => ({
  uploaded: {
    panelTitle: "Placeholder: WSI Input",
    panelDescription: `${caseName} case intake: replace with your WSI upload screenshot and case brief.`,
  },
  classifying: {
    panelTitle: "Placeholder: Classification Result",
    panelDescription: `${caseName} prediction output placeholder: type and confidence values to be filled.`,
  },
  patching: {
    panelTitle: "Placeholder: Patch Tiling",
    panelDescription: `${caseName} patch generation visualization placeholder (grid/animation frames).`,
  },
  retrieving_similar: {
    panelTitle: "Placeholder: Similar Cases",
    panelDescription: `${caseName} retrieval placeholder with similar patch thumbnails and report snippets.`,
  },
  generating_report: {
    panelTitle: "Placeholder: LLM Input Summary",
    panelDescription: `${caseName} structured prompt placeholder: type + top patch + evidence report.`,
  },
  done: {
    panelTitle: "Placeholder: Final Diagnostic Report",
    panelDescription: `${caseName} final diagnosis placeholder ready for your real report text.`,
  },
});

const makeCase = (id, name) => ({
  id,
  name,
  stageImages: {
    uploaded: `/workflow-cases/${id}/uploaded.jpg`,
    classifying: `/workflow-cases/${id}/classifying.jpg`,
    patching: `/workflow-cases/${id}/patching.jpg`,
    retrieving_similar: `/workflow-cases/${id}/retrieving_similar.jpg`,
    generating_report: `/workflow-cases/${id}/generating_report.jpg`,
    done: `/workflow-cases/${id}/done.jpg`,
  },
  patchHighlights: [
    `/workflow-cases/${id}/high-attention/patch-1.jpg`,
    `/workflow-cases/${id}/high-attention/patch-2.jpg`,
    `/workflow-cases/${id}/high-attention/patch-3.jpg`,
    `/workflow-cases/${id}/high-attention/patch-4.jpg`,
    `/workflow-cases/${id}/high-attention/patch-5.jpg`,
  ],
  retrievalItems: Array.from({ length: 5 }).map((_, idx) => ({
    id: `retrieval-${idx + 1}`,
    sourceReportTitle: `Top Attention Patch Report ${idx + 1}`,
    sourceReportText: `PATCH_${idx + 1}_SUMMARY_PLACEHOLDER: concise finding from the previous attention patch stage.`,
    similarWsiImage: `/workflow-cases/${id}/similar-wsi/similar-${idx + 1}.jpg`,
    similarCaseTitle: `SIMILAR_CASE_${idx + 1}`,
    similarReportText: `SIMILAR_REPORT_${idx + 1}_PLACEHOLDER: diagnostic narrative and evidence text to be provided.`,
  })),
  stageContent: makeStageContent(name),
});

export const WORKFLOW_CASES = [
  makeCase("lung-adenocarcinoma", "Lung Adenocarcinoma"),
  makeCase("breast-idc", "Breast Invasive Ductal Carcinoma"),
  makeCase("colorectal-adenocarcinoma", "Colorectal Adenocarcinoma"),
  makeCase("gastric-adenocarcinoma", "Gastric Adenocarcinoma"),
  makeCase("hepatocellular-carcinoma", "Hepatocellular Carcinoma"),
  makeCase("renal-clear-cell", "Renal Clear Cell Carcinoma"),
  makeCase("prostate-adenocarcinoma", "Prostate Adenocarcinoma"),
  makeCase("thyroid-papillary", "Thyroid Papillary Carcinoma"),
  makeCase("cervical-squamous", "Cervical Squamous Cell Carcinoma"),
  makeCase("glioblastoma", "Glioblastoma"),
];
