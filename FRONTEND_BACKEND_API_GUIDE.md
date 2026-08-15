# PathoInsight 前后端 API 对接文档（异步任务版）

## 1. 目标

前端上传 WSI 后，需要：
- 在页面看到后端处理进度（阶段 + 百分比）
- 在页面看到后端实时日志（增量拉取）
- 展示中间结果：
  - query slide 高注意力 patch（取前 12）
  - 相似病理 patch 列表
  - 诊断报告 JSON 文字版本
- 下载最终 PDF 报告

后端已支持以上能力，推荐统一走异步任务链路。

## 2. 基础信息

- Base URL: `http://127.0.0.1:8000`
- JSON 接口: `application/json`
- 上传接口: `multipart/form-data`
- PDF: `application/pdf`

## 3. 推荐调用流程

1. `POST /jobs/upload` 上传文件并创建任务，拿到 `job_id`
2. 轮询：
   - `GET /jobs/{job_id}`：状态/进度
   - `GET /jobs/{job_id}/logs?after_seq=...`：增量日志
3. 任务成功后：
   - `GET /jobs/{job_id}/artifacts`：中间产物和诊断 JSON
   - `GET /jobs/{job_id}/report-pdf`：下载 PDF

失败时：
- `GET /jobs/{job_id}` 查看 `error`
- `GET /jobs/{job_id}/logs` 查看日志尾部定位问题

## 4. 接口定义

### 4.1 健康检查

`GET /health`

返回：
```json
{
  "ok": true,
  "project_root": "...",
  "uploads": "...",
  "runs": "...",
  "stages": [
    {"key": "queued", "label": "排队中", "progress": 5}
  ]
}
```

### 4.2 上传并创建任务（推荐）

`POST /jobs/upload`

- 请求：`multipart/form-data`
- 字段：`file`
- 支持后缀：`.svs .tif .tiff .ndpi .mrxs`

成功示例：
```json
{
  "job_id": "4a24ca...",
  "status": "running",
  "input_file": "xxx.svs",
  "input_path": ".../uploads/xxx.svs"
}
```

### 4.3 任务状态

`GET /jobs/{job_id}`

返回关键字段：
- `status`: `queued | running | succeeded | failed`
- `stage`: `queued | seg_patch | feature | clam | similar | generation | done | failed`
- `progress`: 0~100
- `error`: 失败原因（失败时）
- `run_dir`, `report_json`, `report_pdf`: 产物路径信息

### 4.4 增量日志

`GET /jobs/{job_id}/logs?after_seq=0&limit=200`

参数：
- `after_seq`：上次最后日志序号（首次 0）
- `limit`：每次拉取条数（1~1000）

返回示例：
```json
{
  "job_id": "...",
  "after_seq": 0,
  "next_seq": 20,
  "has_more": false,
  "items": [
    {
      "seq": 1,
      "ts": "2026-04-01T04:31:12.53Z",
      "source": "stdout",
      "line": "[1/8] Segment + patch coordinate extraction..."
    }
  ],
  "status": "running",
  "stage": "feature",
  "progress": 45
}
```

### 4.5 中间产物

`GET /jobs/{job_id}/artifacts`

返回示例（裁剪）：
```json
{
  "job_id": "...",
  "status": "succeeded",
  "run_dir": "...",
  "query_high_attention": [
    {
      "score": "...",
      "artifact_relative_path": "query/high_attention_patches/patch_xxx.png"
    }
  ],
  "similar_patches": [
    {
      "similarity": "...",
      "slide_id": "...",
      "artifact_relative_path": "similar/top_similar_patches/sim_xxx.png"
    }
  ],
  "diagnosis_json": {
    "final_diagnosis": "..."
  },
  "files": [
    {
      "name": "...",
      "relative_path": "..."
    }
  ]
}
```

前端展示建议：
- `query_high_attention` 取前 12 条显示
- `similar_patches` 做网格列表
- `diagnosis_json` 原样展示文本

### 4.6 产物文件访问

`GET /jobs/{job_id}/artifact-file?path=<relative_path>`

- `path` 使用 `artifacts.files[].relative_path` 或条目中的 `artifact_relative_path`

### 4.7 报告元信息

`GET /jobs/{job_id}/report`

返回 JSON 版本报告元数据（含 `report_json_data`）

### 4.8 报告 PDF 下载

`GET /jobs/{job_id}/report-pdf`

- 成功返回 `application/pdf`
- `409`：PDF 尚未生成
- `404`：PDF 文件不存在

## 5. 兼容接口（可选）

- `POST /upload`：只上传，返回 `saved_path`
- `POST /jobs`：传 `uploaded_path` 创建任务

建议优先使用 `POST /jobs/upload` 简化前端逻辑。

## 6. 错误码建议

- `400`：参数错误/文件不合法
- `404`：任务或文件不存在
- `409`：任务未完成或产物尚未就绪
- `500`：后端内部错误

## 7. 前端最小实现建议

状态机：
- `idle`
- `submitting`
- `running`
- `succeeded`
- `failed`

轮询策略：
- 每 2~5 秒轮询一次
- 日志用 `after_seq` 增量拉取，避免重复渲染

页面模块建议：
- 顶部：任务状态 + 进度条
- 中部左：query 高注意力 patch（12 张）
- 中部右：相似病理 patch
- 底部：诊断 JSON 文本 + 日志面板 + 下载 PDF 按钮
