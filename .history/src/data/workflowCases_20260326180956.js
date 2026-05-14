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
  patch_scoring: {
    panelTitle: "Placeholder: Attention Patches",
    panelDescription: `${caseName} top attention patches placeholder with scores and concise notes.`,
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
