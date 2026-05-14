import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

const FLOW_STEPS = [
  {
    key: "input",
    order: "01",
    title: "WSI 输入",
    summary: "输入全切片图像，作为后续分析的统一起点。",
    aiInput: false,
    accent: "#60a5fa",
    ids: ["hZ0qtt_d9p1K_JWHcrq6-1"],
  },
  {
    key: "feature",
    order: "02",
    title: "Patch 特征提取",
    summary: "提取局部 patch 表征，构建可检索特征空间。",
    aiInput: false,
    accent: "#38bdf8",
    ids: ["x_JH54flKNlc-T58W39L-2", "x_JH54flKNlc-T58W39L-21"],
  },
  {
    key: "classify",
    order: "03",
    title: "病种判别",
    summary: "得到类别概率与病种预测，作为诊断先验。",
    aiInput: true,
    accent: "#f59e0b",
    ids: [
      "x_JH54flKNlc-T58W39L-3",
      "x_JH54flKNlc-T58W39L-4",
      "x_JH54flKNlc-T58W39L-22",
      "x_JH54flKNlc-T58W39L-23",
    ],
  },
  {
    key: "align",
    order: "04",
    title: "病灶区域对齐",
    summary: "定位高注意力病灶区域，形成关键视觉证据。",
    aiInput: true,
    accent: "#f97316",
    ids: [
      "x_JH54flKNlc-T58W39L-8",
      "x_JH54flKNlc-T58W39L-14",
      "x_JH54flKNlc-T58W39L-17",
      "x_JH54flKNlc-T58W39L-24",
      "x_JH54flKNlc-T58W39L-25",
    ],
  },
  {
    key: "retrieval",
    order: "05",
    title: "相似度检索",
    summary: "检索同类病例片段，补充外部参考证据。",
    aiInput: true,
    accent: "#fb923c",
    ids: ["x_JH54flKNlc-T58W39L-10", "x_JH54flKNlc-T58W39L-11"],
  },
  {
    key: "evidence",
    order: "06",
    title: "证据报告匹配",
    summary: "汇总可解释证据文本与图像，组织为模型输入。",
    aiInput: true,
    accent: "#fbbf24",
    ids: ["x_JH54flKNlc-T58W39L-12", "x_JH54flKNlc-T58W39L-19"],
  },
  {
    key: "output",
    order: "07",
    title: "最终诊断生成",
    summary: "AI 结合证据链生成最终诊断结论。",
    aiInput: false,
    accent: "#4ade80",
    ids: ["x_JH54flKNlc-T58W39L-20", "oAYl1xrsKvpd-2X3e7sC-2"],
  },
];

