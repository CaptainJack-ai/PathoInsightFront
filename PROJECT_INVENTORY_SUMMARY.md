# PathoInsight 项目 - 完整源代码清单总结

**生成时间**: 2026年4月17日  
**项目**: PathoInsight - 病理影像智能诊断系统

---

## 📊 项目结构概览

```
PathoInsight/
├── PathoInsightFront/              # 前端项目（React + Vite）
└── PathoInsightBack/               # 后端项目（FastAPI + Python/AI）
```

---

## 🎯 快速导航

### 前端项目文档
📄 **详细清单**: [PathoInsightFront/SOURCE_INVENTORY.md](./PathoInsightFront/SOURCE_INVENTORY.md)

**核心信息**:
- **框架**: React 18 + Vite + Tailwind CSS
- **源文件**: ~20 个 React 组件 + 5 个配置文件
- **路由**: 4 个主页面（首页、切片处理、工作流、AI流程图）
- **资源**: 视频、字体、WSI 样本、工作流案例
- **特性**: 响应式设计、流程图可视化、系统架构预览

**关键路径**:
```
src/
├── pages/          # 4 个页面组件
├── components/     # 10+ UI 组件
├── api/            # API 调用层
├── routes/         # 路由定义
└── data/           # 本地数据配置
```

### 后端项目文档
📄 **详细清单**: [PathoInsightBack/SOURCE_INVENTORY.md](./PathoInsightBack/SOURCE_INVENTORY.md)

**核心信息**:
- **框架**: FastAPI + Python
- **源文件**: ~40+ Python 脚本
- **关键模块**: CLAM 框架、WSI 处理、RAG 流程、特征提取
- **ML 工作流**: WSI 处理 → 特征提取 → 分类 → 报告生成
- **部署**: Docker + GPU 支持

**关键路径**:
```
PathoInsightBack/
├── CLAM/           # 注意力机制框架
├── scripts/        # 流程管道脚本
├── app/            # FastAPI 应用
├── config/         # 环境配置
└── data/           # 数据和模型存储
```

---

## 📁 完整文件清单统计

### 前端项目 (PathoInsightFront)
| 类型 | 数量 | 位置 |
|------|------|------|
| React 组件 | 13 | `src/pages/`, `src/components/` |
| 页面 | 4 | `src/pages/` |
| 路由配置 | 2 | `src/routes/` |
| API 模块 | 1 | `src/api/` |
| 数据文件 | 2 | `src/data/` |
| 配置文件 | 5 | 根目录 |
| 样式文件 | 1 | `src/index.css` |
| 字体资源 | 7 | `public/fonts/` |
| SVG/图像 | 15+ | `public/img/` |
| 视频资源 | 10+ | `public/videos/` |
| WSI 样本 | 9+ | `public/wsi-samples/` |
| 工作流案例 | 10+ | `public/workflow-cases/` |
| 示例案例 | 10+ | `public/examples/` |

**总计**: ~1000+ 文件（包含资源和历史记录）

### 后端项目 (PathoInsightBack)
| 类型 | 数量 | 位置 |
|------|------|------|
| Python 脚本 | 40+ | 根目录、`CLAM/`、`scripts/` |
| CLAM 模型模块 | 6 | `CLAM/models/` |
| 工具库 | 15+ | `CLAM/utils/`、`CLAM/vis_utils/` |
| WSI 处理核心 | 5 | `CLAM/wsi_core/` |
| 数据集模块 | 4 | `CLAM/dataset_modules/` |
| 脚本管道 | 6 | `scripts/` |
| 配置文件 | 10 | `config/`、`deploy/` |
| 文档 | 10 | `docs/` |
| 评估结果 | 多个 | `CLAM/eval_results/` |
| 数据划分 | 20+ | `CLAM/splits/` |

**总计**: ~279 个源代码相关文件

---

## 🚀 核心功能模块

