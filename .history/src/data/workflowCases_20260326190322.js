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

const makePatchHighlightPaths = (id) =>
  Array.from({ length: 5 }).map((_, idx) => `/workflow-cases/${id}/high-attention/patch-${idx + 1}.jpg`);

const makeCase = (id, name, classificationLabel = "CLASS_PLACEHOLDER") => {
  const patchHighlights = makePatchHighlightPaths(id);

  return {
    id,
    name,
    classificationLabel,
    stageImages: {
      uploaded: `/workflow-cases/${id}/uploaded.jpg`,
      classifying: `/workflow-cases/${id}/classifying.jpg`,
      patching: `/workflow-cases/${id}/patching.jpg`,
      retrieving_similar: `/workflow-cases/${id}/retrieving_similar.jpg`,
      generating_report: `/workflow-cases/${id}/generating_report.jpg`,
      done: `/workflow-cases/${id}/done.jpg`,
    },
    patchHighlights,
    retrievalItems: Array.from({ length: 5 }).map((_, idx) => ({
      id: `retrieval-${idx + 1}`,
      sourcePatchImage: patchHighlights[idx],
      sourcePatchPath: patchHighlights[idx],
      similarWsiImage: `/workflow-cases/${id}/similar-wsi/similar-${idx + 1}.jpg`,
      similarCaseTitle: `SIMILAR_CASE_${idx + 1}`,
      similarReportText: `SIMILAR_REPORT_${idx + 1}_PLACEHOLDER: diagnostic narrative and evidence text to be provided.`,
    })),
    reportPdf: `/workflow-cases/${id}/report/diagnosis-report.pdf`,
    stageContent: makeStageContent(name),
  };
};

export const WORKFLOW_CASES = [
  makeCase("lung-adenocarcinoma", "Lung Adenocarcinoma", "LUNG ADENOCARCINOMA"),
  makeCase("breast-idc", "Breast Invasive Ductal Carcinoma", "BREAST INVASIVE DUCTAL CARCINOMA"),
  makeCase("colorectal-adenocarcinoma", "Colorectal Adenocarcinoma", "COLORECTAL ADENOCARCINOMA"),
  makeCase("gastric-adenocarcinoma", "Gastric Adenocarcinoma", "GASTRIC ADENOCARCINOMA"),
  makeCase("hepatocellular-carcinoma", "Hepatocellular Carcinoma", "HEPATOCELLULAR CARCINOMA"),
  makeCase("renal-clear-cell", "Renal Clear Cell Carcinoma", "RENAL CLEAR CELL CARCINOMA"),
  makeCase("prostate-adenocarcinoma", "Prostate Adenocarcinoma", "PROSTATE ADENOCARCINOMA"),
  makeCase("thyroid-papillary", "Thyroid Papillary Carcinoma", "THYROID PAPILLARY CARCINOMA"),
  makeCase("cervical-squamous", "Cervical Squamous Cell Carcinoma", "CERVICAL SQUAMOUS CELL CARCINOMA"),
  makeCase("glioblastoma", "Glioblastoma", "GLIOBLASTOMA"),
];
