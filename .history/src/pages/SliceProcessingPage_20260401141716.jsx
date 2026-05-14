import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../routes/paths";
import {
  downloadJobReportPdf,
  getJobArtifacts,
  getJobReport,
  getApiBaseUrl,
  uploadAndCreateJob,
  waitForJobCompletion,
} from "../api/wsiReportApi";

const ACCEPTED_WSI_FORMATS = ".svs,.tif,.tiff,.ndpi,.mrxs";
const STATUS = {
  IDLE: "idle",
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
};

const isSupportedWsi = (fileName = "") => /\.(svs|tif|tiff|ndpi|mrxs)$/i.test(fileName);

const saveBlobAsFile = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

const formatBytes = (value = 0) => {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** idx;
  return `${size.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
};

const SliceProcessingPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [statusText, setStatusText] = useState("请选择一个 WSI 文件后开始异步处理");
  const [errorMessage, setErrorMessage] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [reportBlob, setReportBlob] = useState(null);
  const [reportFileName, setReportFileName] = useState("diagnosis-report.pdf");
  const [generatedAt, setGeneratedAt] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobStage, setJobStage] = useState("queued");
  const [jobProgress, setJobProgress] = useState(0);
  const [taskLogs, setTaskLogs] = useState([]);
  const [artifacts, setArtifacts] = useState(null);
  const [reportJsonData, setReportJsonData] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const requestAbortRef = useRef(null);

  const queryPatches = useMemo(() => artifacts?.query_high_attention || [], [artifacts]);
  const similarPatches = useMemo(() => (artifacts?.similar_patches || []).slice(0, 18), [artifacts]);
  const artifactFiles = useMemo(() => (artifacts?.files || []).slice(0, 80), [artifacts]);

  useEffect(() => {
    return () => {
      if (reportUrl) {
        URL.revokeObjectURL(reportUrl);
      }

      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
    };
  }, [reportUrl]);

  const resetLastReport = () => {
    if (reportUrl) {
      URL.revokeObjectURL(reportUrl);
      setReportUrl("");
    }
    setReportBlob(null);
    setReportJsonData(null);
    setArtifacts(null);
    setTaskLogs([]);
    setGeneratedAt("");
  };

  const getArtifactFileUrl = (relativePath) => {
    if (!jobId || !relativePath) return "";
    const params = new URLSearchParams({ path: relativePath });
    return `${getApiBaseUrl()}/jobs/${encodeURIComponent(jobId)}/artifact-file?${params.toString()}`;
  };

  const handleProcessWsi = async (file) => {
    if (!file) return;

    if (!isSupportedWsi(file.name)) {
      setStatus(STATUS.ERROR);
      setStatusText("文件格式不支持");
      setErrorMessage("仅支持 .svs/.tif/.tiff/.ndpi/.mrxs 文件");
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

      const [artifactRes, reportRes, pdfRes] = await Promise.all([
        getJobArtifacts(currentJobId, { signal: controller.signal }),
        getJobReport(currentJobId, { signal: controller.signal }),
        downloadJobReportPdf(currentJobId, { signal: controller.signal }),
      ]);

      setArtifacts(artifactRes);
      setReportJsonData(reportRes?.report_json_data || artifactRes?.diagnosis_json || null);

      const { blob, fileName } = pdfRes;

      const objectUrl = URL.createObjectURL(blob);
      setReportUrl(objectUrl);
      setReportBlob(blob);
      setReportFileName(fileName || "diagnosis-report.pdf");
      setGeneratedAt(new Date().toLocaleString("zh-CN"));
      setStatus(STATUS.SUCCESS);
      setJobStage("done");
      setJobProgress(100);
      setStatusText("任务完成：报告与中间结果已就绪");
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus(STATUS.IDLE);
        setStatusText("已取消当前处理");
        return;
      }

      setStatus(STATUS.ERROR);
      setStatusText("任务执行失败");
      setErrorMessage(error?.message || "上传失败，请稍后重试");
    } finally {
      requestAbortRef.current = null;
    }
  };

  const handleRefreshCurrentReport = async () => {
    if (!jobId) return;

    try {
      setStatus(STATUS.PROCESSING);
      setStatusText("正在刷新当前任务产物...");
      const [artifactRes, reportRes, pdfRes] = await Promise.all([
        getJobArtifacts(jobId),
        getJobReport(jobId),
        downloadJobReportPdf(jobId),
      ]);

      if (reportUrl) {
        URL.revokeObjectURL(reportUrl);
      }
      const objectUrl = URL.createObjectURL(pdfRes.blob);
      setReportUrl(objectUrl);
      setReportBlob(pdfRes.blob);
      setReportFileName(pdfRes.fileName || "diagnosis-report.pdf");
      setArtifacts(artifactRes);
      setReportJsonData(reportRes?.report_json_data || artifactRes?.diagnosis_json || null);
      setStatus(STATUS.SUCCESS);
      setStatusText("已刷新当前任务产物");
    } catch (error) {
      setStatus(STATUS.ERROR);
      setStatusText("刷新当前任务失败");
      setErrorMessage(error?.message || "刷新失败");
    }
  };

  const onFilePicked = (file) => {
    if (!file) return;
    setSelectedFile(file);
    handleProcessWsi(file);
  };

  const onInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
    onFilePicked(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) setSelectedFile(file);
    onFilePicked(file);
  };

  return (
    <main className="min-h-screen w-full bg-black pb-14 pt-24 text-blue-50 md:pb-20 md:pt-28">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-5 md:px-10">
        <p className="font-general text-xs uppercase tracking-[0.28em] text-blue-50/65">
          PathoInsight Direct Report
        </p>
        <h1 className="mt-4 max-w-4xl font-zentry text-4xl uppercase leading-[0.92] text-white sm:text-5xl md:text-7xl">
          切片处理
        </h1>
        <p className="mt-5 max-w-3xl font-circular-web text-sm text-blue-50/75 md:text-base">
          上传一张 WSI 切片，页面会创建异步任务并实时展示处理阶段、日志与中间产物，
          最终提供报告 PDF 与结构化诊断 JSON。
        </p>

        <p className="mt-3 text-xs text-blue-50/55">
          接口地址: {getApiBaseUrl()}
        </p>

        <div className="grid gap-5 md:gap-6 lg:grid-cols-[1.1fr_1fr]">
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
                支持: .svs .tif .tiff .ndpi .mrxs
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
                  ? `文件大小 ${formatBytes(selectedFile.size)}`
                  : "选择文件后将自动上传并创建异步任务"}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-white/15 bg-black/30 p-4">
              <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                当前状态
              </p>
              <p className="mt-2 text-sm text-blue-50/95">{statusText}</p>
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
              {errorMessage && (
                <p className="mt-2 text-xs text-rose-300">{errorMessage}</p>
              )}
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
                onClick={() => requestAbortRef.current?.abort()}
                disabled={status !== STATUS.PROCESSING}
                className="rounded-full border border-white/25 px-4 py-2 text-xs uppercase tracking-wider transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                取消等待
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-white/15 bg-black/35">
              <div className="border-b border-white/10 px-4 py-2 font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                文件说明
              </div>
              <div className="flex min-h-[180px] items-center justify-center p-3 sm:min-h-[220px] md:h-[320px]">
                <p className="px-4 text-center text-sm text-blue-50/55">
                  WSI 原始格式通常无法直接在浏览器预览。
                  <br />
                  处理完成后请在右侧查看 PDF 预览，下方查看中间结果。
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/20 bg-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-general text-xs uppercase tracking-wider text-blue-50/70">
                病理报告
              </p>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-wider text-blue-50/70">
                live api
              </span>
            </div>

            <div className="mt-4 min-h-[340px] rounded-xl border border-white/15 bg-black/35 p-3 sm:min-h-[380px] sm:p-4 md:min-h-[430px]">
              {status === STATUS.PROCESSING && (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 sm:min-h-[340px] md:min-h-[390px]">
                  <div className="three-body">
                    <div className="three-body__dot" />
                    <div className="three-body__dot" />
                    <div className="three-body__dot" />
                  </div>
                  <p className="text-sm text-blue-50/75">任务执行中，正在接收后端进度与日志...</p>
                </div>
              )}

              {status !== STATUS.PROCESSING && !reportUrl && (
                <div className="flex h-full min-h-[300px] items-center justify-center sm:min-h-[340px] md:min-h-[390px]">
                  <p className="text-center text-sm text-blue-50/60">
                    任务完成后，最终 PDF 报告会在这里预览。
                  </p>
                </div>
              )}

              {status !== STATUS.PROCESSING && reportUrl && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-white/15 bg-black/40 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-blue-50/65">报告文件</p>
                      <p className="mt-1 truncate text-sm text-blue-50/95">{reportFileName}</p>
                    </div>
                    <div className="rounded-lg border border-white/15 bg-black/40 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-blue-50/65">生成时间</p>
                      <p className="mt-1 text-sm text-blue-50/95">{generatedAt || "--"}</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-white/15 bg-black/40">
                    <div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-blue-50/65">
                      报告预览
                    </div>
                    <iframe
                      title="病理报告预览"
                      src={`${reportUrl}#view=FitH`}
                      className="h-[260px] w-full bg-white sm:h-[300px] md:h-[360px]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (reportBlob) {
                          saveBlobAsFile(reportBlob, reportFileName);
                        }
                      }}
                      disabled={!reportBlob}
                      className="rounded-full border border-white/25 px-4 py-2 text-xs uppercase tracking-wider transition hover:border-violet-200 hover:text-white"
                    >
                      下载当前报告
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-blue-50/60">
              若前后端跨域，请在后端开启 CORS 或使用开发代理。
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
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {queryPatches.map((item, idx) => {
                        const path = item.artifact_relative_path;
                        return (
                          <div key={`q-${idx}-${item.x}-${item.y}`} className="overflow-hidden rounded-lg border border-white/15 bg-black/35">
                            {path ? (
                              <img src={getArtifactFileUrl(path)} alt={`query-patch-${idx + 1}`} className="h-32 w-full object-cover" />
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
                  )}
                </section>

                <section className="rounded-xl border border-white/15 bg-black/30 p-4">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    Similar Patch（前 18）
                  </p>
                  {similarPatches.length === 0 ? (
                    <p className="mt-3 text-sm text-blue-50/60">暂无 similar patch。</p>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {similarPatches.map((item, idx) => {
                        const path = item.artifact_relative_path;
                        return (
                          <div key={`s-${idx}-${item.slide_id || "unknown"}`} className="overflow-hidden rounded-lg border border-white/15 bg-black/35">
                            {path ? (
                              <img src={getArtifactFileUrl(path)} alt={`similar-patch-${idx + 1}`} className="h-32 w-full object-cover" />
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
                  )}
                </section>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-xl border border-white/15 bg-black/30 p-4">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    诊断 JSON
                  </p>
                  <div className="mt-3 max-h-[300px] overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-blue-100/80">
                    {reportJsonData ? (
                      <pre className="whitespace-pre-wrap break-words">{JSON.stringify(reportJsonData, null, 2)}</pre>
                    ) : (
                      <p className="text-blue-50/50">暂无诊断 JSON。</p>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-white/15 bg-black/30 p-4">
                  <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                    中间文件列表（前 80）
                  </p>
                  <div className="mt-3 max-h-[300px] overflow-auto rounded-lg border border-white/10 bg-black/40 p-2">
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
                              {item.relative_path}
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
