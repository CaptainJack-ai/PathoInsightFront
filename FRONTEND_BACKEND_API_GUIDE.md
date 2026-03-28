# 病理 WSI 后端接口对接文档（前端）

## 1. 文档目的

本文档用于前端开发与联调，说明当前后端 `backend_fastapi.py` 的接口能力、请求与响应格式、错误处理、联调流程以及上线前注意事项。

后端是一个 FastAPI 服务，核心能力有两个：

1. 上传病理切片（WSI）文件并触发诊断流程。
2. 获取固定位置的最新诊断 PDF 报告。

---

## 2. 服务概览

- 技术栈：FastAPI
- 默认服务：`http://127.0.0.1:8000`
- 主要接口：
  - `POST /upload`：上传一个 WSI 文件，后端同步执行完整流程，成功后直接返回 PDF 文件流。
  - `GET /report`：获取固定报告路径中的最新 PDF 文件（如果存在）。

关键特性：

- `POST /upload` 的响应不是 JSON，而是 `application/pdf` 二进制流。
- 后端会把每次成功生成的 PDF 复制到一个固定路径，供 `GET /report` 使用。
- 当前后端是同步处理，请求耗时可能较长（取决于模型推理和数据处理耗时）。

---

## 3. 业务流程（前端视角）

1. 用户在页面选择一个 WSI 文件。
2. 前端发起 `POST /upload`（`multipart/form-data`，字段名固定为 `file`）。
3. 后端保存上传文件到 `uploads` 目录。
4. 后端调用推理脚本执行流程。
5. 后端找到生成的 PDF 并复制到固定位置。
6. 后端响应本次 PDF 文件流给前端。
7. 前端将响应保存为本地 PDF，或直接在浏览器中预览。

补充：

- 若页面刷新后需要再次查看最近报告，可调用 `GET /report`。

---

## 4. 接口定义

## 4.1 POST /upload

### 功能

上传 WSI 文件，触发后端管线，成功后返回 PDF 文件流。

### 请求

- 方法：`POST`
- 路径：`/upload`
- Content-Type：`multipart/form-data`
- 表单字段：
  - `file`（必填）：WSI 文件

### 支持文件扩展名

- `.svs`
- `.tif`
- `.tiff`
- `.ndpi`
- `.mrxs`

### 成功响应

- HTTP 状态码：`200`
- Content-Type：`application/pdf`
- 响应体：PDF 二进制流
- 文件名：后端以实际 PDF 文件名作为下载名

### 失败响应

- `400 Bad Request`
  - 可能原因：
    - 缺少文件名
    - 文件后缀不受支持
- `500 Internal Server Error`
  - 可能原因：
    - 推理脚本执行失败
    - 未解析到 run_dir
    - 未找到 PDF 报告

失败响应体为 JSON，结构示例：

```json
{
  "detail": "Unsupported WSI extension"
}
```

### 前端实现建议

- 使用 `fetch` 或 `axios` 上传 `FormData`。
- 必须按二进制处理响应（`blob`）。
- 当状态码不是 2xx 时，按 JSON 读取 `detail` 并提示用户。
- 上传按钮应具备“处理中”状态，避免重复提交。
- 需要提供长耗时提示（例如“报告生成中，请稍候”）。

### fetch 示例

```javascript
async function uploadWsiAndDownload(file) {
  const formData = new FormData();
  formData.append("file", file);

  const resp = await fetch("http://127.0.0.1:8000/upload", {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) {
    let message = "上传失败";
    try {
      const err = await resp.json();
      message = err.detail || message;
    } catch (_) {
      // 非 JSON 错误响应时使用默认提示
    }
    throw new Error(message);
  }

  const blob = await resp.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "diagnosis-report.pdf";
  a.click();
  window.URL.revokeObjectURL(url);
}
```

### axios 示例

