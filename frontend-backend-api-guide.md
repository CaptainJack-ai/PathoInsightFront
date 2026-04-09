# PathoInsight 前后端 API 对接文档（异步任务与中间结果传递）

本文档面向前端工程联调与生产接入，基于当前后端实现编写，目标如下：
- 确认“中间结果传递接口”已实现并说明可传递内容
- 给出稳定、可恢复、可观测的任务编排调用方式
- 规范错误处理、轮询策略、文件拉取策略与安全边界

## 1. 结论（先看）

当前后端已经实现中间结果传递能力，核心接口如下：
- `GET /jobs/{job_id}/artifacts`：返回结构化中间结果与产物清单
- `GET /jobs/{job_id}/artifact-file?path=...`：按相对路径返回单个中间文件
- `GET /jobs/{job_id}/logs`：返回增量日志（可用于实时进度与问题定位）

当前可传递的中间内容包括：
- Query 高注意力 patch 列表（最多 12 条）
- Similar patch 列表（最多 100 条）
- 诊断 JSON（若生成）
- 运行目录内所有 `.png/.jpg/.jpeg/.csv/.json/.pdf` 文件清单
- 基于文件清单按路径下载/预览单个文件

## 2. 基础约定

- Base URL：`http://127.0.0.1:8000`
- 编码：`UTF-8`
- 主要内容类型：
  - 上传：`multipart/form-data`
  - JSON 接口：`application/json`
  - 文件下载：依据文件类型（PDF 通常 `application/pdf`）
- 任务状态：`queued | running | succeeded | failed`
- 任务阶段：`queued | seg_patch | feature | clam | similar | generation | done | failed`

## 3. 前端推荐主流程

1. 上传并创建任务：`POST /jobs/upload`
2. 轮询任务状态：`GET /jobs/{job_id}`
3. 轮询增量日志：`GET /jobs/{job_id}/logs?after_seq=...`
4. 任务结束后：
  - 成功：读取中间产物 `GET /jobs/{job_id}/artifacts`
  - 成功：读取报告元数据 `GET /jobs/{job_id}/report`
  - 成功：下载报告 PDF `GET /jobs/{job_id}/report-pdf`
  - 失败：读取 `error` + 日志末尾进行展示

## 4. 接口说明（按调用顺序）

## 4.1 健康检查

### `GET /health`

用途：服务可用性与阶段定义探测。

响应示例：
```json
{
  "ok": true,
  "project_root": "...",
  "uploads": "...",
  "runs": "...",
  "stages": [
    {"key": "queued", "label": "排队中", "progress": 5},
    {"key": "feature", "label": "特征提取", "progress": 45}
  ]
}
```

## 4.2 上传并创建任务（推荐）

### `POST /jobs/upload`

- 请求体：`multipart/form-data`
- 字段：`file`
- 支持后缀：`.svs .tif .tiff .ndpi .mrxs`

成功响应：
```json
{
  "job_id": "a1b2c3...",
  "status": "queued",
  "input_file": "xxx.svs",
  "input_path": ".../uploads/xxx.svs"
}
```

失败场景：
- 后缀不支持：`400`
- 文件为空：`400`
- 文件不可读（非切片、HTML 误传、图像解析失败）：`400`

## 4.3 两步式调用（兼容）

### `POST /upload`
先上传，返回 `saved_path`。

### `POST /jobs`
使用 `saved_path` 创建任务：
```json
{
  "uploaded_path": ".../uploads/xxx.svs"
}
```

## 4.4 任务状态

### `GET /jobs/{job_id}`

响应示例：
```json
{
  "job_id": "...",
  "status": "running",
  "input_file": "...",
  "input_path": "...",
  "created_at": "2026-04-01T12:00:00Z",
  "updated_at": "2026-04-01T12:01:00Z",
  "started_at": "2026-04-01T12:00:05Z",
  "finished_at": null,
  "run_dir": null,
  "report_json": null,
  "report_pdf": null,
  "error": null,
  "stage": "feature",
  "progress": 45
}
```

字段说明：
- `progress`：后端阶段映射进度，范围 5~100
- `updated_at`：任务最近更新；可用于卡住检测
- `run_dir/report_json/report_pdf`：任务结束后可用（成功或失败均可能部分存在）

## 4.5 增量日志（实时观测）

### `GET /jobs/{job_id}/logs?after_seq=0&limit=200`

查询参数：
- `after_seq`：上次消费到的序号（首次传 `0`）
- `limit`：单次拉取条数（`1~1000`）

响应示例：
```json
{
  "job_id": "...",
  "after_seq": 120,
  "next_seq": 148,
  "has_more": false,
  "items": [
    {
      "seq": 121,
      "ts": "2026-04-01T12:02:10.123Z",
      "source": "stdout",
      "line": "[2/8] Load encoder + extract query patch features..."
    }
  ],
  "status": "running",
  "stage": "feature",
  "progress": 45
}
```

实现建议：
- 使用 `next_seq` 作为下一次 `after_seq`
- 若 `has_more=true`，可立刻补拉，避免积压
- 后端日志为环形缓存（上限 4000 条），前端应自行落盘关键日志

## 4.6 中间结果聚合

### `GET /jobs/{job_id}/artifacts`

用途：一次性拿到“中间结果索引 + 可展示数据 + 文件清单”。

