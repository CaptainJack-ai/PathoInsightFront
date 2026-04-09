import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WORKFLOW_CASES } from "../data/workflowCases";

const STAGES = [
  { id: "uploaded", title: "WSI上传", subtitle: "医生提交全切片图像", badge: "步骤 01", fallbackImage: "/img/patho-about.webp" },
  { id: "classifying", title: "病理分类", subtitle: "模型预测病理类型", badge: "步骤 02", fallbackImage: "/img/patho-story.webp" },
  { id: "patching", title: "切片分块", subtitle: "将WSI切分为多个小块", badge: "步骤 03", fallbackImage: "/img/patho-lab-1.webp" },
  { id: "retrieving_similar", title: "相似检索", subtitle: "检索相似病理切片与报告", badge: "步骤 04", fallbackImage: "/img/patho-contact-2.webp" },
  { id: "generating_report", title: "报告生成", subtitle: "生成最终诊断报告", badge: "步骤 05", fallbackImage: "/img/patho-lab-2.webp" },
];

const PATCH_DISPLAY_COUNT = 12;
const VISIBLE_RETRIEVAL_SPAN = 2;
const getInitialFocusIndex = (count) => Math.floor(count / 2);
const flowLinksCache = new Map();
const normalizeFlowAssetPath = (path, caseId) => {
  if (!path || typeof path !== "string") return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) return path;

  if (path.startsWith("data/dataforFront/")) {
    return path.replace(/^data\/dataforFront\/[^/]+\//, `/workflow-cases/${caseId}/`);
  }

  return `/${path.replace(/^\.\//, "")}`;
};