```javascript
import axios from "axios";

async function uploadWsiAndDownload(file) {
  const formData = new FormData();
  formData.append("file", file);

  const resp = await axios.post("http://127.0.0.1:8000/upload", formData, {
    responseType: "blob",
  });

  const blob = new Blob([resp.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "diagnosis-report.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 4.2 GET /report

### 功能

获取固定路径中当前可用的 PDF 报告。

### 请求

- 方法：`GET`
- 路径：`/report`

### 成功响应

- HTTP 状态码：`200`
- Content-Type：`application/pdf`
- 响应体：PDF 二进制流

### 失败响应

- `404 Not Found`
  - 可能原因：固定报告文件不存在
- 错误体示例：

```json
{
  "detail": "PDF not found"
}
```

### 使用场景

- 页面初始化后点击“查看最近报告”。
- 用户未重新上传文件，仅想重新下载最近生成结果。

---

## 5. 错误码与前端提示建议

| HTTP 状态码 | 典型 detail | 前端提示建议 |
|---|---|---|
| 400 | Missing filename | 上传失败：文件名无效，请重新选择文件 |
| 400 | Unsupported WSI extension | 上传失败：仅支持 svs/tif/tiff/ndpi/mrxs |
| 404 | PDF not found | 当前暂无报告，请先上传 WSI |
| 500 | 任意运行时错误信息 | 报告生成失败，请稍后重试或联系管理员 |

建议在前端统一封装错误处理：

- 优先读取 JSON 中的 `detail`。
- 若读取失败，展示通用文案。
- 保留技术详情到日志系统（例如 Sentry），UI 给用户展示友好信息。

---

## 6. 上传与交互约束

- 单次只支持上传一个文件。
- 上传字段名必须是 `file`。
- 后端当前未提供进度回调，前端可通过本地上传进度 + 全局 loading 来改善体验。
- 后端耗时任务是同步阻塞式，请适当设置前端超时策略（建议长于普通 API）。
- 建议增加“取消等待”按钮，但注意后端不一定能中断正在执行的子进程。

---

## 7. 环境变量（影响前端联调行为）

以下变量由后端部署侧配置，但前端需要了解其影响：

- `WSI_UPLOAD_DIR`
  - 上传文件保存目录。
- `WSI_RUNS_ROOT`
  - 推理结果目录，后端会从这里解析最近 run。
- `WSI_REPORT_PDF`
  - 固定报告输出路径，`GET /report` 从这里取文件。
- `UNI_CKPT`
  - 模型权重路径。
- `QUERY_TEXT_FILE`
  - 可选文本查询文件。
- `PYTHON_EXECUTABLE`
  - 后端执行脚本所使用的 Python 命令。

说明：

- 这些变量不需要前端直接设置，但会影响接口是否可用、响应速度和结果稳定性。

---

## 8. CORS 与部署提示

当前代码中未显式配置 CORS 中间件。

影响：

- 若前端与后端不是同源（域名、端口、协议任一不同），浏览器会触发跨域限制。

联调建议：

- 本地开发阶段可通过前端代理转发，或由后端添加 CORS 配置。
- 生产环境建议严格限定允许域名，不建议通配 `*`。

---

## 9. 推荐前端页面状态机

建议最少包含以下状态：

1. `idle`：初始态，可选择文件。
2. `uploading_or_processing`：上传并等待报告生成。
3. `success`：报告生成成功，可下载或预览。
4. `error`：失败态，展示可重试入口。

推荐行为：

- 成功后缓存本次文件名、时间戳和下载链接。
- 失败时保留原文件，支持一键重试。
- 提供“查看最近报告”按钮，调用 `GET /report`。

---

## 10. 联调自测用例（前端）

1. 正常上传 `.svs` 文件，确认返回 PDF 可下载。
2. 上传不支持后缀（如 `.png`），应提示 400 错误。
3. 空文件或异常文件名，确认错误提示可读。
4. 后端运行失败场景（模拟 500），前端应显示失败并允许重试。
5. 未生成报告时调用 `GET /report`，应处理 404。
6. 同一页面多次上传，确认不会因为旧状态导致下载错误文件。

---

## 11. 已知限制与后续优化方向

当前限制：

- `POST /upload` 是同步长任务，用户等待时间较长。
- 暂无任务 ID、进度查询、取消任务等异步能力。
- `GET /report` 返回的是固定路径报告，不区分用户或会话。

优化建议：

1. 改造成异步任务模型：
   - `POST /upload` 返回 `job_id`
   - `GET /jobs/{job_id}` 查询进度
   - `GET /jobs/{job_id}/report` 下载专属报告
2. 增加鉴权和多用户隔离，避免报告串读。
3. 增加结构化日志与 trace_id，方便前后端排障。
4. 为前端提供 JSON 元信息接口（报告时间、文件名、状态、错误详情等）。

---

## 12. 接口速查

- 上传并生成报告：`POST /upload`（`multipart/form-data`, 字段 `file`）
- 获取最近报告：`GET /report`
- 成功返回：`application/pdf`
- 失败返回：`application/json`，核心字段 `detail`

---

如需我补一版“前端 TypeScript API 封装文件（含统一错误处理和下载工具函数）”，可直接在此文档基础上追加。