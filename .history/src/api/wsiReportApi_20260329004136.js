const DEFAULT_API_BASE_URL = "/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

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
  } catch (_) {
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
    } catch (_) {
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

export const uploadWsiAndGenerateReport = async (file, options = {}) => {
  if (!file) {
    throw new Error("请选择要上传的 WSI 文件");
  }

  ensureWsiExtension(file.name);

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
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

export const getLatestReport = async (options = {}) => {
  const response = await fetch(`${API_BASE_URL}/report`, {
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

export const getApiBaseUrl = () => API_BASE_URL;
