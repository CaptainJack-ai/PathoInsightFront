import { useMemo } from "react";
import ReactFlow, { MarkerType, MiniMap, Position } from "reactflow";
import "reactflow/dist/style.css";

const nodeStyle = {
  borderRadius: 18,
  border: "1px solid rgba(148, 163, 184, 0.45)",
  background: "linear-gradient(150deg, rgba(15, 23, 42, 0.72), rgba(30, 41, 59, 0.46))",
  color: "#e2e8f0",
  boxShadow: "0 14px 36px rgba(15, 23, 42, 0.35)",
  backdropFilter: "blur(3px)",
  fontSize: 14,
  lineHeight: 1.4,
  padding: "10px 14px",
  width: 220,
  whiteSpace: "pre-line",
};

const outputStyle = {
  ...nodeStyle,
  border: "1px solid rgba(52, 211, 153, 0.65)",
  background: "linear-gradient(155deg, rgba(6, 78, 59, 0.7), rgba(15, 118, 110, 0.42))",
  width: 200,
};

const decisionStyle = {
  ...nodeStyle,
  border: "1px solid rgba(250, 204, 21, 0.7)",
  background: "linear-gradient(155deg, rgba(113, 63, 18, 0.72), rgba(161, 98, 7, 0.44))",
  width: 290,
};

const infoStyle = {
  ...nodeStyle,
  border: "1px solid rgba(125, 211, 252, 0.7)",
  background: "linear-gradient(155deg, rgba(8, 47, 73, 0.72), rgba(14, 116, 144, 0.44))",
  width: 290,
};

const webCoreStyle = {
  ...nodeStyle,
  border: "1px solid rgba(34, 197, 94, 0.65)",
  background: "linear-gradient(150deg, rgba(6, 78, 59, 0.7), rgba(4, 120, 87, 0.42))",
  width: 260,
};

const webRouteStyle = {
  ...nodeStyle,
  border: "1px solid rgba(56, 189, 248, 0.7)",
  background: "linear-gradient(150deg, rgba(8, 47, 73, 0.7), rgba(14, 116, 144, 0.42))",
  width: 240,
};

const webPageStyle = {
  ...nodeStyle,
  border: "1px solid rgba(129, 140, 248, 0.68)",
  background: "linear-gradient(150deg, rgba(49, 46, 129, 0.68), rgba(67, 56, 202, 0.42))",
  width: 230,
};

const webModuleStyle = {
  ...nodeStyle,
  border: "1px solid rgba(250, 204, 21, 0.72)",
  background: "linear-gradient(150deg, rgba(113, 63, 18, 0.72), rgba(180, 83, 9, 0.44))",
  width: 250,
};

