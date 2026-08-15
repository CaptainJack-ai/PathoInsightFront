# PathoInsight 后端 API 接口指导文档

> **用途**: 供后端开发人员参考，指导如何改造/新增 API 以支持前端两份报告（诊断报告 + 推理报告）的展示。
> **版本**: v2.0 — 双报告版本
> **日期**: 2026-06-27

---

## 目录

1. [概述](#1-概述)
2. [工作流页面 (`/workflow`) 的数据组织](#2-工作流页面-workflow-的数据组织)
3. [切片处理页面 (`/slice-processing`) 的 API 接口](#3-切片处理页面-slice-processing-的-api-接口)
4. [两份报告的数据模型](#4-两份报告的数据模型)
5. [文件存储规范](#5-文件存储规范)
6. [API 端点详细说明](#6-api-端点详细说明)
7. [迁移指南](#7-迁移指南)

---

## 1. 概述

本平台现在需要支持 **两份报告** 的生成与展示：

| 报告名称 | 前端展示标签 | 用途 | 文件命名约定 |
|---------|-------------|------|-------------|
| **诊断报告** (Diagnosis Report) | "诊断报告 PDF" | AI 模型生成的病理诊断结果，包含癌种、分级、分期、免疫组化等核心诊断结论 | `diagnosis-report.pdf` |
| **推理报告** (Reasoning Report) | "推理报告 PDF" | AI 模型的推理过程和中间证据，包括检索到的相似病例、注意力热点分析、形态学描述等 | `reasoning-report.pdf` |

两份报告将会在以下两个页面展示：
- **工作流页面** (`/workflow/:caseId`) — 步骤 5 "报告生成" 阶段
- **切片处理页面** (`/slice-processing`) — 任务完成后的报告预览区

---

## 2. 工作流页面 (`/workflow`) 的数据组织

### 2.1 数据来源

工作流页面使用的是 **静态资产目录** `public/workflow-cases/`，而非实时 API 调用。

**目录结构 (每个病例):**
```
public/workflow-cases/{caseId}/
├── flow_data.json              # 流程数据（步骤配置 + 检索链接）
├── source_meta.json             # 源文件元信息
├── uploaded.webp                # 步骤1: WSI 上传缩略图
├── classifying.webp             # 步骤2: 分类可视化
├── patching.webp                # 步骤3: 切片分块
├── retrieving_similar.webp      # 步骤4: 相似检索
├── generating_report.webp       # 步骤5: 报告生成
├── high-attention/              # 高注意力 Patch 图像
│   ├── patch-1.webp
│   ├── ...
│   └── patch-12.webp
├── similar-wsi/                 # 相似 WSI 缩略图
│   ├── similar-1.webp
│   ├── ...
│   └── similar-12.webp
├── similar-diagnosis/
│   └── similar-diagnosis.json   # 相似病例诊断文本（12 条）
└── report/
    ├── diagnosis-report.pdf     # [必须] 诊断报告 PDF
    └── reasoning-report.pdf     # [可选] 推理报告 PDF（如无，前端只显示诊断报告）
```

### 2.2 caseId 命名规则

小写 + TCGA 癌症缩写：

| caseId | 中文名 | TCGA 标签 |
|--------|-------|----------|
| `brca` | 乳腺癌 | TCGA-BRCA |
| `coad` | 结肠腺癌 | TCGA-COAD |
| `gbm` | 胶质母细胞瘤 | TCGA-GBM |
| `hnsc` | 头颈鳞癌 | TCGA-HNSC |
| `kirc` | 肾透明细胞癌 | TCGA-KIRC |
| `luad` | 肺腺癌 | TCGA-LUAD |
| `lusc` | 肺鳞癌 | TCGA-LUSC |
| `prad` | 前列腺腺癌 | TCGA-PRAD |
| `read` | 直肠腺癌 | TCGA-READ |
| `stad` | 胃腺癌 | TCGA-STAD |

### 2.3 `flow_data.json` 数据格式

```json
{
  "code": "BRCA",
  "tcga_label": "TCGA-BRCA",
  "query_slide_id": "TCGA-A1-A0SB-01Z-00-DX1...",
  "run_dir": "data/entire project process/runs/...",
  "steps": {
    "step1_query_upload": "data/dataforFront/BRCA/uploaded.webp",
    "step2_classification": "data/.../prediction.json",
    "step3_query_high_attention": "data/dataforFront/BRCA/high-attention",
    "step4_retrieval_mapping": "data/.../top_similar_patches.csv",
    "step4_case_summary": "data/.../top_similar_cases.csv",
    "step5_report": "data/dataforFront/BRCA/report/diagnosis-report.pdf",
    "step5_reasoning_report": "data/dataforFront/BRCA/report/reasoning-report.pdf"
  },
  "counts": {
    "patch_count": 12,
    "similar_wsi_count": 12,
    "diagnosis_item_count": 12
  },
  "flow_links": [
    {
      "index": 1,
      "query_patch": {
        "x": 75469,
        "y": 33664,
        "attention_score": 10.401594,
        "image": "data/dataforFront/BRCA/high-attention/patch-1.webp"
      },
      "retrieved_patch": {
        "slide_id": "TCGA-A2-A0T3-01Z-00-DX1...",
        "case_id": "TCGA-A2-A0T3",
        "x": 108849,
        "y": 14992,
        "similarity": 0.62084574,
        "attention_score": 9.327803611755373,
        "saved_patch_path": "data/.../sim_0001_...png"
      },
      "similar_wsi": {
        "image": "data/dataforFront/BRCA/similar-wsi/similar-1.webp"
      },
      "diagnosis": {
        "diagnosis_text": "完整的诊断文本描述...",
        "summary": "诊断摘要..."
      },
      "mapping_note": "query_patch 与 retrieved_patch 通过特征相似度检索关联..."
    }
    // ... 共 12 条 flow_links
  ]
}
```

> **新增字段**: `steps.step5_reasoning_report` — 指向推理报告的路径

### 2.4 `source_meta.json` 数据格式

```json
{
  "tcga_label": "TCGA-BRCA",
  "short_code": "BRCA",
  "query_wsi": "/data3/.../TCGA-A1-A0SB-01Z-00-DX1...svs",
  "query_slide_id": "TCGA-A1-A0SB-01Z-00-DX1...",
  "run_dir": "/data3/.../runs/TCGA-A1-A0SB..._20260327_115036"
}
```

### 2.5 `similar-diagnosis.json` 数据格式

```json
{
  "caseId": "brca-case",
  "items": [
    {
      "index": 1,
      "diagnosis_text": "完整的诊断文本描述...",
      "summary": "诊断摘要..."
    }
    // ... 共 12 条 items，index 1-12
  ]
}
```

### 2.6 前端数据加载逻辑

前端 `WorkflowPage.jsx` 通过 `workflowCases.js` 工厂函数生成病例数据：

```javascript
// workflowCases.js - 核心字段
const makeCase = (id, name, classificationLabel) => ({
  id,
  name,
  classificationLabel,
  stageImages: { /* 5 张阶段图片 */ },
  patchHighlights: [ /* 12 个 patch.webp 路径 */ ],
  retrievalItems: [ /* 12 个检索项 */ ],
  similarDiagnosisJson: `/workflow-cases/${id}/similar-diagnosis/similar-diagnosis.json`,
  reportPdf: `/workflow-cases/${id}/report/diagnosis-report.pdf`,
  reasoningReportPdf: `/workflow-cases/${id}/report/reasoning-report.pdf`,  // <-- 新增
  stageContent: { /* 各阶段占位描述 */ },
});
```

- `reportPdf` → 诊断报告 PDF
- `reasoningReportPdf` → 推理报告 PDF（如果文件不存在，前端不会显示推理报告区域）

---

## 3. 切片处理页面 (`/slice-processing`) 的 API 接口

### 3.1 异步任务流程

```
用户上传 WSI → POST /api/jobs/upload → 创建任务 → 轮询 /api/jobs/:jobId → 
任务完成 → GET /api/jobs/:jobId/report → 获取报告 URL
```

### 3.2 现有 API 端点

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/jobs/upload` | 上传 WSI 文件并创建任务 |
| GET | `/api/jobs/:jobId` | 获取任务状态和进度 |
| GET | `/api/jobs/:jobId/logs` | 获取任务日志 |
| GET | `/api/jobs/:jobId/artifacts` | 获取中间产物列表 |
| GET | `/api/jobs/:jobId/artifact-file?path=...` | 下载中间文件 |
| **GET** | **`/api/jobs/:jobId/report`** | **获取报告 JSON（含 PDF URL）** |
| GET | `/api/jobs/:jobId/report-pdf` | 下载报告 PDF（旧版，单报告） |

### 3.3 报告接口改造方案

#### 改造 `GET /api/jobs/:jobId/report` 响应格式

当前返回示例：
```json
{
  "report_summary_pdf_url": "/api/output/pathology-report.pdf",
  "generated_report_pdf_url": "/api/output/reasoning-report.pdf",
  "report_pdf_url": "/api/output/diagnosis-report.pdf"
}
```

**应保持并规范化为:**
```json
{
  "report_summary_pdf_url": "/api/output/pathology/diagnosis-report.pdf",
  "generated_report_pdf_url": "/api/output/pathology/reasoning-report.pdf",
  "report_pdf_url": "/api/output/pathology/diagnosis-report.pdf",
  "report_json_data": { /* 可选：结构化诊断 JSON */ },
  "report_summary_pdf": "/data/output/pathology/diagnosis-report.pdf",
  "generated_report_pdf": "/data/output/pathology/reasoning-report.pdf"
}
```

**字段说明:**

| 字段 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `report_summary_pdf_url` | string | ✅ | 诊断报告的 **可访问 URL**（前端 iframe 加载） |
| `generated_report_pdf_url` | string | ✅ | 推理报告的 **可访问 URL**（前端 iframe 加载） |
| `report_pdf_url` | string | ❌ | 兼容旧字段，与 `report_summary_pdf_url` 相同即可 |
| `report_json_data` | object | ❌ | 可选的结构化诊断 JSON 数据 |
| `report_summary_pdf` | string | ❌ | 诊断报告的服务端文件路径 |
| `generated_report_pdf` | string | ❌ | 推理报告的服务端文件路径 |

#### 新增 `GET /api/jobs/:jobId/report-pdf?type=diagnosis|reasoning`

> **可选**：如果希望分别下载两份报告，可以新增查询参数

```
GET /api/jobs/:jobId/report-pdf?type=diagnosis    → 返回诊断报告 PDF
GET /api/jobs/:jobId/report-pdf?type=reasoning    → 返回推理报告 PDF
```

如果不传 `type` 参数，默认返回诊断报告（向后兼容）。

---

## 4. 两份报告的数据模型

### 4.1 诊断报告 (`diagnosis-report.pdf`)

**内容要求:**
- 患者/病例基本信息
- AI 预测的癌种分类（Top 类别及概率）
- 组织学分级、病理分期
- 免疫组化结果 (ER/PR/HER2/Ki-67 等)
- 分子分型（如 Luminal A/B, HER2-enriched 等）
- 最终诊断结论

**文件命名:** `diagnosis-report.pdf`

### 4.2 推理报告 (`reasoning-report.pdf`)

**内容要求:**
- AI 推理过程概述
- 检索到的 Top-K 相似病例摘要
- 高注意力 Patch 热区分析
- 形态学描述（GLM 多模态分析输出）
- 证据质量评分
- 对比分析与诊断依据

**文件命名:** `reasoning-report.pdf`

---

## 5. 文件存储规范

### 5.1 生成型数据（API 输出）

由后端运行时生成，存放于可公开访问的目录：

```
/api/output/{jobId}/
├── diagnosis-report.pdf
└── reasoning-report.pdf
```

### 5.2 静态案例数据（工作流展示）

存放于前端 `public/workflow-cases/{caseId}/` 目录，供工作流页面离线展示：

```
public/workflow-cases/{caseId}/report/
├── diagnosis-report.pdf      # 诊断报告
└── reasoning-report.pdf      # 推理报告（如无，前端只显示单报告）
```

### 5.3 原始示例数据

存放于 `public/examples/{CANCER}/` 目录（大写命名），为原始数据备份，前端**不使用**此目录：

```
public/examples/{CANCER}/report/
└── diagnosis-report.pdf      # 仅诊断报告
```

---

## 6. API 端点详细说明

### 6.1 上传并创建任务

```
POST /api/jobs/upload
Content-Type: multipart/form-data

Body: file=<WSI文件>
```

**响应:**
```json
{
  "job_id": "uuid-job-id-here",
  "status": "created"
}
```

### 6.2 获取任务状态

```
GET /api/jobs/:jobId
```

**响应:**
```json
{
  "job_id": "uuid-job-id-here",
  "status": "processing" | "succeeded" | "failed",
  "stage": "queued" | "classifying" | "patching" | "retrieving" | "generating",
  "progress": 45,
  "error": "错误信息（仅失败时）"
}
```

### 6.3 获取任务日志

```
GET /api/jobs/:jobId/logs?offset=0&limit=200
```

**响应:**
```json
{
  "items": [
    { "seq": 1, "ts": "2026-06-27T12:00:00Z", "source": "system", "line": "任务开始" }
  ],
  "total": 150,
  "has_more": false
}
```

### 6.4 获取任务产物列表

```
GET /api/jobs/:jobId/artifacts
```

**响应:**
```json
{
  "query_high_attention": [
    { "x": 75469, "y": 33664, "attention_score": 10.4, "artifact_relative_path": "patches/patch-1.png" }
  ],
  "similar_patches": [
    { "slide_id": "...", "similarity": 0.62, "artifact_relative_path": "similar/sim_0001.png" }
  ],
  "files": [
    { "relative_path": "output/diagnosis-report.pdf", "size": 102400 },
    { "relative_path": "output/reasoning-report.pdf", "size": 204800 }
  ],
  "run_dir": "/data/runs/job-uuid"
}
```

### 6.5 获取报告（核心 — 需改造）

```
GET /api/jobs/:jobId/report
```

**要求返回（两份报告版本）:**
```json
{
  "report_summary_pdf_url": "/api/output/{jobId}/diagnosis-report.pdf",
  "generated_report_pdf_url": "/api/output/{jobId}/reasoning-report.pdf",
  "report_pdf_url": "/api/output/{jobId}/diagnosis-report.pdf",
  "report_json_data": {
    "cancer_type": "BRCA",
    "diagnosis": "浸润性导管癌...",
    "confidence": 0.95
  },
  "report_summary_pdf": "/data/output/{jobId}/diagnosis-report.pdf",
  "generated_report_pdf": "/data/output/{jobId}/reasoning-report.pdf"
}
```

### 6.6 下载报告 PDF

```
GET /api/jobs/:jobId/report-pdf?type=diagnosis|reasoning
```

**响应:** `Content-Type: application/pdf` 的二进制 PDF 数据。

---

## 7. 迁移指南

### 7.1 后端需要做的改动

1. **报告生成阶段**: 生成两个 PDF 文件
   - `diagnosis-report.pdf`: 诊断结论报告
   - `reasoning-report.pdf`: 推理过程报告

2. **任务产物收集**: 将两个 PDF 的文件路径记录到任务的产物清单中

3. **Report API 改造**: 
   - `GET /api/jobs/:jobId/report` 响应中增加 `generated_report_pdf_url` 字段（指向推理报告）
   - `report_summary_pdf_url` 保持指向诊断报告
   - 确保两个 URL 都是前端可访问的公网地址

4. **Report-PDF API 改造**（可选）:
   - 为 `GET /api/jobs/:jobId/report-pdf` 增加 `?type=` 查询参数
   - `type=diagnosis` → 返回诊断报告
   - `type=reasoning` → 返回推理报告

### 7.2 两个页面加载逻辑小结

| 页面 | 数据来源 | 诊断报告字段 | 推理报告字段 |
|------|---------|-------------|-------------|
| `/workflow/:caseId` | 静态 `workflow-cases/{caseId}/report/` | `caseData.reportPdf` | `caseData.reasoningReportPdf` |
| `/slice-processing` | API `GET /api/jobs/:jobId/report` | `report_summary_pdf_url` | `generated_report_pdf_url` |

### 7.3 需要特别注意的点

1. **兼容性**: 如果推理报告不存在，前端会自动降级为只显示诊断报告（工作流页面）或使用 `report_pdf_url` 回退（切片页面）
2. **URL 格式**: `report_summary_pdf_url` 和 `generated_report_pdf_url` 需要是完整的可访问 URL（包括 `/api` 前缀）
3. **文件准备案例**: 静态案例目录 `workflow-cases/{caseId}/report/` 需要同时包含 `diagnosis-report.pdf` 和 `reasoning-report.pdf`
4. **推理报告的内容**: 应包含 AI 的推理依据、检索到的相似病例摘要、注意力热点分析等，而非仅重复诊断结论

---

## 附录 A: 前端对应代码位置

| 文件 | 功能 |
|------|------|
| `src/data/workflowCases.js` | 工作流页面数据工厂（定义了 `reportPdf` + `reasoningReportPdf`） |
| `src/pages/WorkflowPage.jsx` | 工作流页面组件（`ReportPdfShowcase` 渲染两份报告） |
| `src/pages/SliceProcessingPage.jsx` | 切片处理页面（读取 `report_summary_pdf_url` + `generated_report_pdf_url`） |
| `src/api/wsiReportApi.js` | API 客户端（`getJobReport` 获取报告数据） |
| `docs/BACKEND_API_GUIDE.md` | 本文档 |

## 附录 B: 数据类型速查

```
workflow-cases (静态)
├── flow_data.json
│   ├── steps.step5_report           → "data/dataforFront/{code}/report/diagnosis-report.pdf"
│   ├── steps.step5_reasoning_report → "data/dataforFront/{code}/report/reasoning-report.pdf"  [新增]
│   └── flow_links[].diagnosis       → { diagnosis_text, summary }
├── similar-diagnosis/similar-diagnosis.json
│   └── items[].{ diagnosis_text, summary }
└── report/
    ├── diagnosis-report.pdf
    └── reasoning-report.pdf

API (运行时)
GET /api/jobs/:id/report
├── report_summary_pdf_url   → 诊断报告 URL
├── generated_report_pdf_url → 推理报告 URL  [新增]
└── report_json_data         → 结构化诊断数据
```
