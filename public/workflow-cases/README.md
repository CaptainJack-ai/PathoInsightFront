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

- `uploaded.jpg`
- `classifying.jpg`
- `patching.jpg`
- `retrieving_similar.jpg`
- `generating_report.jpg`
- `high-attention/patch-1.jpg` ~ `high-attention/patch-12.jpg`
- `similar-wsi/similar-1.jpg` ~ `similar-wsi/similar-12.jpg`
- `similar-diagnosis/similar-diagnosis.json`
- `report/diagnosis-report.pdf`
- `flow_data.json`
- `source_meta.json`

Flow rendering notes:

- Step 4 retrieval uses `flow_data.json -> flow_links` as the source of truth.
- Paths in `flow_data.json` are normalized at runtime to `/workflow-cases/<case-id>/...`.

Example:

- `public/workflow-cases/luad/uploaded.jpg`
- `public/workflow-cases/luad/high-attention/patch-1.jpg`
- `public/workflow-cases/luad/similar-wsi/similar-1.jpg`
- `public/workflow-cases/luad/similar-diagnosis/similar-diagnosis.json`
- `public/workflow-cases/luad/report/diagnosis-report.pdf`
- `public/workflow-cases/luad/flow_data.json`

Tips:

- Recommended ratio: 16:9 or wider.
- Recommended width: >= 1600px for crisp desktop rendering.
- Keep case ids lowercase and exact.