const SimilarRetrievalShowcase = ({ stage, caseData }) => {
  const retrievalRef = useRef(null);
  const wheelLockRef = useRef(false);
  const retrievalItems = caseData?.retrievalItems || [];
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [flowLinks, setFlowLinks] = useState([]);
  const [focusIndex, setFocusIndex] = useState(getInitialFocusIndex(PATCH_DISPLAY_COUNT));
  const visibleSpan = isMobile ? 0 : VISIBLE_RETRIEVAL_SPAN;
  const displayRows = useMemo(
    () =>
      Array.from({ length: PATCH_DISPLAY_COUNT }).map((_, idx) => {
        const flowItem = flowLinks[idx];

        if (flowItem) {
          const diagnosisSummary = flowItem.diagnosis?.summary || flowItem.diagnosis?.diagnosis_text;
          const queryPatchImage = normalizeFlowAssetPath(flowItem.query_patch?.image, caseData?.id);
          const similarWsiImage = normalizeFlowAssetPath(flowItem.similar_wsi?.image, caseData?.id);
          const similarity = Number(flowItem.retrieved_patch?.similarity);
          const similarityText = Number.isFinite(similarity) ? similarity.toFixed(3) : "N/A";

          return {
            id: `flow-link-${flowItem.index || idx + 1}`,
            rowIndex: idx,
              sourcePatchImage: queryPatchImage || `/img/patho-lab-1.webp`,
            similarWsiImage: similarWsiImage || "/img/patho-contact-2.webp",
            similarCaseTitle: `诊断编号 ${String(flowItem.index || idx + 1).padStart(2, "0")}`,
            similarReportText: diagnosisSummary || `相似病例报告占位 ${idx + 1}：在此填写诊断描述与证据说明。`,
            retrievedPatchMeta: {
              caseId: flowItem.retrieved_patch?.case_id || "未知病例",
              slideId: flowItem.retrieved_patch?.slide_id || "未知切片",
              similarityText,
            },
          };
        }

        const item = retrievalItems[idx];

        if (item) {
          return {
            ...item,
            rowIndex: idx,
          };
        }

        return {
          id: `retrieval-placeholder-${idx + 1}`,
          rowIndex: idx,
          sourcePatchImage: `/img/patho-lab-1.webp`,
          sourcePatchPath: `PATCH_PATH_PLACEHOLDER_${idx + 1}`,
          similarWsiImage: "/img/patho-contact-2.webp",
          similarCaseTitle: `相似病例 ${idx + 1}`,
          similarReportText: `相似病例报告占位 ${idx + 1}：在此填写诊断描述与证据说明。`,
        };
      }),
    [flowLinks, retrievalItems, caseData?.id]
  );

  const visibleRows = useMemo(
    () => displayRows.filter((row) => Math.abs(row.rowIndex - focusIndex) <= visibleSpan),
    [displayRows, focusIndex, visibleSpan]
  );

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const caseId = caseData?.id;

    if (!caseId) {
      setFlowLinks([]);
      return () => {
        cancelled = true;
      };
    }

    const loadFlowLinks = async () => {
      try {
        const cached = flowLinksCache.get(caseId);
        if (cached) {
          if (!cancelled) setFlowLinks(cached);
          return;
        }

        const res = await fetch(`/workflow-cases/${caseId}/flow_data.json`);
        if (!res.ok) throw new Error(`Failed to fetch flow_data: ${res.status}`);

        const payload = await res.json();
        const links = Array.isArray(payload?.flow_links) ? payload.flow_links : [];
        const trimmed = links.slice(0, PATCH_DISPLAY_COUNT);
        flowLinksCache.set(caseId, trimmed);

        if (!cancelled) {
          setFlowLinks(trimmed);
        }
      } catch (error) {
        if (!cancelled) {
          setFlowLinks([]);
        }
      }
    };

    loadFlowLinks();

    return () => {
      cancelled = true;
    };
  }, [caseData?.id]);

  useGSAP(
    () => {
      const rows = retrievalRef.current?.querySelectorAll(".retrieval-card");
      if (!rows?.length) return;

      gsap.set(rows, { autoAlpha: 0, y: 16, scale: 0.96 });
      gsap.to(rows, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.46,
        stagger: 0.07,
        ease: "power3.out",
      });
    },
    { dependencies: [caseData?.id], scope: retrievalRef }
  );

  useGSAP(
    () => {
      const focusedShell = retrievalRef.current?.querySelector(".retrieval-card.is-focused .retrieval-shell");
      if (!focusedShell) return;

      gsap.fromTo(
        focusedShell,
        { scale: 0.92, autoAlpha: 0.72 },
        { scale: 1, autoAlpha: 1, duration: 0.62, ease: "back.out(1.7)" }
      );
    },
    { dependencies: [focusIndex], scope: retrievalRef }
  );

  useEffect(() => {
    setFocusIndex(getInitialFocusIndex(displayRows.length));
  }, [caseData?.id, displayRows.length]);

  const onCarouselWheel = (event) => {
    if (isMobile) return;

    event.preventDefault();
    event.stopPropagation();

    if (wheelLockRef.current) return;
    if (Math.abs(event.deltaY) < 8) return;

    const direction = event.deltaY > 0 ? 1 : -1;
    setFocusIndex((prev) => Math.min(Math.max(prev + direction, 0), displayRows.length - 1));

    wheelLockRef.current = true;
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 260);
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/25 bg-black text-blue-100 shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_45%,rgba(237,255,102,0.12),rgba(0,0,0,0)_44%),radial-gradient(circle_at_78%_18%,rgba(96,165,250,0.17),rgba(0,0,0,0)_52%)]" />

      <div className="absolute left-2 top-2 z-20 rounded-full border border-white/35 bg-black/60 px-2.5 py-1 text-[9px] uppercase tracking-wider sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
        {stage.badge}
      </div>
      <div className="absolute right-2 top-2 z-20 max-w-[48%] truncate rounded-full border border-white/35 bg-black/60 px-2.5 py-1 text-[9px] uppercase tracking-wider sm:right-4 sm:top-4 sm:max-w-none sm:px-3 sm:text-[10px]">
        {caseData.name}
      </div>

      <div data-retrieval-scroll="true" ref={retrievalRef} onWheel={onCarouselWheel} className="relative z-10 h-full overflow-visible px-3 pb-4 pt-14 sm:px-5 sm:pb-6 md:px-8">
        {isMobile && (
          <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setFocusIndex((prev) => Math.max(prev - 1, 0))}
              className="rounded-full border border-white/35 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-wider"
            >
              上一条
            </button>
            <button
              type="button"
              onClick={() => setFocusIndex((prev) => Math.min(prev + 1, displayRows.length - 1))}
              className="rounded-full border border-white/35 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-wider"
            >
              下一条
            </button>
          </div>
        )}

        <div className="absolute left-1/2 top-1/2 h-[110%] w-full max-w-[1220px] -translate-x-1/2 -translate-y-1/2">
          {visibleRows.map((item) => {
            const offset = item.rowIndex - focusIndex;
            const absOffset = Math.abs(offset);
            const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.68 : absOffset === 2 ? 0.44 : 0.3;
            const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.42 : absOffset === 2 ? 0.18 : 0.08;
            const blur = absOffset === 0 ? 0 : absOffset === 1 ? 1.5 : absOffset === 2 ? 4 : 8;
            const translateY = isMobile ? 0 : offset * 200;
            const layerBase = 80 - absOffset * 2;
            const zIndex = layerBase + (offset < 0 ? 1 : 0);
            const isFocused = absOffset === 0;
            const eagerLoad = absOffset <= 1;

            return (
              <article
                key={item.id}
                className={`retrieval-card absolute left-1/2 top-1/2 w-full max-w-[1180px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isFocused ? "is-focused" : ""
                }`}
                style={{
                  transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
                  opacity,
                  filter: `blur(${blur}px)`,
                  zIndex,
                  pointerEvents: absOffset === 0 || isMobile ? "auto" : "none",
                }}
              >
                <div className="retrieval-shell grid grid-cols-1 items-start gap-2 rounded-2xl bg-gradient-to-r from-black/72 via-black/62 to-black/52 p-2.5 shadow-[0_14px_36px_rgba(0,0,0,0.3)] sm:p-3 md:grid-cols-[220px_34px_220px_34px_minmax(0,1fr)] md:items-center md:gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-100/75">高注意力切片 {item.rowIndex + 1}</p>
                    <img
                      src={item.sourcePatchImage}
                      alt={`Source attention patch ${item.rowIndex + 1}`}
                      className="mt-2 aspect-video w-full rounded-md object-cover md:aspect-square"
                      loading={eagerLoad ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={isFocused ? "high" : "low"}
                    />
                  </div>

                  <div className="hidden text-center font-general text-xs uppercase text-blue-100/70 md:block">-&gt;</div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-100/75">相似WSI</p>
                    <img
                      src={item.similarWsiImage}
                      alt={`相似病理 WSI ${item.rowIndex + 1}`}
                      className="mt-2 aspect-video w-full rounded-md object-cover md:aspect-square"
                      loading={eagerLoad ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={isFocused ? "high" : "low"}
                    />
                  </div>

                  <div className="hidden text-center font-general text-xs uppercase text-blue-100/70 md:block">-&gt;</div>

                  <div className="min-h-[12rem] rounded-xl bg-black/45 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-blue-100/80">检索证据链（右侧）</p>
                    <div className="mt-2 rounded-lg border border-white/15 bg-black/40 px-2.5 py-2 text-[10px] text-blue-100/85">
                      <p>相似度: {item.retrievedPatchMeta?.similarityText || "N/A"}</p>
                      <p className="mt-1 truncate">Case: {item.retrievedPatchMeta?.caseId || "未知病例"}</p>
                      <p className="mt-1 truncate">Slide: {item.retrievedPatchMeta?.slideId || "未知切片"}</p>
                    </div>
                    <p className="mt-2 text-xs text-blue-100/95">{item.similarCaseTitle}</p>
                    <p className="mt-2 text-[11px] text-blue-100/75">{item.similarReportText}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ReportPdfShowcase = ({ stage, caseData }) => {
  const reportPdf = caseData?.reportPdf;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-black/15 bg-blue-50 text-black shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(59,130,246,0.16),rgba(255,255,255,0)_42%),radial-gradient(circle_at_85%_82%,rgba(15,23,42,0.08),rgba(255,255,255,0)_55%)]" />

      <div className="absolute left-2 top-2 z-20 rounded-full border border-black/20 bg-white/78 px-2.5 py-1 text-[9px] uppercase tracking-wider text-black/80 sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
        {stage.badge}
      </div>
      <div className="absolute right-2 top-2 z-20 max-w-[48%] truncate rounded-full border border-black/20 bg-white/78 px-2.5 py-1 text-[9px] uppercase tracking-wider text-black/80 sm:right-4 sm:top-4 sm:max-w-none sm:px-3 sm:text-[10px]">
        {caseData.name}
      </div>

      <div className="relative z-10 flex h-full flex-col px-3 pb-3 pt-11 sm:px-4 sm:pb-4 sm:pt-12 md:px-5 md:pb-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-general text-xs uppercase tracking-wider text-black/65">诊断报告 PDF</p>
          <a
            href={reportPdf}
            download
            className="rounded-full border border-black/25 bg-white/85 px-3 py-1.5 font-general text-[9px] uppercase tracking-wider text-black transition hover:bg-black hover:text-white sm:px-4 sm:text-[10px]"
          >
            下载 PDF
          </a>
        </div>

        <div data-report-scroll="true" className="min-h-0 flex-1 overflow-auto rounded-xl border border-black/15 bg-white p-1 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <iframe
            title={`${caseData.name} 诊断报告`}
            src={`${reportPdf}#view=FitH`}
            className="h-full w-full rounded-md bg-white"
          />
        </div>
      </div>
    </div>
  );
};

const StageShowcase = ({ stage, caseData }) => {
  const tileColumns = 12;
  const tileRows = 8;
  const patchStageRef = useRef(null);
  const stageImage = caseData?.stageImages?.[stage.id] || stage.fallbackImage;
  const uploadedStageImage = caseData?.stageImages?.uploaded || STAGES[0].fallbackImage;
  const isUploadStep = stage.id === "uploaded";
  const isClassifyStep = stage.id === "classifying";
  const isPatchStep = stage.id === "patching";
  const isRetrieveStep = stage.id === "retrieving_similar";
  const isReportStep = stage.id === "generating_report";
  const displayImage = isClassifyStep || isPatchStep ? uploadedStageImage : stageImage;
  const patchHighlights = caseData?.patchHighlights || [];
  const displayPatches = patchHighlights.slice(0, PATCH_DISPLAY_COUNT);

  useGSAP(
    () => {
      if (!isPatchStep || !patchStageRef.current) return;

      const tiles = patchStageRef.current.querySelectorAll(".patch-tile");
      const cards = patchStageRef.current.querySelectorAll(".highlight-patch-card");

      gsap.set(tiles, { autoAlpha: 1, scale: 1 });
      gsap.set(cards, { autoAlpha: 0, y: 22, scale: 0.95 });

      gsap
        .timeline()
        .to(tiles, {
          autoAlpha: 0,
          scale: 0.82,
          duration: 0.58,
          stagger: {
            each: 0.014,
            from: "random",
          },
          ease: "power2.out",
        })
        .to(
          cards,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.42,
            stagger: 0.08,
            ease: "power3.out",
          },
          "-=0.2"
        );
    },
    { dependencies: [isPatchStep, caseData?.id], scope: patchStageRef }
  );

  if (isRetrieveStep) {
    return <SimilarRetrievalShowcase stage={stage} caseData={caseData} />;
  }

  if (isReportStep) {
    return <ReportPdfShowcase stage={stage} caseData={caseData} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/25 bg-black text-blue-100 shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
      <div className="relative h-full overflow-hidden">
        <img src={displayImage} alt={stage.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="absolute left-2 top-2 rounded-full border border-white/35 bg-black/60 px-2.5 py-1 text-[9px] uppercase tracking-wider sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
          {stage.badge}
        </div>
        <div className="absolute right-2 top-2 max-w-[48%] truncate rounded-full border border-white/35 bg-black/60 px-2.5 py-1 text-[9px] uppercase tracking-wider sm:right-4 sm:top-4 sm:max-w-none sm:px-3 sm:text-[10px]">
          {caseData.name}
        </div>

        {isPatchStep && (
          <div ref={patchStageRef} className="absolute inset-0 z-[5]">
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
              {Array.from({ length: tileColumns * tileRows }).map((_, idx) => {
                const row = Math.floor(idx / tileColumns);
                const col = idx % tileColumns;

                return (
                  <div
                    key={`tile-${idx}`}
                    className="patch-tile border border-yellow-300/18 bg-black/24"
                    style={{
                      backgroundImage: `url(${displayImage})`,
                      backgroundSize: `${tileColumns * 100}% ${tileRows * 100}%`,
                      backgroundPosition: `${(col / Math.max(tileColumns - 1, 1)) * 100}% ${(row / Math.max(tileRows - 1, 1)) * 100}%`,
                      backdropFilter: "blur(0.3px)",
                    }}
                  />
                );
              })}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/28 to-transparent" />

            <div className="absolute inset-x-0 bottom-4 top-12 z-10 flex items-center justify-center overflow-hidden px-3 sm:bottom-6 sm:top-14 sm:px-4 md:bottom-8 md:px-6 md:top-12">
              <div className="grid w-full max-w-3xl grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:max-w-4xl md:gap-3">
                {displayPatches.map((img, idx) => (
                  <div key={`patch-${img}`} className="highlight-patch-card aspect-square overflow-hidden rounded-lg border border-white/30 bg-black/65 p-1 shadow-[0_8px_30px_rgba(0,0,0,0.3)] md:rounded-xl md:p-1.5">
                    <img src={img} alt={`高注意力切片 ${idx + 1}`} className="size-full rounded-md object-cover" loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isUploadStep && (
          <div className="absolute bottom-3 left-1/2 w-[95%] max-w-xl -translate-x-1/2 rounded-xl border border-white-300/50 bg-black/78 px-3 py-2.5 backdrop-blur-sm sm:bottom-4 sm:w-[92%] sm:px-4 sm:py-3">
            <p className="text-[10px] uppercase tracking-wider text-white-300">WSI Thumbnail Metadata</p>
            <div className="mt-2 grid gap-1 text-xs text-blue-100 md:grid-cols-2">
              <p>类型：癌种占位_001</p>
              <p>编号：病例编号占位_000001</p>
            </div>
          </div>
        )}

        {isClassifyStep && (
          <div className="absolute left-1/2 top-1/2 z-10 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-yellow-300/60 bg-black/72 px-5 py-4 text-center shadow-[0_0_30px_rgba(237,255,102,0.25)] backdrop-blur-sm animate-pulse sm:w-auto sm:px-8 sm:py-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-yellow-300">预测类别</p>
            <p className="mt-2 font-zentry text-3xl uppercase leading-none text-blue-100 sm:text-4xl md:text-5xl">{caseData?.classificationLabel || "类别占位"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CaseSelectionPanel = ({ onSelect }) => {
  return (
    <div className="h-full overflow-auto rounded-2xl border border-black/12 bg-white/90 p-5 shadow-[0_12px_50px_rgba(1,1,1,0.08)]">
      <div className="mb-4">
        <p className="font-general text-xs uppercase tracking-wider text-black/45">选择病理案例</p>
        <h3 className="mt-1 font-zentry text-3xl uppercase text-black">10 个完整流程</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {WORKFLOW_CASES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="group rounded-xl border border-black/15 bg-black/[0.02] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-black/[0.04]"
          >
            <p className="font-general text-[10px] uppercase tracking-wider text-black/45">病理案例</p>
            <h4 className="mt-2 font-zentry text-2xl uppercase leading-none text-black">{item.name}</h4>
            <p className="mt-3 text-xs text-black/55">进入该病例流程页面，查看各阶段内容展示。</p>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-black/50 group-hover:text-black">前往 /workflow/{item.id}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

function WorkflowPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const wrapperRef = useRef(null);
  const labelRef = useRef(null);
  const cardRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);

  const selectedCase = useMemo(
    () => WORKFLOW_CASES.find((item) => item.id === caseId) || null,
    [caseId]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [caseId]);

  useEffect(() => {
    const onWorkflowNavVisibility = (event) => {
      setIsNavVisible(Boolean(event?.detail?.visible));
    };

    window.addEventListener("workflow-nav-visibility", onWorkflowNavVisibility);
    return () => window.removeEventListener("workflow-nav-visibility", onWorkflowNavVisibility);
  }, []);

  const animateStageChange = (nextIndex, direction) => {
    const node = cardRef.current;
    if (!node || nextIndex === activeIndex) return;

    isAnimatingRef.current = true;

    const outY = direction > 0 ? -30 : 30;
    const inY = direction > 0 ? 30 : -30;

    gsap
      .timeline({
        onComplete: () => {
          isAnimatingRef.current = false;
        },
      })
      .to(node, {
        autoAlpha: 0,
        y: outY,
        scale: 0.985,
        duration: 0.3,
        ease: "power2.inOut",
      })
      .add(() => setActiveIndex(nextIndex))
      .set(node, { y: inY })
      .to(node, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.42,
        ease: "power3.out",
      });
  };

  const handleWheel = (event) => {
    event.preventDefault();

    if (!selectedCase || isAnimatingRef.current) return;

    if (activeStage?.id === "retrieving_similar") {
      // Stage 4 uses its own wheel-driven vertical carousel.
      return;
    }

    if (activeStage?.id === "generating_report") {
      const reportScroller = event.currentTarget.querySelector('[data-report-scroll="true"]');
      if (reportScroller) {
        reportScroller.scrollTop += event.deltaY;
      }
      return;
    }

    const delta = event.deltaY;
    if (Math.abs(delta) < 8) return;

    window.dispatchEvent(
      new CustomEvent("workflow-nav-visibility", {
        detail: { visible: delta < 0 },
      })
    );

    if (delta > 0 && activeIndex < STAGES.length - 1) {
      animateStageChange(activeIndex + 1, 1);
    } else if (delta < 0 && activeIndex > 0) {
      animateStageChange(activeIndex - 1, -1);
    }
  };

  useGSAP(
    () => {
      gsap.fromTo(
        labelRef.current,
        { autoAlpha: 1 },
        { autoAlpha: 0.22, duration: 0.18, repeat: 3, yoyo: true, ease: "power1.inOut" }
      );
    },
    { dependencies: [activeIndex], scope: wrapperRef }
  );

  useGSAP(
    () => {
      gsap.fromTo(
        cardRef.current,
        { autoAlpha: 0, y: 26, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.62, ease: "power3.out" }
      );
    },
    { dependencies: [caseId], scope: wrapperRef }
  );

  const activeStage = STAGES[activeIndex];
  const progressPercent = ((activeIndex + 1) / STAGES.length) * 100;

  return (
    <main
      ref={wrapperRef}
      className={`min-h-screen w-full overflow-x-hidden overflow-y-auto bg-blue-100 px-3 pb-4 transition-[padding,transform] duration-500 ease-out sm:px-5 md:h-screen md:overflow-hidden md:px-10 md:pb-8 ${
        isNavVisible ? "pt-20 md:pt-28" : "pt-8 md:pt-14"
      }`}
    >
      <div className="mx-auto h-full w-full max-w-[1600px]">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between md:mb-7">
          <div>
            <p className="font-general text-xs uppercase tracking-widest text-black/60">PathoInsight 演示</p>
            <h1 className="font-zentry text-3xl uppercase text-black sm:text-4xl md:text-6xl">工作流叙事展示</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {selectedCase && (
              <button
                type="button"
                onClick={() => navigate("/workflow")}
                className="rounded-full border border-black/20 px-3 py-1.5 font-general text-[11px] uppercase text-black transition hover:bg-black hover:text-blue-100 sm:px-4 sm:py-2"
              >
                切换病理
              </button>
            )}
            <Link
              to="/"
              className="rounded-full border border-black/20 px-4 py-1.5 font-general text-[11px] uppercase text-black transition hover:bg-black hover:text-blue-100 sm:px-5 sm:py-2 sm:text-xs"
            >
              返回首页
            </Link>
          </div>
        </div>

        <div className="flex h-auto flex-col gap-4 md:h-[calc(100%-5rem)] md:flex-row md:gap-8">
          <aside className="flex h-auto md:h-full md:w-[30%] md:min-w-[320px] md:max-w-[480px] md:items-center">
            <div className="w-full rounded-2xl border border-black/15 bg-white/90 p-4 shadow-[0_12px_50px_rgba(1,1,1,0.08)] sm:p-5 md:p-7">
              <p className="font-general text-xs uppercase tracking-wider text-black/50">当前阶段</p>
              <h2 ref={labelRef} className="mt-2 font-zentry text-3xl uppercase text-black sm:mt-3 sm:text-4xl md:text-5xl">
                {activeStage.title}
              </h2>
              <p className="mt-2 font-circular-web text-sm text-black/65">{activeStage.subtitle}</p>

              <div className="mt-5 h-2 rounded-full bg-black/10">
                <div className="h-full rounded-full bg-black transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="mt-5 space-y-2">
                {STAGES.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  const isDone = idx < activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!selectedCase}
                      onClick={() => animateStageChange(idx, idx > activeIndex ? 1 : -1)}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs uppercase transition ${
                        isActive
                          ? "border-black bg-black text-blue-100"
                          : isDone
                          ? "border-black/25 bg-black/5 text-black"
                          : "border-black/10 bg-transparent text-black/40 hover:border-black/25 hover:text-black/80"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span>{item.title}</span>
                      <span>{String(idx + 1).padStart(2, "0")}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.03] p-3 text-[11px] text-black/65">
                {selectedCase
                  ? `已选择：${selectedCase.name}。右侧展示该病例的流程模板。`
                  : "请先在右侧选择一个病理案例以开始展示。"}
              </div>
            </div>
          </aside>

          <section onWheel={handleWheel} className="relative flex min-h-[58vh] flex-col md:h-full md:w-[70%]">
            {selectedCase ? (
              <>
                <div ref={cardRef} className="h-full">
                  <StageShowcase stage={activeStage} caseData={selectedCase} />
                </div>
              </>
            ) : (
              <CaseSelectionPanel onSelect={(id) => navigate(`/workflow/${id}`)} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default WorkflowPage;
