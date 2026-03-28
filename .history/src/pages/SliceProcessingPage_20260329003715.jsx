import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../routes/paths";
import {
  getApiBaseUrl,
  getLatestReport,
  uploadWsiAndGenerateReport,
} from "../api/wsiReportApi";

const ACCEPTED_WSI_FORMATS = ".svs,.tif,.tiff,.ndpi,.mrxs";
const STATUS = {
  IDLE: "idle",
  PROCESSING: "uploading_or_processing",
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

const SliceProcessingPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [statusText, setStatusText] = useState("请选择一个 WSI 文件后开始处理");
  const [errorMessage, setErrorMessage] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [reportFileName, setReportFileName] = useState("diagnosis-report.pdf");
  const [generatedAt, setGeneratedAt] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const requestAbortRef = useRef(null);

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
    setStatusText("报告生成中，请稍候...");

    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const { blob, fileName } = await uploadWsiAndGenerateReport(file, {
        signal: controller.signal,
      });

      const objectUrl = URL.createObjectURL(blob);
      setReportUrl(objectUrl);
      setReportFileName(fileName || "diagnosis-report.pdf");
      setGeneratedAt(new Date().toLocaleString("zh-CN"));
      setStatus(STATUS.SUCCESS);
      setStatusText("报告生成成功，可预览或下载");
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus(STATUS.IDLE);
        setStatusText("已取消当前处理");
        return;
      }

      setStatus(STATUS.ERROR);
      setStatusText("报告生成失败");
      setErrorMessage(error?.message || "上传失败，请稍后重试");
    } finally {
      requestAbortRef.current = null;
    }
  };

  const handleFetchLatestReport = async () => {
    resetLastReport();
    setErrorMessage("");
    setStatus(STATUS.PROCESSING);
    setStatusText("正在获取最近报告...");

    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const { blob, fileName } = await getLatestReport({ signal: controller.signal });
      const objectUrl = URL.createObjectURL(blob);

      setReportUrl(objectUrl);
      setReportFileName(fileName || "latest-report.pdf");
      setGeneratedAt(new Date().toLocaleString("zh-CN"));
      setStatus(STATUS.SUCCESS);
      setStatusText("已获取最近报告");
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus(STATUS.IDLE);
        setStatusText("已取消获取最近报告");
        return;
      }

      setStatus(STATUS.ERROR);
      setStatusText("获取最近报告失败");
      setErrorMessage(error?.message || "当前暂无可用报告");
    } finally {
      requestAbortRef.current = null;
    }
  };

  const onFilePicked = (file) => {
    if (!file) return;

    setSelectedFile(file);
    handleProcessWsi(file);
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
          上传一张 WSI 切片，页面将调用后端接口直接返回 PDF 报告。
          支持查看最近一次已生成报告。
        </p>

        <p className="mt-3 text-xs text-blue-50/55">
          接口地址: {getApiBaseUrl()}
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
                  ? `文件大小 ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                  : "选择文件后将自动上传并触发后端生成报告"}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-white/15 bg-black/30 p-4">
              <p className="font-general text-[11px] uppercase tracking-wider text-blue-50/70">
                当前状态
              </p>
              <p className="mt-2 text-sm text-blue-50/95">{statusText}</p>
              {errorMessage && (
                <p className="mt-2 text-xs text-rose-300">{errorMessage}</p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleFetchLatestReport}
                disabled={status === STATUS.PROCESSING}
                className="rounded-full border border-white/25 px-4 py-2 text-xs uppercase tracking-wider transition hover:border-violet-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                查看最近报告
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
              <div className="flex h-[260px] items-center justify-center p-3 md:h-[320px]">
                <p className="px-4 text-center text-sm text-blue-50/55">
                  WSI 原始格式通常无法直接在浏览器预览。
                  <br />
                  报告生成后请在右侧查看 PDF 预览，或下载到本地。
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

            <div className="mt-4 min-h-[430px] rounded-xl border border-white/15 bg-black/35 p-4">
              {status === STATUS.PROCESSING && (
                <div className="flex h-full min-h-[390px] flex-col items-center justify-center gap-3">
                  <div className="three-body">
                    <div className="three-body__dot" />
                    <div className="three-body__dot" />
                    <div className="three-body__dot" />
                  </div>
                  <p className="text-sm text-blue-50/75">上传中并等待后端生成报告，请稍候...</p>
                </div>
              )}

              {status !== STATUS.PROCESSING && !reportUrl && (
                <div className="flex h-full min-h-[390px] items-center justify-center">
                  <p className="text-center text-sm text-blue-50/60">
                    上传成功后，后端返回的 PDF 报告会在这里预览。
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
                      className="h-[300px] w-full bg-white md:h-[360px]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => saveBlobAsFile(new Blob([], { type: "application/pdf" }), reportFileName)}
                      className="hidden"
                    >
                      hidden
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const response = await fetch(reportUrl);
                        const blob = await response.blob();
                        saveBlobAsFile(blob, reportFileName);
                      }}
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
