const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const WORKFLOW_STAGES = [
  "uploaded",
  "classifying",
  "patching",
  "patch_scoring",
  "retrieving_similar",
  "generating_report",
  "done",
];

const toApiUrl = (path) => `${API_BASE_URL}${path}`;

const assertOk = async (response) => {
  if (response.ok) return response;
  const text = await response.text();
  throw new Error(text || `Request failed: ${response.status}`);
};

export const uploadWSI = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(toApiUrl("/api/wsi/upload"), {
    method: "POST",
    body: formData,
  });

  await assertOk(response);
  return response.json();
};

export const getJobStatus = async (jobId) => {
  const response = await fetch(
    toApiUrl(`/api/job/status?jobId=${encodeURIComponent(jobId)}`),
    {
      method: "GET",
    }
  );

  await assertOk(response);
  return response.json();
};

export const isKnownStage = (stage) => WORKFLOW_STAGES.includes(stage);
