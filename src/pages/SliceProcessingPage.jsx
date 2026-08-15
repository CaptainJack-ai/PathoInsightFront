import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../routes/paths";
import {
  getApiBaseUrl,
  getJobArtifacts,
  getJobReport,
  uploadAndCreateJob,
  waitForJobCompletion,
} from "../api/wsiReportApi";

const ACCEPTED_EXTENSIONS = [".svs", ".tif", ".tiff", ".ndpi", ".mrxs"];

const STATUS = {
  IDLE: "idle",
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
};

const isSupportedWsi = (fileName = "") => {
  const lowerName = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const saveBlobAsFile = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const formatBytes = (value = 0) => {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** idx;
  return `${size.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
};

const withInlinePreview = (url) => {
  if (!url) return "";
  return `${url}${url.includes("?") ? "&" : "?"}inline=1`;
};

const SliceProcessingPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [statusText, setStatusText] = useState("请选择一个 WSI 文件后开始异步处理");
  const [errorMessage, setErrorMessage] = useState("");
  const [summaryReportUrl, setSummaryReportUrl] = useState("");
  const [generatedReportUrl, setGeneratedReportUrl] = useState("");
  const [summaryReportSourceUrl, setSummaryReportSourceUrl] = useState("");
  const [generatedReportSourceUrl, setGeneratedReportSourceUrl] = useState("");
  const [summaryReportFileName, setSummaryReportFileName] = useState("pathology-report.pdf");
  const [generatedReportFileName, setGeneratedReportFileName] = useState("reasoning-report.pdf");
  const [generatedAt, setGeneratedAt] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobStage, setJobStage] = useState("queued");
  const [jobProgress, setJobProgress] = useState(0);
  const [taskLogs, setTaskLogs] = useState([]);
  const [artifacts, setArtifacts] = useState(null);
  const [reportJsonData, setReportJsonData] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);

  // 医院最终诊断表单
  const [patientName, setPatientName] = useState("");
  const [cancerType, setCancerType] = useState("");
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
  const [diagnosisEvidence, setDiagnosisEvidence] = useState("");
  const [attendingDoctor, setAttendingDoctor] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState("idle"); // "idle" | "submitting" | "success"
  const [submittedCaseId, setSubmittedCaseId] = useState("");
  const [formError, setFormError] = useState("");

  const inputRef = useRef(null);
  const requestAbortRef = useRef(null);

  const queryPatches = useMemo(() => artifacts?.query_high_attention || [], [artifacts]);
  const similarPatches = useMemo(() => (artifacts?.similar_patches || []).slice(0, 18), [artifacts]);
  const artifactFiles = useMemo(() => (artifacts?.files || []).slice(0, 80), [artifacts]);

  useEffect(() => {
    return () => {
      if (summaryReportUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(summaryReportUrl);
      }
      if (generatedReportUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(generatedReportUrl);
      }
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
    };
  }, [summaryReportUrl, generatedReportUrl]);

  useEffect(() => {
    const onNavVisibility = (event) => {
      setIsNavVisible(Boolean(event?.detail?.visible));
    };

    window.addEventListener("app-nav-visibility", onNavVisibility);
    return () => window.removeEventListener("app-nav-visibility", onNavVisibility);
  }, []);

  const resetLastReport = () => {
    if (summaryReportUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(summaryReportUrl);
      setSummaryReportUrl("");
    }
    if (generatedReportUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(generatedReportUrl);
      setGeneratedReportUrl("");
    }
    setSummaryReportSourceUrl("");
    setGeneratedReportSourceUrl("");
    setReportJsonData(null);
    setArtifacts(null);
    setTaskLogs([]);
    setGeneratedAt("");
  };

  const downloadPdfFromUrl = async (url, fallbackName = "diagnosis-report.pdf") => {
    if (!url) {
      throw new Error("报告地址不存在");
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("报告下载失败，请稍后重试");
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition") || "";
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    const fileName = utf8Match?.[1]
      ? decodeURIComponent(utf8Match[1])
      : asciiMatch?.[1] || fallbackName;

    saveBlobAsFile(blob, fileName);
  };

  const getArtifactFileUrl = (relativePath) => {
    if (!jobId || !relativePath) return "";
    const params = new URLSearchParams({ path: relativePath });
    return `${getApiBaseUrl()}/jobs/${encodeURIComponent(jobId)}/artifact-file?${params.toString()}`;
  };

  const resolveArtifactPath = (rawPath) => {
    if (!rawPath || typeof rawPath !== "string") return "";

    // Backend may return absolute local paths; convert to run_dir-relative paths for /artifact-file.
    if (rawPath.startsWith("/") && artifacts?.run_dir && rawPath.startsWith(artifacts.run_dir)) {
      return rawPath.slice(artifacts.run_dir.length).replace(/^\/+/, "");
    }
    return rawPath;
  };

  const resolvePatchPreviewUrl = (item = {}) => {
    const candidates = [
      item.artifact_relative_path,
      item.saved_patch_path,
      item.saved_image,
      item.image_path,
      item.patch_path,
      item.candidate_patch_path,
    ];
    const path = candidates.map(resolveArtifactPath).find((x) => typeof x === "string" && x.length > 0);
    return path ? getArtifactFileUrl(path) : "";
  };

  const handleProcessWsi = async (file) => {
    if (!file) {
      setErrorMessage("请先选择文件");
      return;
    }

    if (!isSupportedWsi(file.name)) {
      setStatus(STATUS.ERROR);
      setStatusText("不支持的文件类型");
      setErrorMessage(`请上传 ${ACCEPTED_EXTENSIONS.join(", ")} 格式的 WSI 文件`);
      return;
    }

    resetLastReport();
    setErrorMessage("");
    setStatus(STATUS.PROCESSING);
    setStatusText("正在上传并创建任务...");
    setJobStage("queued");
    setJobProgress(5);
    setJobId("");

    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
    }

    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const created = await uploadAndCreateJob(file, {
        signal: controller.signal,
      });
      const currentJobId = created?.job_id;

      if (!currentJobId) {
        throw new Error("后端未返回有效任务 ID");
      }

      setJobId(currentJobId);
      setStatusText(`任务已创建：${currentJobId.slice(0, 8)}...，正在处理`);

      const { job } = await waitForJobCompletion(currentJobId, {
        signal: controller.signal,
        includeLogs: true,
        logsLimit: 200,
        onProgress: ({ job: j, logs }) => {
          setJobStage(j?.stage || "queued");
          setJobProgress(Number.isFinite(j?.progress) ? j.progress : 0);
          setStatusText(`处理中：${j?.stage || "running"} (${j?.progress || 0}%)`);

          if (logs?.items?.length) {
            setTaskLogs((prev) => {
              const merged = [...prev, ...logs.items];
              return merged.slice(-500);
            });
          }
        },
      });

      if (job.status !== "succeeded") {
        throw new Error(job.error || "任务执行失败");
      }

      const [artifactRes, reportRes] = await Promise.all([
        getJobArtifacts(currentJobId, { signal: controller.signal }),
        getJobReport(currentJobId, { signal: controller.signal }),
      ]);

      setArtifacts(artifactRes);
      setReportJsonData(reportRes?.report_json_data || artifactRes?.diagnosis_json || null);

      const summaryUrl = reportRes?.report_summary_pdf_url
        ? `${getApiBaseUrl()}${reportRes.report_summary_pdf_url}`
        : "";
      const generatedUrl = reportRes?.generated_report_pdf_url
        ? `${getApiBaseUrl()}${reportRes.generated_report_pdf_url}`
        : reportRes?.report_pdf_url
          ? `${getApiBaseUrl()}${reportRes.report_pdf_url}`
          : "";

      if (summaryReportUrl) {
        URL.revokeObjectURL(summaryReportUrl);
      }
      if (generatedReportUrl) {
        URL.revokeObjectURL(generatedReportUrl);
      }

      setSummaryReportSourceUrl(summaryUrl);
      setGeneratedReportSourceUrl(generatedUrl);
      setSummaryReportUrl(withInlinePreview(summaryUrl));
      setGeneratedReportUrl(withInlinePreview(generatedUrl));
      setSummaryReportFileName(reportRes?.report_summary_pdf?.split(/[\\/]/).pop() || "pathology-report.pdf");
      setGeneratedReportFileName(
        reportRes?.generated_report_pdf?.split(/[\\/]/).pop() ||
          reportRes?.report_pdf?.split(/[\\/]/).pop() ||
          "reasoning-report.pdf"
      );
      setGeneratedAt(new Date().toLocaleString("zh-CN"));
      setStatus(STATUS.SUCCESS);
      setJobStage("done");
      setJobProgress(100);
      setStatusText("任务完成：报告与中间结果已就绪");
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus(STATUS.IDLE);
        setStatusText("已取消处理");
        return;
      }

      setStatus(STATUS.ERROR);
      setStatusText("任务执行失败");
      setErrorMessage(error?.message || "上传失败，请稍后重试");
    } finally {
      requestAbortRef.current = null;
    }
  };

  const handleInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    await handleProcessWsi(file);
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    await handleProcessWsi(file);
  };

  const handleDownloadReport = () => {
    if (!generatedReportSourceUrl) return;
    downloadPdfFromUrl(generatedReportSourceUrl, generatedReportFileName || "diagnosis-report.pdf");
  };

  const handleDownloadSummaryReport = () => {
    if (!summaryReportSourceUrl) return;
    downloadPdfFromUrl(summaryReportSourceUrl, summaryReportFileName || "report-summary.pdf");
  };

  const handleRefreshCurrentReport = async () => {
    if (!jobId) return;

    try {
      setStatus(STATUS.PROCESSING);
      setStatusText("正在刷新当前任务产物...");
      const [artifactRes, reportRes] = await Promise.all([
        getJobArtifacts(jobId),
        getJobReport(jobId),
      ]);

      if (summaryReportUrl) {
        URL.revokeObjectURL(summaryReportUrl);
      }
      if (generatedReportUrl) {
        URL.revokeObjectURL(generatedReportUrl);
      }
      setArtifacts(artifactRes);
      setReportJsonData(reportRes?.report_json_data || artifactRes?.diagnosis_json || null);

      const summaryUrl = reportRes?.report_summary_pdf_url
        ? `${getApiBaseUrl()}${reportRes.report_summary_pdf_url}`
        : "";
      const generatedUrl = reportRes?.generated_report_pdf_url
        ? `${getApiBaseUrl()}${reportRes.generated_report_pdf_url}`
        : reportRes?.report_pdf_url
          ? `${getApiBaseUrl()}${reportRes.report_pdf_url}`
          : "";

      setSummaryReportSourceUrl(summaryUrl);
      setGeneratedReportSourceUrl(generatedUrl);
      setSummaryReportUrl(withInlinePreview(summaryUrl));
      setGeneratedReportUrl(withInlinePreview(generatedUrl));
      setSummaryReportFileName(reportRes?.report_summary_pdf?.split(/[\\/]/).pop() || "pathology-report.pdf");
      setGeneratedReportFileName(
        reportRes?.generated_report_pdf?.split(/[\\/]/).pop() ||
          reportRes?.report_pdf?.split(/[\\/]/).pop() ||
          "reasoning-report.pdf"
      );
      setStatus(STATUS.SUCCESS);
      setStatusText("已刷新当前任务产物");
    } catch (error) {
      setStatus(STATUS.ERROR);
      setStatusText("刷新当前任务失败");
      setErrorMessage(error?.message || "刷新失败");
    }
  };

  const CANCER_TYPES = [
    { value: "BRCA", label: "乳腺癌 (TCGA-BRCA)" },
    { value: "COAD", label: "结肠腺癌 (TCGA-COAD)" },
    { value: "GBM", label: "胶质母细胞瘤 (TCGA-GBM)" },
    { value: "HNSC", label: "头颈鳞癌 (TCGA-HNSC)" },
    { value: "KIRC", label: "肾透明细胞癌 (TCGA-KIRC)" },
    { value: "LUAD", label: "肺腺癌 (TCGA-LUAD)" },
    { value: "LUSC", label: "肺鳞癌 (TCGA-LUSC)" },
    { value: "PRAD", label: "前列腺腺癌 (TCGA-PRAD)" },
    { value: "READ", label: "直肠腺癌 (TCGA-READ)" },
    { value: "STAD", label: "胃腺癌 (TCGA-STAD)" },
  ];

  const generateCaseId = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `CASE-${date}-${random}`;
  };

  const resetForm = () => {
    setPatientName("");
    setCancerType("");
    setClinicalDiagnosis("");
    setDiagnosisEvidence("");
    setAttendingDoctor("");
    setDiagnosisDate(new Date().toISOString().slice(0, 10));
    setFormStatus("idle");
    setSubmittedCaseId("");
    setFormError("");
  };

  const handleSubmitDiagnosis = async () => {
    // 验证必填项
    if (!cancerType) {
      setFormError("请选择癌症类型");
      return;
    }
    if (!clinicalDiagnosis.trim()) {
      setFormError("请输入临床诊断结果");
      return;
    }
    if (!diagnosisEvidence.trim()) {
      setFormError("请输入诊断证据/原因");
      return;
    }

    setFormError("");
    setFormStatus("submitting");

    // 模拟上传延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const caseId = generateCaseId();
    setSubmittedCaseId(caseId);
    setFormStatus("success");
  };

  const statusTone = {
    [STATUS.IDLE]: "text-blue-50/80",
    [STATUS.PROCESSING]: "text-amber-200",
    [STATUS.SUCCESS]: "text-emerald-200",
    [STATUS.ERROR]: "text-rose-300",
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] text-blue-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#5a5eff]/25 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-140px] h-[420px] w-[420px] rounded-full bg-[#22d3ee]/20 blur-3xl" />
      </div>

      <div
        className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-10"
        style={{
          paddingTop: isNavVisible ? "6.5rem" : "2.75rem",
          transition: "padding-top 240ms ease",
        }}
      >
        <header className="mb-8 md:mb-10">
          <p className="font-general text-xs uppercase tracking-[0.28em] text-cyan-200/80">
            PathoInsight Pipeline
          </p>
          <h1 className="mt-3 text-3xl font-zentry leading-tight text-white md:text-5xl">
            WSI Slice Processing Dashboard
          </h1>
          <p className="mt-5 max-w-3xl font-circular-web text-sm text-blue-50/75 md:text-base">
            上传一张 WSI 切片，页面会创建异步任务并实时展示处理阶段、日志与中间产物，
            最终提供报告 PDF 与结构化诊断 JSON。
          </p>
        </header>

        <div className="grid gap-5 md:gap-6 lg:grid-cols-[1.1fr_1fr]">
          <article className="rounded-2xl border border-white/20 bg-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-general text-xs uppercase tracking-wider text-blue-50/70">
                  1. Upload WSI File
                </p>
                <h2 className="mt-2 text-xl font-zentry text-white">上传与任务创建</h2>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-wider text-blue-50/70">
                Async Job
              </span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`mt-5 rounded-xl border border-dashed p-6 text-center transition ${
                dragging
                  ? "border-cyan-200 bg-cyan-200/10"
                  : "border-white/25 bg-black/30 hover:border-cyan-200/70 hover:bg-black/40"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                onChange={handleInputChange}
              />
              <p className="text-sm text-blue-50/90">点击或拖拽 WSI 文件到此处</p>
              <p className="mt-2 text-xs text-blue-50/60">
                支持 {ACCEPTED_EXTENSIONS.join(" / ")} 格式
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-white/15 bg-black/30 p-4">
              <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                已选文件
              </p>
              <p className="mt-2 break-all text-sm text-blue-50/95">
                {selectedFile ? selectedFile.name : "尚未选择文件"}
              </p>
              <p className="mt-1 text-xs text-blue-50/60">
                {selectedFile
                  ? `文件大小 ${formatBytes(selectedFile.size)}`
                  : "选择文件后将自动上传并创建异步任务"}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-white/15 bg-black/30 p-4">
              <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                当前状态
              </p>
              <p className={`mt-2 text-sm ${statusTone[status] || "text-blue-50/80"}`}>{statusText}</p>
              {!!jobId && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-blue-50/70">任务 ID: {jobId}</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-violet-300 transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, jobProgress))}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-50/70">
                    阶段: {jobStage} · 进度: {jobProgress}%
                  </p>
                </div>
              )}
              {errorMessage && <p className="mt-2 text-xs text-rose-300">{errorMessage}</p>}
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-white/15 bg-black/35">
              <div className="border-b border-white/10 px-4 py-2 font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                实时日志（最近 500 条）
              </div>
              <div className="h-[220px] overflow-auto p-3 font-mono text-xs leading-relaxed text-blue-100/80">
                {taskLogs.length === 0 ? (
                  <p className="text-blue-50/50">暂无日志输出</p>
                ) : (
                  taskLogs.map((item) => (
                    <p key={`${item.seq}-${item.ts}`} className="whitespace-pre-wrap break-all">
                      [{item.seq}][{item.source}] {item.line}
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRefreshCurrentReport}
                disabled={!jobId || status === STATUS.PROCESSING}
                className="rounded-full border border-white/25 px-4 py-2 text-xs uppercase tracking-wider transition hover:border-violet-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                刷新当前任务结果
              </button>
              <button
                type="button"
                onClick={() => {
                  if (requestAbortRef.current) {
                    requestAbortRef.current.abort();
                  }
                }}
                className="rounded-full border border-white/25 px-4 py-2 text-xs uppercase tracking-wider transition hover:border-rose-200 hover:text-white"
              >
                取消当前请求
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/65">
                WSI 预览说明
              </p>
              <div className="mt-3 flex min-h-[160px] items-center justify-center rounded-lg border border-white/10 bg-black/30">
                <p className="px-4 text-center text-sm text-blue-50/55">
                  WSI 原始格式通常无法直接在浏览器预览。
                  <br />
                  处理完成后请在右侧查看 PDF 预览，下方查看中间结果。
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/20 bg-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-general text-xs uppercase tracking-wider text-blue-50/70">
                  2. Diagnosis Report
                </p>
                <h2 className="mt-2 text-xl font-zentry text-white">报告预览与下载</h2>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-wider text-blue-50/70">
                PDF
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-white/15 bg-black/30 p-4">
              <p className="text-xs text-blue-50/70">生成时间</p>
              <p className="mt-1 text-sm text-blue-50/95">{generatedAt || "尚未生成"}</p>
              <p className="mt-3 text-xs text-blue-50/70">病理报告文件名</p>
              <p className="mt-1 break-all text-sm text-blue-50/95">{summaryReportFileName || "pathology-report.pdf"}</p>
              <p className="mt-3 text-xs text-blue-50/70">推理报告文件名</p>
              <p className="mt-1 break-all text-sm text-blue-50/95">{generatedReportFileName || "reasoning-report.pdf"}</p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="overflow-hidden rounded-xl border border-white/15 bg-black/35">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    病理报告 PDF
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadSummaryReport}
                    disabled={!summaryReportSourceUrl}
                    className="rounded-full border border-white/25 px-3 py-1 text-[10px] uppercase tracking-wider transition hover:border-cyan-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    下载病理报告
                  </button>
                </div>

                {status === STATUS.PROCESSING && (
                  <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-blue-50/75">
                    <div className="three-body">
                      <div className="three-body__dot" />
                      <div className="three-body__dot" />
                      <div className="three-body__dot" />
                    </div>
                    <p className="text-sm text-blue-50/75">任务执行中，正在接收后端进度与日志...</p>
                  </div>
                )}

                {status !== STATUS.PROCESSING && summaryReportUrl && (
                  <iframe
                    title="病理报告预览"
                    src={summaryReportUrl}
                    className="h-[320px] w-full bg-white"
                  />
                )}

                {status !== STATUS.PROCESSING && !summaryReportUrl && (
                  <div className="flex h-[320px] items-center justify-center bg-black/20">
                    <p className="text-center text-sm text-blue-50/60">
                      任务完成后，病理报告 PDF 会在这里预览。
                    </p>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-white/15 bg-black/35">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    推理报告 PDF
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    disabled={!generatedReportSourceUrl}
                    className="rounded-full border border-white/25 px-3 py-1 text-[10px] uppercase tracking-wider transition hover:border-cyan-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    下载推理报告
                  </button>
                </div>

                {status === STATUS.PROCESSING && (
                  <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-blue-50/75">
                    <div className="three-body">
                      <div className="three-body__dot" />
                      <div className="three-body__dot" />
                      <div className="three-body__dot" />
                    </div>
                    <p className="text-sm text-blue-50/75">任务执行中，正在接收后端进度与日志...</p>
                  </div>
                )}

                {status !== STATUS.PROCESSING && generatedReportUrl && (
                  <iframe
                    title="推理报告预览"
                    src={generatedReportUrl}
                    className="h-[320px] w-full bg-white"
                  />
                )}

                {status !== STATUS.PROCESSING && !generatedReportUrl && (
                  <div className="flex h-[320px] items-center justify-center bg-black/20">
                    <p className="text-center text-sm text-blue-50/60">
                      任务完成后，推理报告 PDF 会在这里预览。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>

        <article className="mt-5 rounded-2xl border border-white/20 bg-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-general text-xs uppercase tracking-wider text-blue-50/70">
              中间文件与过程结果
            </p>
            <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-wider text-blue-50/70">
              artifacts
            </span>
          </div>

          {!jobId && (
            <div className="mt-4 rounded-xl border border-white/15 bg-black/30 p-4 text-sm text-blue-50/60">
              上传并启动任务后，这里将展示高注意力 patch、相似 patch、诊断 JSON 与可下载中间文件。
            </div>
          )}

          {!!jobId && (
            <div className="mt-4 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-white/15 bg-black/35 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-blue-50/60">任务 ID</p>
                  <p className="mt-1 truncate text-sm text-blue-50/95">{jobId}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-black/35 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-blue-50/60">Query 高注意力</p>
                  <p className="mt-1 text-sm text-blue-50/95">{queryPatches.length} 条</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-black/35 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-blue-50/60">Similar Patch</p>
                  <p className="mt-1 text-sm text-blue-50/95">{artifacts?.similar_patches?.length || 0} 条</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-black/35 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-blue-50/60">可传文件</p>
                  <p className="mt-1 text-sm text-blue-50/95">{artifacts?.files?.length || 0} 个</p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-xl border border-white/15 bg-black/30 p-4">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    Query 高注意力 Patch
                  </p>
                  {queryPatches.length === 0 ? (
                    <p className="mt-3 text-sm text-blue-50/60">暂无 query 高注意力 patch。</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto pb-2">
                      <div className="grid auto-cols-[180px] grid-flow-col gap-3">
                      {queryPatches.map((item, idx) => {
                        const previewUrl = resolvePatchPreviewUrl(item);
                        return (
                          <div key={`q-${idx}-${item.x}-${item.y}`} className="overflow-hidden rounded-lg border border-white/15 bg-black/35">
                            {previewUrl ? (
                              <img src={previewUrl} alt={`query-patch-${idx + 1}`} className="h-32 w-full object-cover" />
                            ) : (
                              <div className="flex h-32 items-center justify-center text-xs text-blue-50/45">无缩略图</div>
                            )}
                            <div className="space-y-1 p-2 text-[11px] text-blue-50/80">
                              <p>x: {item.x} · y: {item.y}</p>
                              <p>attention: {item.attention_score ?? "--"}</p>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-white/15 bg-black/30 p-4">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    Similar Patch（前 18）
                  </p>
                  {similarPatches.length === 0 ? (
                    <p className="mt-3 text-sm text-blue-50/60">暂无 similar patch。</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto pb-2">
                      <div className="grid auto-cols-[180px] grid-flow-col gap-3">
                      {similarPatches.map((item, idx) => {
                        const previewUrl = resolvePatchPreviewUrl(item);
                        return (
                          <div key={`s-${idx}-${item.slide_id || "unknown"}`} className="overflow-hidden rounded-lg border border-white/15 bg-black/35">
                            {previewUrl ? (
                              <img src={previewUrl} alt={`similar-patch-${idx + 1}`} className="h-32 w-full object-cover" />
                            ) : (
                              <div className="flex h-32 items-center justify-center text-xs text-blue-50/45">无缩略图</div>
                            )}
                            <div className="space-y-1 p-2 text-[11px] text-blue-50/80">
                              <p className="truncate">slide: {item.slide_id || "--"}</p>
                              <p>similarity: {item.similarity ?? "--"}</p>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <section className="min-w-0 rounded-xl border border-white/15 bg-black/30 p-4">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    诊断 JSON
                  </p>
                  <div className="mt-3 h-[340px] max-w-full overflow-x-auto overflow-y-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-blue-100/80">
                    {reportJsonData ? (
                      <pre className="inline-block w-max min-w-full whitespace-pre pr-6">{JSON.stringify(reportJsonData, null, 2)}</pre>
                    ) : (
                      <p className="text-blue-50/50">暂无诊断 JSON。</p>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-white/15 bg-black/30 p-4">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    中间文件列表（前 80）
                  </p>
                  <div className="mt-3 h-[340px] overflow-auto rounded-lg border border-white/10 bg-black/40 p-2">
                    {artifactFiles.length === 0 ? (
                      <p className="p-2 text-xs text-blue-50/50">暂无可下载中间文件。</p>
                    ) : (
                      <ul className="space-y-1">
                        {artifactFiles.map((item, idx) => (
                          <li key={`${item.relative_path}-${idx}`}>
                            <a
                              href={getArtifactFileUrl(item.relative_path)}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate rounded-md px-2 py-1 text-xs text-blue-100/85 transition hover:bg-white/10 hover:text-white"
                              title={item.relative_path}
                            >
                              {item.relative_path} ({formatBytes(item.size)})
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </article>

        {/* ===== 3. 医院最终诊断录入 ===== */}
        <article className="mt-5 rounded-2xl border border-white/20 bg-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-general text-xs uppercase tracking-wider text-blue-50/70">
                3. 医院最终诊断录入
              </p>
              <h2 className="mt-2 text-xl font-zentry text-white">真实病例归档</h2>
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-wider text-blue-50/70">
              Manual Input
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* 患者姓名 */}
            <div>
              <label className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">患者姓名</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="请输入患者姓名"
                disabled={formStatus === "success"}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-blue-50 placeholder-blue-50/40 transition focus:border-cyan-200/60 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* 癌症类型 */}
            <div>
              <label className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                癌症类型 <span className="text-rose-300">*</span>
              </label>
              <select
                value={cancerType}
                onChange={(e) => setCancerType(e.target.value)}
                disabled={formStatus === "success"}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-blue-50 transition focus:border-cyan-200/60 focus:outline-none disabled:opacity-50"
              >
                <option value="" disabled className="bg-slate-900 text-blue-50/60">
                  请选择癌症类型
                </option>
                {CANCER_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value} className="bg-slate-900 text-blue-50">
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 临床诊断结果 */}
            <div className="md:col-span-2">
              <label className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                临床诊断结果 <span className="text-rose-300">*</span>
              </label>
              <textarea
                value={clinicalDiagnosis}
                onChange={(e) => setClinicalDiagnosis(e.target.value)}
                placeholder="请输入临床诊断结果"
                rows={3}
                disabled={formStatus === "success"}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-blue-50 placeholder-blue-50/40 transition focus:border-cyan-200/60 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* 诊断证据/原因 */}
            <div className="md:col-span-2">
              <label className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                诊断证据 / 原因 <span className="text-rose-300">*</span>
              </label>
              <textarea
                value={diagnosisEvidence}
                onChange={(e) => setDiagnosisEvidence(e.target.value)}
                placeholder="请描述诊断依据、病理特征、免疫组化结果、分子分型等"
                rows={4}
                disabled={formStatus === "success"}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-blue-50 placeholder-blue-50/40 transition focus:border-cyan-200/60 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* 主治医师 */}
            <div>
              <label className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">主治医师</label>
              <input
                type="text"
                value={attendingDoctor}
                onChange={(e) => setAttendingDoctor(e.target.value)}
                placeholder="请输入主治医师姓名"
                disabled={formStatus === "success"}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-blue-50 placeholder-blue-50/40 transition focus:border-cyan-200/60 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* 诊断日期 */}
            <div>
              <label className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">诊断日期</label>
              <input
                type="date"
                value={diagnosisDate}
                onChange={(e) => setDiagnosisDate(e.target.value)}
                disabled={formStatus === "success"}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-blue-50 transition focus:border-cyan-200/60 focus:outline-none disabled:opacity-50 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* ===== 表单按钮 ===== */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {formStatus !== "success" ? (
              <>
                <button
                  type="button"
                  onClick={handleSubmitDiagnosis}
                  disabled={formStatus === "submitting"}
                  className="rounded-full border border-emerald-300/40 bg-emerald-900/30 px-6 py-2.5 text-sm font-semibold text-emerald-100 shadow-[0_6px_20px_rgba(52,211,153,0.08)] transition hover:border-emerald-200/60 hover:bg-emerald-800/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {formStatus === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200/40 border-t-emerald-200" />
                      正在提交...
                    </span>
                  ) : (
                    "加入病例库"
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={formStatus === "submitting"}
                  className="rounded-full border border-white/25 px-5 py-2.5 text-xs uppercase tracking-wider transition hover:border-rose-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  重置
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-cyan-200/40 bg-cyan-900/30 px-6 py-2.5 text-sm font-semibold text-cyan-100 shadow-[0_6px_20px_rgba(34,211,238,0.08)] transition hover:border-cyan-200/60 hover:bg-cyan-800/40 hover:text-white"
              >
                继续录入
              </button>
            )}
          </div>

          {/* ===== 错误消息 ===== */}
          {formError && (
            <div className="mt-4 rounded-xl border border-rose-300/30 bg-rose-900/20 px-4 py-3 text-sm text-rose-200">
              ⚠ {formError}
            </div>
          )}

          {/* ===== 成功消息 ===== */}
          {formStatus === "success" && submittedCaseId && (
            <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-900/20 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xl">✅</span>
                <div>
                  <p className="text-base font-semibold text-emerald-200">加入病例库成功！</p>
                  <p className="mt-2 text-sm text-blue-50/80">
                    病例编号：
                    <span className="ml-1 rounded-md bg-emerald-800/40 px-3 py-1 font-mono text-sm font-bold text-emerald-100">
                      {submittedCaseId}
                    </span>
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-blue-50/60">
                    {patientName && <p>患者姓名：{patientName}</p>}
                    <p>癌症类型：{CANCER_TYPES.find((ct) => ct.value === cancerType)?.label || cancerType}</p>
                    <p>诊断日期：{diagnosisDate}</p>
                    {attendingDoctor && <p>主治医师：{attendingDoctor}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>

        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-blue-50/70">
          <Link
            to={ROUTE_PATHS.HOME}
            className="rounded-full border border-white/25 px-4 py-2 transition hover:border-cyan-200 hover:text-white"
          >
            返回首页
          </Link>
          <span className="opacity-70">后端地址：{getApiBaseUrl()}</span>
        </div>
      </div>
    </main>
  );
};

export default SliceProcessingPage;