function AiDiagramPage() {
  const nodes = useMemo(
    () => [
      { id: "reportsJson", data: { label: "参考病例库\nreports_json" }, position: { x: 90, y: 110 }, sourcePosition: Position.Right, style: infoStyle },
      { id: "in", data: { label: "输入切片\nWSI" }, position: { x: 90, y: 330 }, sourcePosition: Position.Right, style: nodeStyle },
      { id: "orchestrator", data: { label: "流程编排器\n任务切分 + 并行调度" }, position: { x: 390, y: 300 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: nodeStyle },
      { id: "seg", data: { label: "组织分割\nPatch 坐标生成" }, position: { x: 700, y: 240 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: nodeStyle },
      { id: "feat", data: { label: "UNI 特征提取" }, position: { x: 980, y: 240 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: nodeStyle },
      { id: "clam", data: { label: "CLAM 分类 + 注意力" }, position: { x: 1260, y: 240 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: nodeStyle },
      { id: "patch", data: { label: "高注意力 Patch 检索" }, position: { x: 1540, y: 240 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: nodeStyle },

      { id: "classInfo", data: { label: "预测类别\n癌种概率 / Top 类别" }, position: { x: 1880, y: 140 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: infoStyle },
      { id: "simReport", data: { label: "相似报告证据\nTop-K 病例文本" }, position: { x: 1880, y: 330 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: infoStyle },
      { id: "patchInfo", data: { label: "Patch 图像证据\n关键视野 / attention 热点" }, position: { x: 1880, y: 520 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: infoStyle },
      { id: "decision", data: { label: "启用 GLM 多模态分析?" }, position: { x: 1880, y: 710 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: decisionStyle },
      { id: "glm", data: { label: "GLM-4V 图像理解\n提取形态学要点" }, position: { x: 2220, y: 710 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: nodeStyle },
      { id: "morphDesc", data: { label: "形态学描述\n(来自 GLM 或文本补充)" }, position: { x: 2560, y: 710 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: infoStyle },

      { id: "qualityGate", data: { label: "证据质量门控\nmin_quality_score / top_k / exclude_query_slide" }, position: { x: 2560, y: 430 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: decisionStyle },

      { id: "packUnified", data: { label: "统一 LLM 输入包\n- 类别\n- 相似报告\n- Patch 证据\n- 形态学描述\n- 模板约束" }, position: { x: 2940, y: 320 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: { ...infoStyle, width: 330 } },
      { id: "reportGen", data: { label: "报告生成" }, position: { x: 3340, y: 320 }, sourcePosition: Position.Bottom, targetPosition: Position.Left, style: nodeStyle },
      { id: "critic", data: { label: "Critic 评估\n不达阈值则 refine" }, position: { x: 3340, y: 620 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: decisionStyle },
      { id: "outA", data: { label: "病理报告 PDF" }, position: { x: 3720, y: 280 }, targetPosition: Position.Left, style: outputStyle },
      { id: "outB", data: { label: "诊断报告 PDF" }, position: { x: 3720, y: 500 }, targetPosition: Position.Left, style: outputStyle },
    ],
    []
  );

  const edges = useMemo(
    () => [
      { id: "e-in-orch", source: "in", target: "orchestrator", animated: true, thread: "core" },
      { id: "e-reports-orch", source: "reportsJson", target: "orchestrator", thread: "core" },
      { id: "e-orch-seg", source: "orchestrator", target: "seg", animated: true, thread: "core" },
      { id: "e-seg-feat", source: "seg", target: "feat", thread: "core" },
      { id: "e-feat-clam", source: "feat", target: "clam", thread: "core" },
      { id: "e-clam-patch", source: "clam", target: "patch", thread: "core" },

      { id: "e-clam-class", source: "clam", target: "classInfo", label: "预测类别", thread: "core" },
      { id: "e-patch-sim", source: "patch", target: "simReport", label: "相似报告召回", thread: "core" },
      { id: "e-patch-evi", source: "patch", target: "patchInfo", label: "Patch 图像证据", thread: "core" },
      { id: "e-patch-dec", source: "patch", target: "decision", label: "并行分支", thread: "vision" },
      { id: "e-dec-glm", source: "decision", target: "glm", label: "开启", thread: "vision" },
      { id: "e-glm-morph", source: "glm", target: "morphDesc", label: "生成形态学描述", thread: "vision" },
      { id: "e-sim-morph", source: "simReport", target: "morphDesc", label: "文本补充", thread: "core" },

      { id: "e-class-gate", source: "classInfo", target: "qualityGate", label: "候选证据", thread: "core" },
      { id: "e-sim-gate", source: "simReport", target: "qualityGate", label: "候选证据", thread: "core" },
      { id: "e-patch-gate", source: "patchInfo", target: "qualityGate", label: "候选证据", thread: "core" },
      { id: "e-morph-gate", source: "morphDesc", target: "qualityGate", label: "候选证据", thread: "vision" },

      { id: "e-gate-pack", source: "qualityGate", target: "packUnified", label: "统一证据输入", thread: "main" },
      { id: "e-pack-gen", source: "packUnified", target: "reportGen", animated: true, label: "生成", thread: "main" },
      { id: "e-gen-critic", source: "reportGen", target: "critic", label: "质量打分", thread: "main" },
      { id: "e-critic-gen", source: "critic", target: "reportGen", label: "未达阈值: refine", thread: "main", dashed: true },
      { id: "e-critic-out-a", source: "critic", target: "outA", animated: true, label: "达阈值输出", thread: "main" },
      { id: "e-critic-out-b", source: "critic", target: "outB", animated: true, label: "达阈值输出", thread: "alt" },
    ].map((edge) => ({
      ...edge,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color:
          edge.thread === "vision"
            ? "#fbbf24"
            : edge.thread === "main"
              ? "#34d399"
              : edge.thread === "alt"
                ? "#38bdf8"
                  : "#93c5fd",
      },
      style: {
        stroke:
          edge.thread === "vision"
            ? "#fbbf24"
            : edge.thread === "main"
              ? "#34d399"
              : edge.thread === "alt"
                ? "#38bdf8"
                  : "#93c5fd",
        strokeWidth: edge.dashed ? 1.4 : 1.8,
        strokeOpacity: edge.dashed ? 0.72 : 0.92,
        strokeDasharray: edge.dashed ? "6 4" : "none",
      },
      labelStyle: { fill: "#e2e8f0", fontSize: 12 },
      labelBgStyle: { fill: "rgba(15, 23, 42, 0.7)", fillOpacity: 1 },
      labelBgBorderRadius: 8,
      labelBgPadding: [6, 4],
    })),
    []
  );

  const webNodes = useMemo(
    () => [
      {
        id: "web-main",
        data: { label: "入口层\nmain.jsx / App.jsx" },
        position: { x: 70, y: 210 },
        sourcePosition: Position.Right,
        style: webCoreStyle,
      },
      {
        id: "web-routes",
        data: { label: "路由中心\nroutes/AppRoutes.jsx" },
        position: { x: 400, y: 210 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: webRouteStyle,
      },
      {
        id: "web-paths",
        data: { label: "路由常量\nroutes/paths.js" },
        position: { x: 400, y: 40 },
        targetPosition: Position.Bottom,
        style: webRouteStyle,
      },
      {
        id: "web-home",
        data: { label: "页面\nHomePage" },
        position: { x: 760, y: 30 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: webPageStyle,
      },
      {
        id: "web-workflow",
        data: { label: "页面\nWorkflowPage" },
        position: { x: 760, y: 160 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: webPageStyle,
      },
      {
        id: "web-slice",
        data: { label: "页面\nSliceProcessingPage" },
        position: { x: 760, y: 290 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: webPageStyle,
      },
      {
        id: "web-ai",
        data: { label: "页面\nAiDiagramPage" },
        position: { x: 760, y: 420 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: webPageStyle,
      },
      {
        id: "web-home-components",
        data: { label: "首页模块\nHero / About / Features\nFlowDiagramSection / Story / Contact / Footer" },
        position: { x: 1090, y: 30 },
        targetPosition: Position.Left,
        style: webModuleStyle,
      },
      {
        id: "web-workflow-data",
        data: { label: "流程数据\ndata/workflowCases.js\n+ 工作流可视化组件" },
        position: { x: 1090, y: 170 },
        targetPosition: Position.Left,
        style: webModuleStyle,
      },
      {
        id: "web-slice-api",
        data: { label: "后端交互\napi/wsiReportApi.js\n上传任务 / 轮询 / 报告与产物" },
        position: { x: 1090, y: 320 },
        targetPosition: Position.Left,
        style: webModuleStyle,
      },
      {
        id: "web-public-assets",
        data: { label: "静态资源层\npublic/workflow-cases\npublic/img / examples / wsi-samples" },
        position: { x: 1090, y: 470 },
        targetPosition: Position.Left,
        style: webModuleStyle,
      },
    ],
    []
  );

  const webEdges = useMemo(
    () =>
      [
        { id: "wr-main-routes", source: "web-main", target: "web-routes", label: "挂载路由", kind: "core" },
        { id: "wr-paths-routes", source: "web-paths", target: "web-routes", label: "路径配置", kind: "route" },

        { id: "wr-routes-home", source: "web-routes", target: "web-home", label: "/", kind: "route" },
        { id: "wr-routes-workflow", source: "web-routes", target: "web-workflow", label: "/workflow", kind: "route" },
        { id: "wr-routes-workflow-case", source: "web-routes", target: "web-workflow", label: "/workflow/:caseId", kind: "route" },
        { id: "wr-routes-slice", source: "web-routes", target: "web-slice", label: "/slice-processing", kind: "route" },
        { id: "wr-routes-ai", source: "web-routes", target: "web-ai", label: "/ai-diagram", kind: "route" },

        { id: "wr-home-mod", source: "web-home", target: "web-home-components", label: "页面组合", kind: "module" },
        { id: "wr-workflow-data", source: "web-workflow", target: "web-workflow-data", label: "读取案例", kind: "module" },
        { id: "wr-slice-api", source: "web-slice", target: "web-slice-api", label: "API 调用", kind: "module" },
        { id: "wr-ai-assets", source: "web-ai", target: "web-public-assets", label: "展示资源", kind: "module" },
        { id: "wr-workflow-assets", source: "web-workflow", target: "web-public-assets", label: "读取流程素材", kind: "module" },
      ].map((edge) => {
        const edgeColor =
          edge.kind === "core"
            ? "#34d399"
            : edge.kind === "route"
              ? "#38bdf8"
              : "#facc15";

        return {
          ...edge,
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: edgeColor,
          },
          style: {
            stroke: edgeColor,
            strokeWidth: 1.8,
            strokeOpacity: 0.92,
          },
          labelStyle: { fill: "#e2e8f0", fontSize: 11 },
          labelBgStyle: { fill: "rgba(15, 23, 42, 0.72)", fillOpacity: 1 },
          labelBgBorderRadius: 8,
          labelBgPadding: [6, 4],
        };
      }),
    []
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0c1a21] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(20,184,166,0.3),transparent_38%),radial-gradient(circle_at_88%_20%,rgba(56,189,248,0.24),transparent_44%),radial-gradient(circle_at_50%_88%,rgba(251,191,36,0.2),transparent_38%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-[2300px] items-center px-2 pb-4 pt-20 md:px-4 md:pb-6 md:pt-24">
        <div className="patho-flow-shell relative h-[96vh] w-full overflow-hidden rounded-[28px] border border-white/15">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.08 }}
            panOnDrag
            zoomOnScroll
            minZoom={0.18}
            maxZoom={1.5}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap
              pannable
              zoomable
              className="!bg-slate-900/65 !border !border-white/20"
              nodeColor={(node) => (node.id.startsWith("out") ? "#34d399" : "#93c5fd")}
              maskColor="rgba(2, 6, 23, 0.5)"
            />
          </ReactFlow>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-[2300px] px-2 pb-14 md:px-4">
        <div className="mb-4 px-2 md:px-1">
          <p className="font-general text-xs uppercase tracking-[0.24em] text-cyan-200/80">Web Architecture</p>
          <h2 className="mt-2 text-2xl font-zentry text-slate-100 md:text-4xl">前端页面关系图</h2>
          <p className="mt-3 max-w-4xl font-circular-web text-sm text-slate-200/75 md:text-base">
            该图用于展示前端入口、路由、页面以及组件/API/数据资源之间的关系，帮助在评审或文档中快速定位结构边界。
          </p>
        </div>

        <div className="relative h-[560px] w-full overflow-hidden rounded-[28px] border border-white/15 bg-[#08141a]/80">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(56,189,248,0.2),transparent_40%),radial-gradient(circle_at_82%_88%,rgba(250,204,21,0.14),transparent_42%)]" />
          <div className="relative h-full w-full">
            <ReactFlow
              nodes={webNodes}
              edges={webEdges}
              fitView
              fitViewOptions={{ padding: 0.16 }}
              panOnDrag
              zoomOnScroll
              minZoom={0.45}
              maxZoom={1.7}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AiDiagramPage;