### 前端模块
```
1. 导航系统 (Navbar)
   - 全局导航栏
   - 音频播放控制
   - 响应式菜单
   - 滚动隐藏效果

2. 首页 (HomePage)
   - Hero 区域
   - Features 展示
   - Story 讲述
   - About 介绍
   - Contact 表单
   - Footer

3. 切片处理 (SliceProcessingPage)
   - 上传处理
   - 进度跟踪
   - 结果展示
   - 报告下载

4. 工作流演示 (WorkflowPage)
   - 流程可视化
   - 案例展示
   - 动画效果

5. AI 流程图 (AiDiagramPage)
   - ReactFlow 流程图
   - 系统架构预览（浅色弹层）
   - 多线程流程展示
```

### 后端模块
```
1. FastAPI 服务 (backend_fastapi.py)
   - RESTful API
   - WSI 处理端点
   - 报告生成端点
   - 结果检索端点

2. CLAM 框架 (CLAM/)
   - WSI 处理和 Patch 创建
   - 特征提取（UNI）
   - 分类和注意力聚合
   - 热力图生成

3. WSI 处理核心 (CLAM/wsi_core/)
   - OpenSlide 集成
   - Patch 坐标生成
   - 批处理工具

4. RAG 增强流程 (scripts/)
   - 向量化和检索
   - 上下文拼接
   - LLM 生成

5. 配置管理 (config/, app/)
   - 环境变量
   - 应用设置
   - 部署配置

6. 数据管理 (data/)
   - 模型存储
   - 运行时输出
   - 参考数据
```

---

## 🔧 技术栈

### 前端技术栈
```
Runtime: Node.js 18+
Framework: React 18
Build Tool: Vite 5
Styling: Tailwind CSS 3
UI Components: ReactFlow, Custom Components
Animation: GSAP
HTTP: Axios
Routing: React Router v6
Package Manager: npm
```

### 后端技术栈
```
Runtime: Python 3.8+
Framework: FastAPI
Server: Uvicorn
Deep Learning: PyTorch + CUDA
Vision Models: Timm, UNI Foundation Model
Image Processing: OpenSlide, Pillow
Data Processing: NumPy, Pandas
ML: Scikit-learn
H5 Files: h5py
API Client: Dashscope (for GLM)
Database: (可选) SQLAlchemy
Containerization: Docker + GPU
```

---

## 📋 主要文件速查表

### 配置文件
| 文件 | 位置 | 用途 |
|------|------|------|
| `vite.config.js` | 前端根 | Vite 构建配置 |
| `tailwind.config.js` | 前端根 | Tailwind 样式配置 |
| `eslint.config.js` | 前端根 | 代码检查配置 |
| `backend_fastapi.py` | 后端根 | FastAPI 主应用 |
| `requirements.txt` | 后端根 | Python 依赖 |
| `env_win.yml`, `env_mac.yml` | 后端根 | Conda 环境配置 |

### 关键源文件
| 文件 | 位置 | 功能 |
|------|------|------|
| `App.jsx` | 前端 src/ | 根组件 |
| `AiDiagramPage.jsx` | 前端 src/pages/ | AI 流程图（含架构预览）|
| `Navbar.jsx` | 前端 src/components/ | 全局导航 |
| `backend_fastapi.py` | 后端根 | API 服务 |
| `main.py`, `main_custom.py` | 后端 CLAM/ | CLAM 训练 |
| `WholeSlideImage.py` | 后端 CLAM/wsi_core/ | WSI 处理核心 |

### 文档
| 文件 | 位置 | 内容 |
|------|------|------|
| `SOURCE_INVENTORY.md` | 前端根 | 前端清单 |
| `SOURCE_INVENTORY.md` | 后端根 | 后端清单 |
| `FRONTEND_BACKEND_API_GUIDE.md` | 前端根 | API 指南 |
| `frontend-backend-api-guide.md` | 后端 docs/ | API 详细说明 |
| `system-install-and-usage.md` | 后端 docs/ | 系统安装指南 |
| `design-thinking.md` | 后端 docs/ | 设计思路 |

---

## 🔄 数据流

