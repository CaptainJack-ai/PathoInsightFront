# PathoInsight Workflow API 文档

本文档定义 PathoInsight 流程展示页使用的后端接口协议，目标是让前端仅通过 `stage` 驱动流程动画。

## 1. 流程概览

WSI 上传 -> 获取 `jobId` -> 轮询状态接口 -> 按阶段渲染动画与结果。

## 2. 接口列表

### 2.1 上传 WSI

- Method: `POST`
- Path: `/api/wsi/upload`
- Content-Type: `multipart/form-data`
- Form 字段: `file`（可通过前端环境变量 `VITE_WSI_FILE_FIELD` 覆盖）

请求示例：

```bash
curl -X POST "http://localhost:5173/api/wsi/upload" \
  -F "file=@/path/to/sample.wsi"
```

响应示例：

```json
{
  "jobId": "job_20260326_001"
}
```

约束：

- 必须返回 `jobId`。
- `jobId` 为空时，前端会视为异常响应。

### 2.2 查询任务状态（核心接口）

- Method: `GET`
- Path: `/api/job/status`
- Query: `jobId`

请求示例：

```bash
curl "http://localhost:5173/api/job/status?jobId=job_20260326_001"
```

响应示例：

```json
{
  "stage": "patch_scoring",
  "progress": 0.62,
  "result": {
    "classification": {
      "label": "Tumor",
      "confidence": 0.93
    },
    "topPatches": [
      {
        "img": "https://example.com/patch_001.png",
        "score": 0.98,
        "report": "High-risk glandular morphology"
      }
    ],
    "similarCases": [
      {
        "patchImg": "https://example.com/similar_patch_01.png",
        "similarity": 0.91,
        "report": "Case with similar structural atypia"
      }
    ],
    "finalReport": null
  }
}
```

字段说明：

- `stage`: 当前阶段字符串。
- `progress`: 0~1 的流程进度。
- `result.classification`: 切片分类结果。
- `result.topPatches`: 高注意力 patch 列表（CLAM）。
- `result.similarCases`: 相似案例列表（RAG）。
- `result.finalReport`: 最终诊断报告（LLM 生成，完成前可为 `null`）。

## 3. 阶段定义（前端动画驱动）

允许值：

```txt
uploaded
classifying
patching
patch_scoring
retrieving_similar
generating_report
done
```

语义建议：

- `uploaded`: 文件已上传，任务创建完成。
- `classifying`: 正在进行切片类别预测。
- `patching`: 正在进行 patch 切分。
- `patch_scoring`: 正在计算/筛选高注意力 patch。
- `retrieving_similar`: 正在检索相似案例。
- `generating_report`: 正在生成最终报告。
- `done`: 全流程完成。

## 4. 轮询建议

- 轮询间隔：`2s`。
- 终止条件：`stage === "done"`。
- 异常处理：请求失败时停止轮询并提示错误。

## 5. 错误响应建议

推荐后端统一返回：

```json
{
  "message": "Human readable error message"
}
```

前端会优先读取：

1. `message`
2. `error`
3. `HTTP status` 兜底信息

## 6. 前端环境变量

- `VITE_API_BASE_URL`: API 基础地址（默认空字符串，即同源）。
- `VITE_WSI_FILE_FIELD`: 上传字段名（默认 `file`）。

## 7. 前端服务层对应关系

当前前端已封装以下 API：

- `uploadWSI(file, options)`
- `getJobStatus(jobId, options)`
- `createJobStatusPoller({ jobId, intervalMs, onData, onError, stopWhenDone })`

对应实现文件：

- [src/api/workflowApi.js](../src/api/workflowApi.js)
- [src/api/httpClient.js](../src/api/httpClient.js)
