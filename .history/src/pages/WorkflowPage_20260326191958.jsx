import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WORKFLOW_CASES } from "../data/workflowCases";

const STAGES = [
  { id: "uploaded", title: "WSI Upload", subtitle: "Doctor submits one whole-slide image", badge: "Step 01", fallbackImage: "/img/patho-about.jpg" },
  { id: "classifying", title: "Classification", subtitle: "Model predicts the pathology type", badge: "Step 02", fallbackImage: "/img/patho-story.jpg" },
  { id: "patching", title: "Patch Tiling", subtitle: "WSI is split into many patches", badge: "Step 03", fallbackImage: "/img/patho-lab-1.jpg" },
  { id: "retrieving_similar", title: "Case Retrieval", subtitle: "Retrieve similar patches and reports", badge: "Step 04", fallbackImage: "/img/patho-contact-2.jpg" },
  { id: "generating_report", title: "Report Generation", subtitle: "Generate final diagnosis narrative", badge: "Step 05", fallbackImage: "/img/patho-lab-2.jpg" },
  { id: "done", title: "Final Diagnosis", subtitle: "Present final clinical report", badge: "Step 06", fallbackImage: "/img/patho-lab-3.jpg" },
];

const SimilarRetrievalShowcase = ({ stage, caseData }) => {
  const retrievalRef = useRef(null);
  const wheelLockRef = useRef(false);
  const retrievalItems = caseData?.retrievalItems || [];
  const [focusIndex, setFocusIndex] = useState(2);
  const displayRows = Array.from({ length: 5 }).map((_, idx) => {
    const item = retrievalItems[idx];
    if (item) return item;

    return {
      id: `retrieval-placeholder-${idx + 1}`,
      sourcePatchImage: `/img/patho-lab-1.jpg`,
      sourcePatchPath: `PATCH_PATH_PLACEHOLDER_${idx + 1}`,
      similarWsiImage: "/img/patho-contact-2.jpg",
      similarCaseTitle: `SIMILAR_CASE_${idx + 1}`,
      similarReportText: `SIMILAR_REPORT_${idx + 1}_PLACEHOLDER: diagnostic narrative and evidence text to be provided.`,
    };
  });

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
    setFocusIndex(2);
  }, [caseData?.id]);

  const onCarouselWheel = (event) => {
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

      <div className="absolute left-4 top-4 z-20 rounded-full border border-white/35 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wider">
        {stage.badge}
      </div>
      <div className="absolute right-4 top-4 z-20 rounded-full border border-white/35 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wider">
        {caseData.name}
      </div>

      <div data-retrieval-scroll="true" ref={retrievalRef} onWheel={onCarouselWheel} className="relative z-10 h-full overflow-hidden px-5 pb-6 pt-14 md:px-8">
        <div className="absolute left-1/2 top-1/2 h-[96%] w-full max-w-[1220px] -translate-x-1/2 -translate-y-1/2">
          {displayRows.map((item, idx) => {
            const offset = idx - focusIndex;
            const absOffset = Math.abs(offset);
            const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.62 : absOffset === 2 ? 0.34 : 0.22;
            const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.2 : absOffset === 2 ? 0.06 : 0.03;
            const blur = absOffset === 0 ? 0 : absOffset === 1 ? 8 : absOffset === 2 ? 18 : 24;
            const translateY = offset * 210;

            return (
              <article
                key={item.id}
                className={`retrieval-card absolute left-1/2 top-1/2 w-full max-w-[1180px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  absOffset === 0 ? "is-focused" : ""
                }`}
                style={{
                  transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
                  opacity,
                  filter: `blur(${blur}px)`,
                  zIndex: 60 - absOffset,
                  pointerEvents: absOffset === 0 ? "auto" : "none",
                }}
              >
                <div className="retrieval-shell grid grid-cols-[220px_34px_220px_34px_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-gradient-to-r from-black/72 via-black/62 to-black/52 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-100/75">Top Attention Patch {idx + 1}</p>
                    <img
                      src={item.sourcePatchImage}
                      alt={`Source attention patch ${idx + 1}`}
                      className="mt-2 aspect-square w-full rounded-md object-cover"
                    />
                  </div>

                  <div className="text-center font-general text-xs uppercase text-blue-100/70">-&gt;</div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-100/75">Similar WSI</p>
                    <img
                      src={item.similarWsiImage}
                      alt={`Similar pathology WSI ${idx + 1}`}
                      className="mt-2 aspect-square w-full rounded-md object-cover"
                    />
                  </div>

                  <div className="text-center font-general text-xs uppercase text-blue-100/70">-&gt;</div>

                  <div className="min-h-[12rem] rounded-xl bg-black/45 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-blue-100/80">Similar Case Diagnosis</p>
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
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/25 bg-black text-blue-100 shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(237,255,102,0.12),rgba(0,0,0,0)_42%),radial-gradient(circle_at_88%_84%,rgba(96,165,250,0.2),rgba(0,0,0,0)_55%)]" />

      <div className="absolute left-4 top-4 z-20 rounded-full border border-white/35 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wider">
        {stage.badge}
      </div>
      <div className="absolute right-4 top-4 z-20 rounded-full border border-white/35 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wider">
        {caseData.name}
      </div>

      <div className="relative z-10 flex h-full flex-col px-5 pb-5 pt-14 md:px-7 md:pb-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-general text-xs uppercase tracking-wider text-yellow-300">Diagnostic PDF Report</p>
          <a
            href={reportPdf}
            download
            className="rounded-full border border-yellow-300/65 bg-yellow-300/10 px-4 py-1.5 font-general text-[10px] uppercase tracking-wider text-yellow-300 transition hover:bg-yellow-300 hover:text-black"
          >
            Download PDF
          </a>
        </div>

        <div data-report-scroll="true" className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/30 bg-white/5 p-2 backdrop-blur-sm">
          <iframe
            title={`${caseData.name} diagnostic report`}
            src={`${reportPdf}#view=FitH`}
            className="h-full w-full rounded-lg bg-white"
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

        <div className="absolute left-4 top-4 rounded-full border border-white/35 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wider">
          {stage.badge}
        </div>
        <div className="absolute right-4 top-4 rounded-full border border-white/35 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wider">
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

            <div className="absolute inset-x-0 bottom-8 top-14 z-10 flex flex-col items-center justify-center gap-4 px-6 md:top-12 md:gap-5">
              <div className="grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
                {patchHighlights.slice(0, 3).map((img, idx) => (
                  <div key={`top-${img}`} className="highlight-patch-card rounded-xl border border-white/30 bg-black/65 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <img src={img} alt={`Top attention patch ${idx + 1}`} className="h-24 w-full rounded-md object-cover md:h-28" />
                  </div>
                ))}
              </div>

              <div className="grid w-full max-w-[38rem] grid-cols-1 gap-3 md:grid-cols-2">
                {patchHighlights.slice(3, 5).map((img, idx) => (
                  <div key={`bottom-${img}`} className="highlight-patch-card rounded-xl border border-white/30 bg-black/65 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <img src={img} alt={`Bottom attention patch ${idx + 4}`} className="h-24 w-full rounded-md object-cover md:h-28" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isUploadStep && (
          <div className="absolute bottom-4 left-1/2 w-[92%] max-w-xl -translate-x-1/2 rounded-xl border border-yellow-300/50 bg-black/78 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-yellow-300">WSI Thumbnail Metadata</p>
            <div className="mt-2 grid gap-1 text-xs text-blue-100 md:grid-cols-2">
              <p>Type: CANCER_TYPE_PLACEHOLDER_001</p>
              <p>ID: CASE_ID_PLACEHOLDER_000001</p>
            </div>
          </div>
        )}

        {isClassifyStep && (
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-yellow-300/60 bg-black/72 px-8 py-5 text-center shadow-[0_0_30px_rgba(237,255,102,0.25)] backdrop-blur-sm animate-pulse">
            <p className="text-[10px] uppercase tracking-[0.22em] text-yellow-300">Predicted Class</p>
            <p className="mt-2 font-zentry text-4xl uppercase leading-none text-blue-100 md:text-5xl">{caseData?.classificationLabel || "CLASS_PLACEHOLDER"}</p>
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
        <p className="font-general text-xs uppercase tracking-wider text-black/45">Select Pathology Case</p>
        <h3 className="mt-1 font-zentry text-3xl uppercase text-black">10 Full Workflows</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {WORKFLOW_CASES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="group rounded-xl border border-black/15 bg-black/[0.02] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-black/[0.04]"
          >
            <p className="font-general text-[10px] uppercase tracking-wider text-black/45">Pathology Case</p>
            <h4 className="mt-2 font-zentry text-2xl uppercase leading-none text-black">{item.name}</h4>
            <p className="mt-3 text-xs text-black/55">Open this case workflow route and show stage-specific placeholder content.</p>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-black/50 group-hover:text-black">Go to /workflow/{item.id}</p>
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
      className={`h-screen w-screen overflow-hidden bg-blue-100 px-5 pb-6 transition-[padding,transform] duration-500 ease-out md:px-10 md:pb-8 ${
        isNavVisible ? "pt-24 md:pt-28" : "pt-10 md:pt-14"
      }`}
    >
      <div className="mx-auto h-full w-full max-w-[1600px]">
        <div className="mb-5 flex items-end justify-between md:mb-7">
          <div>
            <p className="font-general text-xs uppercase tracking-widest text-black/60">PathoInsight Demo</p>
            <h1 className="font-zentry text-4xl uppercase text-black md:text-6xl">Workflow Scrollytelling</h1>
          </div>
          <div className="flex items-center gap-3">
            {selectedCase && (
              <button
                type="button"
                onClick={() => navigate("/workflow")}
                className="rounded-full border border-black/20 px-4 py-2 font-general text-[10px] uppercase text-black transition hover:bg-black hover:text-blue-100"
              >
                Change Pathology
              </button>
            )}
            <Link
              to="/"
              className="rounded-full border border-black/20 px-5 py-2 font-general text-xs uppercase text-black transition hover:bg-black hover:text-blue-100"
            >
              Back Home
            </Link>
          </div>
        </div>

        <div className="flex h-[calc(100%-5rem)] flex-col gap-6 md:flex-row md:gap-8">
          <aside className="flex h-full md:w-[30%] md:min-w-[320px] md:max-w-[480px] md:items-center">
            <div className="w-full rounded-2xl border border-black/15 bg-white/90 p-6 shadow-[0_12px_50px_rgba(1,1,1,0.08)] md:p-7">
              <p className="font-general text-xs uppercase tracking-wider text-black/50">Current Stage</p>
              <h2 ref={labelRef} className="mt-3 font-zentry text-4xl uppercase text-black md:text-5xl">
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
                      <span>{item.id.replaceAll("_", " ")}</span>
                      <span>{String(idx + 1).padStart(2, "0")}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.03] p-3 text-[11px] text-black/65">
                {selectedCase
                  ? `${selectedCase.name} selected. Right panel now shows this pathology flow template.`
                  : "Select one pathology on the right to start the full workflow showcase."}
              </div>
            </div>
          </aside>

          <section onWheel={handleWheel} className="relative flex h-full flex-col md:w-[70%]">
            {selectedCase ? (
              <>
                <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full bg-black/75 px-3 py-1 font-general text-[10px] uppercase tracking-wider text-blue-100">
                  scroll to switch stage
                </div>
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
