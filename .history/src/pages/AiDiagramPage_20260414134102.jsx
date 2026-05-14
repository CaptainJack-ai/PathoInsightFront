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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0c1a21] text-slate-100">
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
    </main>
  );
}

export default AiDiagramPage;
