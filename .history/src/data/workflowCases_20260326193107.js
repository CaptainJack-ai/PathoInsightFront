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
  done: {
    panelTitle: "占位：最终诊断报告",
    panelDescription: `${caseName} 的最终诊断占位：可替换为真实报告文本。`,
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
      similarCaseTitle: `相似病例 ${idx + 1}`,
      similarReportText: `相似病例报告占位 ${idx + 1}：在此填写诊断描述与证据说明。`,
    })),
    reportPdf: `/workflow-cases/${id}/report/diagnosis-report.pdf`,
    stageContent: makeStageContent(name),
  };
};

export const WORKFLOW_CASES = [
  makeCase("lung-adenocarcinoma", "肺腺癌", "肺腺癌"),
  makeCase("breast-idc", "乳腺浸润性导管癌", "乳腺浸润性导管癌"),
  makeCase("colorectal-adenocarcinoma", "结直肠腺癌", "结直肠腺癌"),
  makeCase("gastric-adenocarcinoma", "胃腺癌", "胃腺癌"),
  makeCase("hepatocellular-carcinoma", "肝细胞癌", "肝细胞癌"),
  makeCase("renal-clear-cell", "肾透明细胞癌", "肾透明细胞癌"),
  makeCase("prostate-adenocarcinoma", "前列腺腺癌", "前列腺腺癌"),
  makeCase("thyroid-papillary", "甲状腺乳头状癌", "甲状腺乳头状癌"),
  makeCase("cervical-squamous", "宫颈鳞状细胞癌", "宫颈鳞状细胞癌"),
  makeCase("glioblastoma", "胶质母细胞瘤", "胶质母细胞瘤"),
];
