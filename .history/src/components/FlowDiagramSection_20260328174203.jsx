import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

const FLOW_STEPS = [
  {
    title: "WSI 输入",
    ids: ["hZ0qtt_d9p1K_JWHcrq6-1"],
  },
  {
    title: "Patch 特征提取",
    ids: ["x_JH54flKNlc-T58W39L-2", "x_JH54flKNlc-T58W39L-21"],
  },
  {
    title: "病种判别",
    ids: [
      "x_JH54flKNlc-T58W39L-3",
      "x_JH54flKNlc-T58W39L-4",
      "x_JH54flKNlc-T58W39L-22",
      "x_JH54flKNlc-T58W39L-23",
    ],
  },
  {
    title: "病灶区域对齐",
    ids: [
      "x_JH54flKNlc-T58W39L-8",
      "x_JH54flKNlc-T58W39L-14",
      "x_JH54flKNlc-T58W39L-17",
      "x_JH54flKNlc-T58W39L-24",
      "x_JH54flKNlc-T58W39L-25",
    ],
  },
  {
    title: "相似度检索",
    ids: ["x_JH54flKNlc-T58W39L-10", "x_JH54flKNlc-T58W39L-11"],
  },
  {
    title: "证据报告匹配",
    ids: ["x_JH54flKNlc-T58W39L-12", "x_JH54flKNlc-T58W39L-19"],
  },
  {
    title: "最终诊断生成",
    ids: ["x_JH54flKNlc-T58W39L-20", "oAYl1xrsKvpd-2X3e7sC-2"],
  },
];

const FlowDiagramSection = () => {
  const sectionRef = useRef(null);
  const svgContainerRef = useRef(null);
  const [svgMarkup, setSvgMarkup] = useState("");

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
      } catch (error) {
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
      svgElement.setAttribute("height", "100%");
      svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svgElement.classList.add("patho-flow-svg-inner");
      svgElement.style.background = "transparent";
      svgElement.style.backgroundColor = "transparent";

      const backgroundRect = svgElement.querySelector('rect[width="100%"][height="100%"]');
      if (backgroundRect) {
        backgroundRect.setAttribute("fill", "transparent");
        backgroundRect.style.fill = "transparent";
      }

      const rootGroups = Array.from(svgElement.querySelectorAll("g[data-cell-id]"));
      const targetGroups = rootGroups.filter((group) => {
        const id = group.getAttribute("data-cell-id");
        return id && id !== "0" && id !== "1";
      });

      gsap.set(targetGroups, {
        autoAlpha: 0,
        y: 10,
        scale: 0.985,
        transformOrigin: "center center",
      });

      const edgePaths = Array.from(svgElement.querySelectorAll("g[data-cell-id] path"));
      edgePaths.forEach((path) => {
        const pathLength = path.getTotalLength?.() || 0;
        if (!pathLength) return;
        path.style.strokeDasharray = `${pathLength}`;
        path.style.strokeDashoffset = `${pathLength}`;
      });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 42%",
          end: "+=1450",
          scrub: 1.1,
        },
      });

      FLOW_STEPS.forEach((step, index) => {
        const groups = step.ids
          .map((id) => svgElement.querySelector(`g[data-cell-id=\"${id}\"]`))
          .filter(Boolean);

        if (!groups.length) return;

        const stepPaths = groups.flatMap((group) =>
          Array.from(group.querySelectorAll("path"))
        );

        tl.to(
            groups,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.95,
              stagger: 0.12,
            },
            "<"
          )
          .to(
            stepPaths,
            {
              strokeDashoffset: 0,
              duration: 0.9,
              stagger: 0.08,
            },
            "<"
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
    <section id="flow-diagram" ref={sectionRef} className="relative w-screen overflow-hidden bg-black py-28 text-blue-50">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="flow-grid-overlay absolute inset-0" />
        <div className="flow-scanline absolute left-[-45%] top-0 h-full w-1/3 bg-gradient-to-r from-blue-200/0 via-blue-200/20 to-blue-200/0" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 md:px-10">
        <p className="font-general text-xs uppercase tracking-[0.28em] text-blue-50/70">
          PathoInsight Visual Pipeline
        </p>
        <h2 className="mt-4 max-w-4xl font-zentry text-4xl uppercase leading-[0.92] text-white md:text-6xl">
          diagnosis signal is built
          <br />
          step by step
        </h2>
        <p className="mt-5 max-w-2xl font-circular-web text-sm text-blue-50/75 md:text-base">
          用同一套流程图把检索证据链可视化：从输入切片到最终结论，每一步都可解释、可追踪。
        </p>

        <div className="relative mt-14 flex flex-col items-center">
          <div className="patho-flow-svg relative w-full max-w-5xl">
            {svgMarkup ? (
              <div
                ref={svgContainerRef}
                className="relative z-10 mx-auto"
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            ) : (
              <div className="relative z-10 flex h-[440px] items-center justify-center font-circular-web text-blue-50/75">
                流程图资源加载中...
              </div>
            )}
          </div>

          <div className="pointer-events-none mt-5 flex gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <span
                key={`flow-particle-${index}`}
                className="flow-particle h-1.5 w-1.5 rounded-full bg-violet-200/70"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlowDiagramSection;