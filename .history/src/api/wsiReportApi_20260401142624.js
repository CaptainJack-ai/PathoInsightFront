const DEFAULT_API_BASE_URL = "/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

const JOB_FINAL_STATUS = new Set(["succeeded", "failed"]);
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

const ensurePdfResponse = (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/pdf")) {
    throw new Error("后端返回内容不是 PDF，请检查服务状态");
  }
};

const getErrorDetail = async (response) => {
  try {
    const payload = await response.json();
    if (payload?.detail && typeof payload.detail === "string") {
      return payload.detail;
    }
  } catch {
    // ignore parse error and fallback to status text
  }

  return response.statusText || "请求失败";
};

const parseDownloadName = (response, fallback = "diagnosis-report.pdf") => {
  const disposition = response.headers.get("content-disposition") || "";

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
};

const ensureWsiExtension = (fileName) => {
  const ext = fileName?.toLowerCase().split(".").pop();
  const supported = new Set(["svs", "tif", "tiff", "ndpi", "mrxs"]);

  if (!ext || !supported.has(ext)) {
    throw new Error("仅支持 .svs/.tif/.tiff/.ndpi/.mrxs 文件");
  }
};

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestJson = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), options);
  if (!response.ok) {
    const detail = await getErrorDetail(response);
    throw new Error(detail);
  }
  return response.json();
};

const requestBlob = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), options);
  if (!response.ok) {
    const detail = await getErrorDetail(response);
    throw new Error(detail);
  }
  const blob = await response.blob();
  return {
    blob,
    contentType: response.headers.get("content-type") || blob.type || "application/octet-stream",
    fileName: parseDownloadName(response),
  };
};

export const uploadAndCreateJob = async (file, options = {}) => {
  if (!file) {
    throw new Error("请选择要上传的 WSI 文件");
  }

  ensureWsiExtension(file.name);

  const formData = new FormData();
  formData.append("file", file);

  return requestJson("/jobs/upload", {
    method: "POST",
    body: formData,
    signal: options.signal,
  });
};

export const uploadFile = async (file, options = {}) => {
  if (!file) {
    throw new Error("请选择要上传的 WSI 文件");
  }

  ensureWsiExtension(file.name);

  const formData = new FormData();
  formData.append("file", file);

  return requestJson("/upload", {
    method: "POST",
    body: formData,
    signal: options.signal,
  });
};

export const createJob = async (uploadedPath, options = {}) => {
  if (!uploadedPath || typeof uploadedPath !== "string") {
    throw new Error("uploadedPath 不能为空");
  }

  return requestJson("/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploaded_path: uploadedPath }),
    signal: options.signal,
  });
};

export const getJob = async (jobId, options = {}) => {
  if (!jobId) {
    throw new Error("jobId 不能为空");
  }
  return requestJson(`/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    signal: options.signal,
  });
};

export const getJobLogs = async (jobId, options = {}) => {
  if (!jobId) {
    throw new Error("jobId 不能为空");
  }

  const afterSeq = Number.isFinite(options.afterSeq) ? options.afterSeq : 0;
  const limit = Number.isFinite(options.limit) ? options.limit : 200;
  const params = new URLSearchParams({
    after_seq: String(Math.max(0, afterSeq)),
    limit: String(Math.max(1, Math.min(1000, limit))),
  });

  return requestJson(`/jobs/${encodeURIComponent(jobId)}/logs?${params.toString()}`, {
    method: "GET",
    signal: options.signal,
  });
};

export const getJobArtifacts = async (jobId, options = {}) => {
  if (!jobId) {
    throw new Error("jobId 不能为空");
  }
  return requestJson(`/jobs/${encodeURIComponent(jobId)}/artifacts`, {
    method: "GET",
    signal: options.signal,
  });
};

export const downloadArtifactFile = async (jobId, relativePath, options = {}) => {
  if (!jobId) {
    throw new Error("jobId 不能为空");
  }
  if (!relativePath || typeof relativePath !== "string") {
    throw new Error("relativePath 不能为空");
  }

  const params = new URLSearchParams({ path: relativePath });
  return requestBlob(`/jobs/${encodeURIComponent(jobId)}/artifact-file?${params.toString()}`, {
    method: "GET",
    signal: options.signal,
  });
};

export const getJobReport = async (jobId, options = {}) => {
  if (!jobId) {
    throw new Error("jobId 不能为空");
  }
  return requestJson(`/jobs/${encodeURIComponent(jobId)}/report`, {
    method: "GET",
    signal: options.signal,
  });
};

export const downloadJobReportPdf = async (jobId, options = {}) => {
  if (!jobId) {
    throw new Error("jobId 不能为空");
  }

  const response = await fetch(buildUrl(`/jobs/${encodeURIComponent(jobId)}/report-pdf`), {
    method: "GET",
    signal: options.signal,
  });

  if (!response.ok) {
    const detail = await getErrorDetail(response);
    throw new Error(detail);
  }

  ensurePdfResponse(response);
  const blob = await response.blob();
  return {
    blob,
    contentType: response.headers.get("content-type") || "application/pdf",
    fileName: parseDownloadName(response),
  };
};

export const waitForJobCompletion = async (jobId, options = {}) => {
  const intervalMs = Number.isFinite(options.intervalMs)
    ? Math.max(300, options.intervalMs)
    : DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(intervalMs, options.timeoutMs)
    : DEFAULT_TIMEOUT_MS;
  const includeLogs = options.includeLogs === true;
  const logsLimit = Number.isFinite(options.logsLimit)
    ? Math.max(1, Math.min(1000, options.logsLimit))
    : 200;

  const startedAt = Date.now();
  let afterSeq = Number.isFinite(options.initialAfterSeq) ? Math.max(0, options.initialAfterSeq) : 0;
  let latestJob = null;

  while (true) {
    if (options.signal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    latestJob = await getJob(jobId, { signal: options.signal });

    let logsChunk = null;
    if (includeLogs) {
      logsChunk = await getJobLogs(jobId, {
        afterSeq,
        limit: logsLimit,
        signal: options.signal,
      });
      afterSeq = logsChunk.next_seq ?? afterSeq;
    }

    if (typeof options.onProgress === "function") {
      options.onProgress({
        job: latestJob,
        logs: logsChunk,
      });
    }

    if (JOB_FINAL_STATUS.has(latestJob.status)) {
      return {
        job: latestJob,
        afterSeq,
      };
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error("任务等待超时，请稍后重试或检查后端状态");
    }

    await sleep(intervalMs);
  }
};

export const uploadWsiAndGenerateReport = async (file, options = {}) => {
  const created = await uploadAndCreateJob(file, { signal: options.signal });
  const jobId = created?.job_id;
  if (!jobId) {
    throw new Error("后端未返回有效 job_id");
  }

  const { job } = await waitForJobCompletion(jobId, {
    signal: options.signal,
    intervalMs: options.intervalMs,
    timeoutMs: options.timeoutMs,
    includeLogs: options.includeLogs,
    logsLimit: options.logsLimit,
    onProgress: options.onProgress,
  });

  if (job.status !== "succeeded") {
    throw new Error(job.error || "任务执行失败");
  }

  const pdf = await downloadJobReportPdf(jobId, { signal: options.signal });
  return {
    ...pdf,
    jobId,
  };
};

export const getLatestReport = async (options = {}) => {
  if (options?.jobId) {
    return downloadJobReportPdf(options.jobId, { signal: options.signal });
  }

  throw new Error("当前后端不支持 /report 最新报告接口，请传入 jobId 调用任务报告接口");
};

export const getApiBaseUrl = () => API_BASE_URL;