响应示例：
```json
{
  "job_id": "...",
  "status": "succeeded",
  "run_dir": ".../runs/...",
  "query_high_attention": [
    {
      "slide_id": "...",
      "x": "...",
      "y": "...",
      "attention_score": "...",
      "saved_patch_path": "...",
      "artifact_relative_path": "query/high_attention_patches/query_high_attn_rank001_x...png"
    }
  ],
  "similar_patches": [
    {
      "slide_id": "...",
      "similarity": "...",
      "saved_patch_path": "...",
      "artifact_relative_path": "similar/top_similar_patches/sim_...png"
    }
  ],
  "diagnosis_json": {
    "query_info": {},
    "final_report": "..."
  },
  "files": [
    {
      "name": "query_high_attention_patches.csv",
      "relative_path": "query/query_high_attention_patches.csv"
    }
  ]
}
```

关键约束：
- `query_high_attention` 最多返回 12 条
- `similar_patches` 最多返回 100 条
- `diagnosis_json` 来自任务报告 JSON（存在才返回）
- `files` 只收录如下后缀：`.png/.jpg/.jpeg/.csv/.json/.pdf`

## 4.7 单文件传输接口（中间文件核心）

### `GET /jobs/{job_id}/artifact-file?path=<relative_path>`

用途：传输任意一个中间文件（图片、CSV、JSON、PDF），前提是它位于该 `job` 的 `run_dir` 下。

参数：
- `path`：相对 `run_dir` 的路径

推荐来源：
- 优先使用 `artifacts.files[].relative_path`
- 或使用 `query_high_attention/similar_patches` 中的 `artifact_relative_path`

示例：
- `/jobs/{job_id}/artifact-file?path=query/high_attention_patches/query_high_attn_rank001_x...png`
- `/jobs/{job_id}/artifact-file?path=similar/top_similar_patches/top_001.png`
- `/jobs/{job_id}/artifact-file?path=query/query_high_attention_patches.csv`

安全与错误：
- 路径穿越会被拒绝（`400`）
- 任务尚未产生产物（`400`）
- 文件不存在（`404`）

## 4.8 报告接口

### `GET /jobs/{job_id}/report`

用途：返回报告元数据；若 JSON 文件存在则内联 `report_json_data`。

任务未结束时响应示例：
```json
{
  "job_id": "...",
  "status": "running",
  "message": "任务尚未结束"
}
```

任务结束时响应示例：
```json
{
  "job_id": "...",
  "status": "succeeded",
  "run_dir": "...",
  "report_json": ".../final_pathology_report_xxx.json",
  "report_pdf": ".../final_generated_diagnostic_report_xxx.pdf",
  "error": null,
  "report_json_data": {
    "query_info": {},
    "final_report": "..."
  }
}
```

### `GET /jobs/{job_id}/report-pdf`

用途：直接下载最终 PDF。

返回：
- 成功：`200` + PDF 文件流
- `409`：`report_pdf` 尚未生成
- `404`：PDF 路径记录存在但文件已不存在

## 5. 当前可传递的中间文件清单（按目录语义）

以下为“当前实现可传递”的文件类型与典型路径（真实以 `artifacts.files` 为准）：

1. Query 侧中间文件
- `query/query_high_attention_patches.csv`
- `query/query_all_patches.csv`
- `query/prediction.json`
- `query/high_attention_patches/*.png`
- `query/visualizations/*.png`

2. Similar 检索侧中间文件
- `similar/top_similar_patches.csv`
- `similar/top_similar_cases.csv`
- `similar/top_similar_patches/*.png`

3. 报告侧文件
- `final_pathology_report_*.json`
- `final_pathology_report_*.md`
- `final_generated_diagnostic_report_*.md`
- `final_generated_diagnostic_report_*.pdf`
- `final_pathology_review_*.md`

4. 其他可传文件（只要在 run_dir 内且后缀受支持）
- 任意 `.png/.jpg/.jpeg/.csv/.json/.pdf`

## 6. 错误码与前端处理策略

- `400`：参数错误、非法路径、上传内容不合法
- `404`：任务不存在或文件不存在
- `409`：资源尚未就绪（常见于 PDF 尚未生成）
- `500`：后端内部异常

建议：
- 对 `409` 使用“稍后重试”而非“失败终态”
- 对 `404` 区分任务级与文件级提示
- 对 `failed` 状态优先展示：`error` + 最近 100 条日志

## 7. 前端状态机建议

- `idle`：未上传
- `submitting`：上传中
- `queued`：已排队
- `running`：执行中（展示 stage/progress/logs）
- `succeeded`：展示中间结果和报告
- `failed`：展示错误和排障信息

## 8. 轮询与性能建议

- `GET /jobs/{job_id}`：2~5 秒一次
- `GET /jobs/{job_id}/logs`：1~2 秒一次（活跃阶段）
- `GET /jobs/{job_id}/artifacts`：建议在 `succeeded` 后拉取
- 图片展示：先用列表懒加载，再按需调用 `artifact-file`
- 大文件下载：直接走 `artifact-file` 或 `report-pdf`，避免 JSON 内嵌二进制

## 9. 兼容与迁移

- 不建议继续使用“同步直出 PDF”模式作为前端主链路。
- 推荐统一采用本异步任务模式，以获得：
  - 实时进度
  - 可观测日志
  - 中间结果可视化
  - 更稳健的失败恢复