### 用户端到端流程
```
用户上传 WSI 
  ↓
前端 (SliceProcessingPage)
  ↓ HTTP POST
后端 FastAPI
  ↓
CLAM 处理管道
  ├─ WSI 分割 + Patch 创建
  ├─ UNI 特征提取
  ├─ CLAM 分类 + 注意力
  └─ 高注意力 Patch 检索
  ↓
RAG 增强
  ├─ 相似病例检索
  ├─ GLM 图像理解
  └─ 证据质量门控
  ↓
LLM 报告生成
  ├─ 病理报告
  └─ 诊断报告
  ↓
前端展示
  ├─ 预测结果
  ├─ Patch 热力图
  ├─ 相似报告
  └─ PDF 下载
```

---

## 📊 部署架构

### 开发环境
```
localhost:5173 (Vite Dev Server)
    ↓
localhost:8000 (FastAPI)
    ↓
GPU (CUDA 处理)
```

### 生产环境
```
Docker 容器 (nginx + frontend)
    ↓
Docker 容器 (FastAPI + CLAM)
    ↓
GPU 资源 (NVIDIA CUDA)
    ↓
数据存储 (models/, data/)
```

---

## 🎓 文档导航

### 对于前端开发者
1. 查看 `PathoInsightFront/SOURCE_INVENTORY.md` 了解项目结构
2. 查看 `src/routes/AppRoutes.jsx` 了解页面路由
3. 查看 `src/pages/` 目录了解各页面实现
4. 查看 `src/components/` 了解可复用组件
5. 查看 `FRONTEND_BACKEND_API_GUIDE.md` 了解 API 调用

### 对于后端开发者
1. 查看 `PathoInsightBack/SOURCE_INVENTORY.md` 了解项目结构
2. 查看 `backend_fastapi.py` 了解 API 端点
3. 查看 `CLAM/` 目录了解 ML 框架
4. 查看 `scripts/` 了解数据流程
5. 查看 `docs/backend-structure.md` 了解架构设计
6. 查看 `config/patho.env.example` 了解环境配置

### 对于系统管理员
1. 查看 `docs/system-install-and-usage.md` 了解安装步骤
2. 查看 `docs/windows-startup-guide.md` 或 `docs/mac-startup-guide.md`
3. 查看 `deploy/` 了解 Docker 部署
4. 查看 `requirements.txt` 和 `env_*.yml` 了解依赖

---

## ✅ 文件清单生成说明

本清单包含：
- ✅ 所有源代码文件 (.jsx, .js, .py)
- ✅ 配置和环境文件
- ✅ 文档和指南
- ✅ 资源和数据文件结构
- ✅ 项目模块说明

排除内容：
- ❌ `.history/` 历史记录文件夹
- ❌ `node_modules/` npm 包
- ❌ `__pycache__/` Python 缓存
- ❌ `.git/` 版本控制信息
- ❌ 二进制模型文件（仅列出位置）

---

## 📞 快速参考

### 前端运行
```bash
cd PathoInsightFront
npm install
npm run dev          # 开发模式，访问 http://localhost:5173
npm run build        # 生产构建
npm run preview      # 预览构建结果
```

### 后端运行
```bash
cd PathoInsightBack
conda activate hypir
pip install -r requirements.txt
uvicorn backend_fastapi:app --reload --port 8000
# 访问 http://localhost:8000/docs (API 文档)
```

### WSI 处理流程
```bash
python run_wsi_rag_pipeline.py
python run_full_rag_generation.py
```

---

**最后更新**: 2026年4月17日  
**生成工具**: GitHub Copilot  
**项目状态**: 活跃开发中

---

### 🔗 相关文档链接
- [前端详细清单](./PathoInsightFront/SOURCE_INVENTORY.md)
- [后端详细清单](./PathoInsightBack/SOURCE_INVENTORY.md)
- [API 指南](./PathoInsightFront/FRONTEND_BACKEND_API_GUIDE.md)
- [系统安装指南](./PathoInsightBack/docs/system-install-and-usage.md)

