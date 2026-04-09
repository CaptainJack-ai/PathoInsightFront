# PathoInsight Frontend

PathoInsight 的前端界面，基于 React + Vite + Tailwind，负责：

- 上传 WSI 切片并触发后端任务
- 展示异步任务进度与增量日志
- 展示高注意力 patch、相似病例 patch 和诊断结果
- 下载后端生成的 PDF 报告

## 技术栈

- React 18
- Vite 5
- Tailwind CSS
- GSAP

## 本地开发

### 1. 环境要求

- Node.js 18+
- npm 9+

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务

```bash
npm run dev
```

默认地址：

```text
http://127.0.0.1:5173
```

## 后端联调说明

Vite 已配置代理：

- 前端请求 `/api/*`
- 自动转发到 `http://127.0.0.1:8000/*`

后端接口详细说明见：

- `FRONTEND_BACKEND_API_GUIDE.md`

## 构建与预览

```bash
npm run build
npm run preview
```

## 代码质量

```bash
npm run lint
```

## 目录说明

- `src/`: 页面、组件、状态与接口调用
- `public/`: 静态资源
- `docs/`: 前端相关文档

## 上传到 GitHub（前端仓库）

在本目录执行：

```bash
git init
git add .
git commit -m "chore: init frontend project"
git branch -M main
git remote add origin <你的前端仓库地址>
git push -u origin main
```

如果你已经执行过 `git init` 或已经配置过远程，只需要：

```bash
git add .
git commit -m "docs: update frontend readme and gitignore"
git push
```
