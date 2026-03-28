import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../routes/paths";

const ACCEPTED_WSI_FORMATS = ".svs,.tif,.tiff,.ndpi,.mrxs,.scn,.vms,.vmu,.bif,.png,.jpg,.jpeg,.webp";

const DIAGNOSIS_POOL = [
  {
    diagnosis: "肺腺癌倾向",
    organ: "肺组织",
    risk: "中-高风险",
    recommendation: "建议补充免疫组化与分子分型，结合临床影像进行综合判读。",
  },
  {
    diagnosis: "乳腺浸润性导管癌倾向",
    organ: "乳腺组织",
    risk: "高风险",
    recommendation: "建议尽快完成ER/PR/HER2与Ki-67评估，进入治疗路径讨论。",
  },
  {
    diagnosis: "结直肠腺癌倾向",
    organ: "结直肠组织",
    risk: "中风险",
    recommendation: "建议联合分期信息与基因检测结果评估后续治疗策略。",
  },
  {
    diagnosis: "胶质母细胞瘤倾向",
    organ: "脑组织",
    risk: "高风险",
    recommendation: "建议补充IDH、MGMT等分子标志物并尽快多学科会诊。",
  },
  {
    diagnosis: "前列腺腺癌倾向",
    organ: "前列腺组织",
    risk: "中风险",
    recommendation: "建议补充Gleason相关分级信息并进行风险分层管理。",
  },
];

const FEATURE_POOL = [
  "核异型性明显，部分区域核浆比升高",
  "腺体结构紊乱，局灶可见融合趋势",
  "间质反应增强，伴炎性细胞浸润",
  "坏死灶周围细胞密度增高",
  "局部区域可见高注意力病灶聚集",
  "组织结构连续性中断，提示浸润可能",
];

const CONFIDENCE_BASE = 0.78;

const hashText = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const normalizeByName = (fileName) => {
  if (!fileName) return "";
  return fileName.toLowerCase();
};

const inferCaseByFilename = (fileName) => {
  const lowerName = normalizeByName(fileName);

  if (/(luad|lusc|lung|肺)/.test(lowerName)) return 0;
  if (/(brca|breast|乳腺)/.test(lowerName)) return 1;
  if (/(coad|read|colon|rect|结直肠|肠)/.test(lowerName)) return 2;
  if (/(gbm|brain|glioma|脑)/.test(lowerName)) return 3;
  if (/(prad|prostate|前列腺)/.test(lowerName)) return 4;

  return hashText(lowerName || "wsi") % DIAGNOSIS_POOL.length;
};

const buildMockReport = (file) => {
  const caseIndex = inferCaseByFilename(file.name);
  const selected = DIAGNOSIS_POOL[caseIndex];
  const seed = hashText(`${file.name}-${file.size}-${file.lastModified}`);

  const confidence = Math.min(
    0.97,
    CONFIDENCE_BASE + ((seed % 20) / 100)
  );

  const featureStart = seed % FEATURE_POOL.length;
  const features = Array.from({ length: 3 }).map((_, idx) => {
    const target = (featureStart + idx) % FEATURE_POOL.length;
    return FEATURE_POOL[target];
  });

  const reportId = `PI-${String(seed % 1000000).padStart(6, "0")}`;
  const processSeconds = 4 + (seed % 7);

  return {
    reportId,
    fileName: file.name,
    diagnosis: selected.diagnosis,
    organ: selected.organ,
    risk: selected.risk,
    confidence,
    features,
    recommendation: selected.recommendation,
    generatedAt: new Date().toLocaleString("zh-CN"),
    processSeconds,
  };
};

const SliceProcessingPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const analyzeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (analyzeTimerRef.current) {
        window.clearTimeout(analyzeTimerRef.current);
      }
    };
  }, [previewUrl]);

  const startMockAnalysis = (file) => {
    if (!file) return;

    if (analyzeTimerRef.current) {
      window.clearTimeout(analyzeTimerRef.current);
    }

    setIsAnalyzing(true);
    setReportData(null);

    analyzeTimerRef.current = window.setTimeout(() => {
      setReportData(buildMockReport(file));
      setIsAnalyzing(false);
    }, 1100);
  };

  const onFilePicked = (file) => {
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    startMockAnalysis(file);
  };

  const onInputChange = (event) => {
    const file = event.target.files?.[0];
    onFilePicked(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer?.files?.[0];
    onFilePicked(file);
  };

  const confidencePercent = useMemo(() => {
    if (!reportData) return "--";
    return `${Math.round(reportData.confidence * 100)}%`;
  }, [reportData]);

  return (
    <main className="min-h-screen w-screen bg-black pb-20 pt-28 text-blue-50">
      <section className="mx-auto w-full max-w-7xl px-4 md:px-10">
        <p className="font-general text-xs uppercase tracking-[0.28em] text-blue-50/65">
          PathoInsight Direct Report
        </p>
        <h1 className="mt-4 max-w-4xl font-zentry text-5xl uppercase leading-[0.92] text-white md:text-7xl">
          切片处理
        </h1>
        <p className="mt-5 max-w-3xl font-circular-web text-sm text-blue-50/75 md:text-base">
          上传一张 WSI 切片，系统将直接生成病理报告草案。
          目前为前端占位逻辑，后续可无缝替换为真实接口推理结果。
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <article className="rounded-2xl border border-white/20 bg-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6">
            <p className="font-general text-xs uppercase tracking-wider text-blue-50/70">
              WSI 上传
            </p>

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={`mt-4 cursor-pointer rounded-2xl border border-dashed px-4 py-10 text-center transition ${
                dragging
                  ? "border-violet-300 bg-violet-300/10"
                  : "border-white/30 bg-black/20 hover:border-violet-200/70"
              }`}
            >
              <p className="font-circular-web text-sm text-blue-50/90 md:text-base">
                拖拽 WSI 文件到此处，或点击选择文件
              </p>
              <p className="mt-2 font-circular-web text-xs text-blue-50/55">
                支持: .svs .tif .tiff .ndpi .mrxs .scn .vms .vmu .bif 以及常见图片格式
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_WSI_FORMATS}
              className="hidden"
              onChange={onInputChange}
            />

            <div className="mt-5 rounded-xl border border-white/15 bg-black/30 p-4">
              <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                当前文件
              </p>
              <p className="mt-2 truncate text-sm text-blue-50/95">
                {selectedFile ? selectedFile.name : "尚未选择文件"}
              </p>
              <p className="mt-1 text-xs text-blue-50/60">
                {selectedFile
                  ? `文件大小 ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                  : "上传后将自动开始分析并生成报告"}
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-white/15 bg-black/35">
              <div className="border-b border-white/10 px-4 py-2 font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                预览
              </div>
              <div className="flex h-[260px] items-center justify-center p-3 md:h-[320px]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="WSI preview"
                    className="max-h-full w-auto rounded-md object-contain"
                  />
                ) : (
                  <p className="px-4 text-center text-sm text-blue-50/50">
                    若文件是浏览器可识别图片格式，将在此显示预览。
                  </p>
                )}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/20 bg-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-general text-xs uppercase tracking-wider text-blue-50/70">
                病理报告
              </p>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-wider text-blue-50/70">
                mock mode
              </span>
            </div>

            <div className="mt-4 min-h-[430px] rounded-xl border border-white/15 bg-black/35 p-4">
              {isAnalyzing && (
                <div className="flex h-full min-h-[390px] flex-col items-center justify-center gap-3">
                  <div className="three-body">
                    <div className="three-body__dot" />
                    <div className="three-body__dot" />
                    <div className="three-body__dot" />
                  </div>
                  <p className="text-sm text-blue-50/75">分析中，正在生成病理报告...</p>
                </div>
              )}

              {!isAnalyzing && !reportData && (
                <div className="flex h-full min-h-[390px] items-center justify-center">
                  <p className="text-center text-sm text-blue-50/60">
                    上传一张 WSI 后，这里会直接返回结构化病理报告。
                  </p>
                </div>
              )}

              {!isAnalyzing && reportData && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-white/15 bg-black/40 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-blue-50/65">报告编号</p>
                      <p className="mt-1 text-sm text-blue-50/95">{reportData.reportId}</p>
                    </div>
                    <div className="rounded-lg border border-white/15 bg-black/40 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-blue-50/65">置信度</p>
                      <p className="mt-1 text-sm text-blue-50/95">{confidencePercent}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/15 bg-black/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-blue-50/65">诊断结论</p>
                    <p className="mt-1 text-lg text-blue-50">{reportData.diagnosis}</p>
                    <p className="mt-1 text-sm text-blue-50/75">
                      组织来源: {reportData.organ} | 风险等级: {reportData.risk}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/15 bg-black/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-blue-50/65">关键病理特征</p>
                    <ul className="mt-2 space-y-2 text-sm text-blue-50/85">
                      {reportData.features.map((feature) => (
                        <li key={feature}>- {feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-white/15 bg-black/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-blue-50/65">建议</p>
                    <p className="mt-2 text-sm text-blue-50/85">{reportData.recommendation}</p>
                  </div>

                  <p className="text-xs text-blue-50/55">
                    生成时间: {reportData.generatedAt} | 推理耗时: 约 {reportData.processSeconds}s
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-blue-50/60">
              后续接入真实接口后，本页面将保持同一交互与展示结构。
            </div>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-blue-50/70">
          <span>查看更多流程:</span>
          <Link
            to={ROUTE_PATHS.WORKFLOW}
            className="rounded-full border border-white/25 px-4 py-2 transition hover:border-violet-200 hover:text-white"
          >
            六阶段工作流
          </Link>
          <Link
            to={ROUTE_PATHS.HOME}
            className="rounded-full border border-white/25 px-4 py-2 transition hover:border-violet-200 hover:text-white"
          >
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
};

export default SliceProcessingPage;
