# Workflow Case Asset Guide

Place each pathology case assets under:

- `public/workflow-cases/<case-id>/`

The current case ids (aligned with dataforFront) are:

- `brca`
- `coad`
- `gbm`
- `hnsc`
- `kirc`
- `luad`
- `lusc`
- `prad`
- `read`
- `stad`

Required files per case:

- `uploaded.webp`
- `classifying.webp`
- `patching.webp`
- `retrieving_similar.webp`
- `generating_report.webp`
- `high-attention/patch-1.webp` ~ `high-attention/patch-12.webp`
- `similar-wsi/similar-1.webp` ~ `similar-wsi/similar-12.webp`
- `similar-diagnosis/similar-diagnosis.json`
- `report/diagnosis-report.pdf`
- `flow_data.json`
- `source_meta.json`

Flow rendering notes:

- Step 4 retrieval uses `flow_data.json -> flow_links` as the source of truth.
- Paths in `flow_data.json` are normalized at runtime to `/workflow-cases/<case-id>/...`.

Example:

- `public/workflow-cases/luad/uploaded.webp`
- `public/workflow-cases/luad/high-attention/patch-1.webp`
- `public/workflow-cases/luad/similar-wsi/similar-1.webp`
- `public/workflow-cases/luad/similar-diagnosis/similar-diagnosis.json`
- `public/workflow-cases/luad/report/diagnosis-report.pdf`
- `public/workflow-cases/luad/flow_data.json`

Tips:

- Recommended ratio: 16:9 or wider.
- Recommended width: >= 1600px for crisp desktop rendering.
- Keep case ids lowercase and exact.
