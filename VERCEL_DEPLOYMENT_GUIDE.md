# PathoInsightFront — Vercel 部署指南

## 概述

PathoInsightFront 是一个 Vite + React 的静态站点，可直接部署到 Vercel 的免费 Hobby 层。首发版本包含三个完全独立运行的页面：首页、流程图页、工作流页。

---

## 免费部署的核心信息

| 项目 | 说明 |
|------|------|
| **Vercel 费用** | Hobby 层永久免费，包含全球 CDN、构建、部署 |
| **带宽配额** | 100 GB/月（足够前端站点） |
| **构建时间** | 45 min/月（远超前端需求） |
| **页面加载** | 极速，边缘节点分发 |
| **后端服务** | 不包含；如需后端（切片处理），需单独部署 |

---

## 部署前检查清单

- [ ] 将 PathoInsightFront 仓库推送到 GitHub
- [ ] 确保仓库根目录包含 `vercel.json`（SPA 路由配置）
- [ ] 确保 `package.json` 中的 `build` 脚本为 `vite build`
- [ ] 本地运行过 `npm run build` 且产物在 `dist/` 无误

---

## 一步一步部署

### 第 1 步：在 Vercel 上创建项目

1. 访问 [vercel.com](https://vercel.com)，用 GitHub 账号登录或注册
2. 点击 **Add New** → **Project**
3. 选择 GitHub 账户下包含 PathoInsightFront 的仓库
4. Vercel 会自动识别 Vite 项目

### 第 2 步：配置构建设置（通常自动正确）

Vercel 会自动读取 `vercel.json` 并应用以下配置：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

**无需手动干预**，直接点击 **Deploy** 即可。

### 第 3 步：等待部署完成

Vercel 会：
- ✅ 安装依赖
- ✅ 运行 `npm run build`
- ✅ 将 `dist/` 上传到全球 CDN
- ✅ 分配一个 `.vercel.app` 域名（如 `pathoinsight-front.vercel.app`）

部署通常需要 2~5 分钟。

### 第 4 步：验证部署成功

部署完成后，访问以下链接验证：

- `https://your-project.vercel.app/` — 首页
- `https://your-project.vercel.app/ai-diagram` — 流程图页
- `https://your-project.vercel.app/workflow` — 工作流页（包括子路由如 `/workflow/cancer-type1`）

**预期结果**：所有页面刷新后都能正常加载，无 404 错误。

---

## 部署后的页面状态

| 页面 | 状态 | 说明 |
|------|------|------|
| **首页** (`/`) | ✅ 可用 | 完全静态，无依赖 |
| **流程图页** (`/ai-diagram`) | ✅ 可用 | 静态 ReactFlow 图，无依赖 |
| **工作流页** (`/workflow`, `/workflow/:caseId`) | ✅ 可用 | 使用本地 `/public/workflow-cases/` JSON 数据 |
| **切片处理页** | 🔒 隐藏 | 暂未公开；需后端独立部署后才可恢复 |

---

## 自定义域名（可选）

如果希望用自己的域名而不是 `*.vercel.app`：

1. 在 Vercel 项目 → **Settings** → **Domains**
2. 点击 **Add** 并输入域名（如 `patho.example.com`）
3. 按照指示修改 DNS 记录
4. Vercel 会自动配置 SSL 证书

---

## 后期维护

### 推送更新

每当你推送代码到 GitHub 的主分支时，Vercel 会自动触发新构建和部署。

### 预览分支

为 PR 或其他分支创建临时预览链接，测试后再合并到主分支。

### 环境变量（如需后端恢复）

后续若要恢复切片处理页并连接后端，可在 Vercel 后台设置：

**Settings** → **Environment Variables** → 添加：
```
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

前端构建时会自动读取此变量。

---

## 常见问题

### Q: 如何删除或重新部署？
**A:** 在 Vercel 项目 **Settings** → **Danger Zone** 可删除项目；重新部署只需推送代码即可。

### Q: 部署失败如何排查？
**A:** 检查 Vercel 的 **Deployments** 标签页的构建日志，通常问题包括：
- 依赖版本冲突：删除 `node_modules` 和 `package-lock.json`，重新安装
- 环境变量缺失：检查 **Environment Variables** 设置
- 构建脚本错误：本地运行 `npm run build` 重现问题

### Q: 如何自定义域名？
**A:** 见上文"自定义域名"部分。

### Q: Vercel 支持 HTTPS 吗？
**A:** 是的，所有 Vercel 部署都自动支持 HTTPS 和 SSL 证书。

### Q: 工作流页的图片加载失败怎么办？
**A:** 确保 `/public/workflow-cases/` 下的所有文件都已提交到 Git（不被 `.gitignore` 忽略），Vercel 部署时会一并上传。

---

## 回收切片处理页（未来）

当后端部署完成后，如需恢复切片处理功能：

1. 在 Navbar.jsx 中恢复切片处理菜单项
2. 在 Vercel 后台设置 `VITE_API_BASE_URL` 环境变量，指向后端 API
3. 推送更新，Vercel 自动重新部署
4. 前端会自动连接后端并启用切片上传、处理、报告下载等功能

---

## 总结

✅ **现在可以做**：推送到 GitHub，在 Vercel 上部署，获得一个免费的全球 CDN 托管站点  
⏳ **稍后可以做**：后端部署完毕后，恢复切片处理功能  
📈 **流量超出免费额度？**：升级到 Pro（$20/月）或 Enterprise，不会突然断服
