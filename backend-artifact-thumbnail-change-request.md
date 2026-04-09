# PathoInsight 后端改造需求：中间文件缩略图可视化稳定性

## 1. 背景与问题

当前前端在切片处理页需要展示两类中间缩略图：

- query 高注意力 patch
- similar patch

实际联调中发现：

- `query_high_attention` / `similar_patches` 的记录中，图片路径字段不稳定，可能出现在 `artifact_relative_path`、`saved_patch_path`、`saved_image`、`image_path`、`patch_path`、`candidate_patch_path` 等不同键。
- 某些场景返回绝对路径（本地文件系统路径），前端无法直接作为可访问 URL 使用。
- `/jobs/{job_id}/artifact-file` 返回体虽然可下载，但缺少统一的“可预览 URL + 媒体类型”信息，前端需要猜测并做兼容分支。

这会导致缩略图无法稳定展示、排版抖动、调试成本高。

## 2. 目标

提供**稳定、可预览、可缓存**的中间文件元数据，使前端零猜测渲染缩略图和文件列表。

## 3. 接口改造范围

### 3.1 接口

- `GET /jobs/{job_id}/artifacts`

### 3.2 输出结构新增/规范化

在每条 patch 记录（query/similar）中统一新增字段：

- `thumbnail_relative_path`: string
  - 相对 `run_dir` 的路径（例如 `query/high_attention/query_high_attn_rank001_x...png`）
  - 若无缩略图则返回空字符串
- `thumbnail_url`: string
  - 可直接用于 `<img src>` 的 URL
  - 推荐后端直接拼好：`/jobs/{job_id}/artifact-file?path=...`
- `thumbnail_mime_type`: string
  - 例如 `image/png`
- `thumbnail_exists`: boolean

在 `files` 列表中新增字段：

- `mime_type`: string
- `size`: number（字节）
- `previewable`: boolean（是否可内嵌预览，例如 image/pdf/json/text）

## 4. 返回示例（建议）

```json
{
  "job_id": "87c06fafc1234fe88be8564c172d9611",
  "status": "succeeded",
  "run_dir": "/.../runs/20260401_...",
  "query_high_attention": [
    {
      "x": 1234,
      "y": 5678,
      "attention_score": 0.9132,
      "thumbnail_relative_path": "query/high_attention/query_high_attn_rank001_x1234_y5678.png",
      "thumbnail_url": "/jobs/87c06fafc1234fe88be8564c172d9611/artifact-file?path=query/high_attention/query_high_attn_rank001_x1234_y5678.png",
      "thumbnail_mime_type": "image/png",
      "thumbnail_exists": true
    }
  ],
  "similar_patches": [
    {
      "slide_id": "TCGA-xx-xxxx",
      "similarity": 0.874,
      "thumbnail_relative_path": "similar/top_k/similar_rank001_....png",
      "thumbnail_url": "/jobs/87c06fafc1234fe88be8564c172d9611/artifact-file?path=similar/top_k/similar_rank001_....png",
      "thumbnail_mime_type": "image/png",
      "thumbnail_exists": true
    }
  ],
  "files": [
    {
      "name": "query_high_attention_patches.csv",
      "relative_path": "query/query_high_attention_patches.csv",
      "mime_type": "text/csv",
      "size": 18234,
      "previewable": true
    }
  ]
}
```

## 5. 兼容性要求

- 保留现有字段，新增字段向后兼容。
- 现有 `artifact_relative_path` 可继续保留，但建议逐步以 `thumbnail_*` 字段为准。
- 对不存在的缩略图返回空字符串 + `thumbnail_exists=false`，不要返回本地绝对路径。

## 6. 验收标准

1. 前端不做路径猜测，仅使用 `thumbnail_url` 即可稳定显示 query/similar 缩略图。
2. 任意一条缩略图缺失时，接口返回结构仍完整，不影响其余记录。
3. `files` 列表包含 `mime_type/size/previewable`，前端可据此排序与预览。
4. 压测下（100 条 similar patch）接口响应结构稳定，字段齐全。

## 7. 联调建议

- 先在测试 job ID 上验证 3 种场景：
  - 全部缩略图存在
  - 部分缩略图缺失
  - 图片/CSV/JSON/PDF 混合文件列表
- 前端以 `thumbnail_url` 与 `previewable` 为唯一渲染依据。
