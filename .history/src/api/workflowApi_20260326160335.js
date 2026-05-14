import { httpRequest } from "./httpClient";

export const WORKFLOW_STAGES = Object.freeze([
  "uploaded",
  "classifying",
  "patching",
  "patch_scoring",
  "retrieving_similar",
  "generating_report",
  "done",
]);

const DEFAULT_POLL_INTERVAL_MS = 2000;

/**
 * @typedef {"uploaded" | "classifying" | "patching" | "patch_scoring" | "retrieving_similar" | "generating_report" | "done"} WorkflowStage
 */

/**
 * @typedef {{ label: string, confidence: number }} ClassificationResult
 */

/**
 * @typedef {{ img: string, score: number, report: string }} PatchResult
 */

/**
 * @typedef {{ patchImg: string, similarity: number, report: string }} SimilarCase
 */

/**
 * @typedef {{
 *   classification?: ClassificationResult,
 *   topPatches?: PatchResult[],
 *   similarCases?: SimilarCase[],
 *   finalReport?: string | null
 * }} WorkflowResult
 */

/**
 * @typedef {{
 *   stage: WorkflowStage | string,
 *   progress: number,
 *   result: WorkflowResult
 * }} JobStatusResponse
 */

const clampProgress = (value) => {
  if (typeof value !== "number") return 0;
  return Math.max(0, Math.min(1, value));
};

const normalizeResult = (result) => ({
  classification: result?.classification,
  topPatches: Array.isArray(result?.topPatches) ? result.topPatches : [],
  similarCases: Array.isArray(result?.similarCases) ? result.similarCases : [],
  finalReport:
    typeof result?.finalReport === "string" || result?.finalReport === null
      ? result.finalReport
      : null,
});

export const isKnownStage = (stage) => WORKFLOW_STAGES.includes(stage);

export const normalizeJobStatus = (payload) => {
  const stage = typeof payload?.stage === "string" ? payload.stage : "uploaded";
  const progress = clampProgress(payload?.progress);
  const result = normalizeResult(payload?.result);

  return { stage, progress, result };
};

export const uploadWSI = async (file, options = {}) => {
  if (!file) {
    throw new Error("WSI file is required");
  }

  const formData = new FormData();
  const fileField = import.meta.env.VITE_WSI_FILE_FIELD || "file";
  formData.append(fileField, file);

  const response = await httpRequest("/api/wsi/upload", {
    method: "POST",
    body: formData,
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });

  if (!response?.jobId) {
    throw new Error("Upload response missing jobId");
  }

  return response;
};

export const getJobStatus = async (jobId, options = {}) => {
  if (!jobId) {
    throw new Error("jobId is required");
  }

  const response = await httpRequest("/api/job/status", {
    method: "GET",
    query: { jobId },
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });

  return normalizeJobStatus(response);
};

export const createJobStatusPoller = ({
  jobId,
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
  onData,
  onError,
  stopWhenDone = true,
}) => {
  if (!jobId) {
    throw new Error("jobId is required for polling");
  }

  let timer = null;
  let stopped = false;

  const stop = () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const tick = async () => {
    if (stopped) return;

    try {
      const data = await getJobStatus(jobId);
      onData?.(data);

      if (stopWhenDone && data.stage === "done") {
        stop();
        return;
      }
    } catch (error) {
      onError?.(error);
    }

    if (!stopped) {
      timer = setTimeout(tick, intervalMs);
    }
  };

  tick();

  return { stop };
};
