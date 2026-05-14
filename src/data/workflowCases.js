const makeStageContent = (caseName) => ({
  uploaded: {
    panelTitle: "占位：WSI 输入",
    panelDescription: `${caseName} 的病例接收信息：可替换为你的上传截图与病例摘要。`,
  },
  classifying: {
    panelTitle: "占位：分类结果",
    panelDescription: `${caseName} 的预测输出占位：可填写病理类型与置信度。`,
  },
  patching: {
    panelTitle: "占位：切片分块",
    panelDescription: `${caseName} 的分块可视化占位（网格/动画帧）。`,
  },
  retrieving_similar: {
    panelTitle: "占位：相似病例检索",
    panelDescription: `${caseName} 的检索占位：相似切片缩略图与报告片段。`,
  },
  generating_report: {
    panelTitle: "占位：报告生成输入",
    panelDescription: `${caseName} 的结构化输入占位：类型 + 高注意力切片 + 证据报告。`,
  },
});

const makePatchHighlightPaths = (id) =>
  Array.from({ length: 12 }).map((_, idx) => `/workflow-cases/${id}/high-attention/patch-${idx + 1}.webp`);

const makeCase = (id, name, classificationLabel = "CLASS_PLACEHOLDER", options = {}) => {
  const patchHighlights = makePatchHighlightPaths(id);

  return {
    id,
    name,
    classificationLabel,
    stageImages: {
      uploaded: `/workflow-cases/${id}/uploaded.webp`,
      classifying: `/workflow-cases/${id}/classifying.webp`,
      patching: `/workflow-cases/${id}/patching.webp`,
      retrieving_similar: `/workflow-cases/${id}/retrieving_similar.webp`,
      generating_report: `/workflow-cases/${id}/generating_report.webp`,
    },
    patchHighlights,
    retrievalItems: Array.from({ length: 12 }).map((_, idx) => ({
      id: `retrieval-${idx + 1}`,
      sourcePatchImage: patchHighlights[idx],
      sourcePatchPath: patchHighlights[idx],
      similarWsiImage: `/workflow-cases/${id}/similar-wsi/similar-${idx + 1}.webp`,
      similarCaseTitle: `相似病例 ${idx + 1}`,
      similarReportText: `相似病例报告占位 ${idx + 1}：在此填写诊断描述与证据说明。`,
    })),
    similarDiagnosisJson: `/workflow-cases/${id}/similar-diagnosis/similar-diagnosis.json`,
    reportPdf: `/workflow-cases/${id}/report/diagnosis-report.pdf`,
    stageContent: makeStageContent(name),
  };
};

const CASE_DEFINITIONS = [
  { id: "brca", name: "乳腺癌", classificationLabel: "TCGA-BRCA" },
  { id: "coad", name: "结肠腺癌", classificationLabel: "TCGA-COAD" },
  { id: "gbm", name: "胶质母细胞瘤", classificationLabel: "TCGA-GBM" },
  { id: "hnsc", name: "头颈鳞癌", classificationLabel: "TCGA-HNSC" },
  { id: "kirc", name: "肾透明细胞癌", classificationLabel: "TCGA-KIRC" },
  { id: "luad", name: "肺腺癌", classificationLabel: "TCGA-LUAD" },
  { id: "lusc", name: "肺鳞癌", classificationLabel: "TCGA-LUSC" },
  { id: "prad", name: "前列腺腺癌", classificationLabel: "TCGA-PRAD" },
  { id: "read", name: "直肠腺癌", classificationLabel: "TCGA-READ" },
  { id: "stad", name: "胃腺癌", classificationLabel: "TCGA-STAD" },
];

export const WORKFLOW_CASES = [
  ...CASE_DEFINITIONS.map((item) => makeCase(item.id, item.name, item.classificationLabel)),
];