const FlowDiagramSection = () => {
  const sectionRef = useRef(null);
  const svgContainerRef = useRef(null);
  const [svgMarkup, setSvgMarkup] = useState("");
  const preAiSteps = FLOW_STEPS.filter((step) => ["01", "02"].includes(step.order));
  const aiInputSteps = FLOW_STEPS.filter((step) => step.aiInput);
  const outputSteps = FLOW_STEPS.filter((step) => step.order === "07");

  useEffect(() => {
    let cancelled = false;

    const loadSvg = async () => {
      try {
        const response = await fetch("/img/PathoInsight.svg");
        if (!response.ok) {
          throw new Error("Failed to load flow svg");
        }
        const markup = await response.text();
        if (!cancelled) {
          setSvgMarkup(markup);
        }
      } catch {
        if (!cancelled) {
          setSvgMarkup("");
        }
      }
    };

    loadSvg();

    return () => {
      cancelled = true;
    };
  }, []);

  useGSAP(
    () => {
      if (!svgMarkup || !svgContainerRef.current) return;

      const root = svgContainerRef.current;
      const svgElement = root.querySelector("svg");
      if (!svgElement) return;

      svgElement.setAttribute("width", "100%");
      svgElement.removeAttribute("height");
      svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svgElement.style.width = "100%";
      svgElement.style.height = "auto";
      svgElement.classList.add("patho-flow-svg-inner");
      svgElement.style.background = "transparent";
      svgElement.style.backgroundColor = "transparent";

      const backgroundRect = svgElement.querySelector('rect[width="100%"][height="100%"]');
      if (backgroundRect) {
        backgroundRect.setAttribute("fill", "transparent");
        backgroundRect.style.fill = "transparent";
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 42%",
          end: "+=1450",
          scrub: 1.1,
        },
      });

      FLOW_STEPS.forEach((step) => {
        const groups = step.ids
          .map((id) => svgElement.querySelector(`g[data-cell-id="${id}"]`))
          .filter(Boolean);

        if (!groups.length) return;

        const stepShapes = groups.flatMap((group) =>
          Array.from(group.querySelectorAll("path, rect, polygon, polyline, ellipse, circle"))
        );
        const stepText = groups.flatMap((group) =>
          Array.from(group.querySelectorAll("text, tspan"))
        );

        gsap.set(stepShapes, {
          stroke: step.accent,
          strokeWidth: 1.5,
          strokeOpacity: step.aiInput ? 0.95 : 0.82,
        });

        gsap.set(stepText, {
          fill: step.aiInput ? "#fde68a" : "#dbeafe",
        });

        tl.to(
            groups,
            {
              y: -1.5,
              scale: 1.01,
              duration: 0.5,
              stagger: 0.06,
            },
            "<"
          )
          .to(
            stepShapes,
            {
              stroke: "#f8fafc",
              strokeWidth: step.aiInput ? 2.4 : 1.9,
              duration: 0.32,
            },
            "<"
          )
          .to(
            stepShapes,
            {
              stroke: step.accent,
              strokeWidth: 1.5,
              duration: 0.28,
            },
            ">-0.02"
          )
          .to(
            groups,
            {
              y: 0,
              scale: 1,
              duration: 0.45,
              stagger: 0.06,
            },
            ">-0.05"
          );
      });

      gsap.to(".flow-scanline", {
        xPercent: 180,
        duration: 3,
        ease: "none",
        repeat: -1,
      });

      gsap.to(".flow-particle", {
        y: -22,
        x: "random(-8, 8)",
        opacity: 0.9,
        duration: 1.8,
        ease: "sine.inOut",
        stagger: {
          each: 0.16,
          repeat: -1,
          yoyo: true,
        },
      });
    },
    { dependencies: [svgMarkup], scope: sectionRef }
  );

  return (
    <section id="flow-diagram" ref={sectionRef} className="relative w-full overflow-hidden bg-black py-20 text-blue-50 md:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="flow-grid-overlay absolute inset-0" />
        <div className="flow-scanline absolute left-[-45%] top-0 h-full w-1/3 bg-gradient-to-r from-blue-200/0 via-blue-200/20 to-blue-200/0" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 md:px-10">
        <p className="font-general text-xs uppercase tracking-[0.28em] text-blue-50/70">
          PathoInsight Visual Pipeline
        </p>
        <h2 className="mt-4 max-w-4xl font-zentry text-3xl uppercase leading-[0.92] text-white sm:text-4xl md:text-6xl">
          diagnosis signal is built
          <br />
          step by step
        </h2>
        <p className="mt-5 max-w-2xl font-circular-web text-sm text-blue-50/75 md:text-base">
          用同一套流程图把检索证据链可视化：从输入切片到最终结论，每一步都可解释、可追踪。
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 font-circular-web text-xs text-blue-50/80 md:text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/45 bg-sky-300/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            主流程阶段
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-amber-100">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            投给 AI 模型的关键内容
          </span>
        </div>

        <div className="relative mt-10 space-y-6 md:mt-14">
          <div className="patho-flow-svg relative w-full rounded-2xl border border-white/10 bg-slate-950/40 p-2 sm:p-3">
            {svgMarkup ? (
              <div
                ref={svgContainerRef}
                className="relative z-10 mx-auto"
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            ) : (
              <div className="relative z-10 flex h-[260px] items-center justify-center font-circular-web text-blue-50/75 sm:h-[320px] md:h-[440px]">
                流程图资源加载中...
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 sm:p-4">
            <div className="grid gap-3">
              <div className="rounded-xl border border-sky-300/35 bg-sky-400/10 p-3">
                <p className="font-general text-[11px] uppercase tracking-[0.2em] text-sky-100/80">
                  输入与预处理
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {preAiSteps.map((step) => (
                    <article key={step.key} className="rounded-lg border border-sky-200/35 bg-slate-900/45 px-3 py-2.5">
                      <div className="font-general text-[10px] uppercase tracking-[0.14em] text-blue-100/65">Step {step.order}</div>
                      <h3 className="mt-1 font-general text-sm font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 font-circular-web text-xs leading-relaxed text-blue-50/75">{step.summary}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-300/50 bg-amber-400/10 p-3">
                <p className="font-general text-[11px] uppercase tracking-[0.2em] text-amber-100/90">
                  投给 AI 模型的证据输入层
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {aiInputSteps.map((step) => (
                    <article key={step.key} className="rounded-lg border border-amber-200/45 bg-slate-900/45 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-general text-[10px] uppercase tracking-[0.14em] text-amber-100/80">Step {step.order}</span>
                        <span className="rounded-full border border-amber-200/50 bg-amber-200/15 px-2 py-0.5 font-general text-[10px] uppercase tracking-[0.12em] text-amber-100">AI Input</span>
                      </div>
                      <h3 className="mt-1 font-general text-sm font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 font-circular-web text-xs leading-relaxed text-blue-50/75">{step.summary}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 p-3">
                <p className="font-general text-[11px] uppercase tracking-[0.2em] text-emerald-100/85">
                  诊断输出
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {outputSteps.map((step) => (
                    <article key={step.key} className="rounded-lg border border-emerald-200/40 bg-slate-900/45 px-3 py-2.5 sm:col-span-2">
                      <div className="font-general text-[10px] uppercase tracking-[0.14em] text-emerald-100/75">Step {step.order}</div>
                      <h3 className="mt-1 font-general text-sm font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 font-circular-web text-xs leading-relaxed text-blue-50/75">{step.summary}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none flex justify-center gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <span
                key={`flow-particle-${index}`}
                className={`flow-particle h-1.5 w-1.5 rounded-full ${index % 3 === 0 ? "bg-amber-200/80" : "bg-sky-200/75"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlowDiagramSection;