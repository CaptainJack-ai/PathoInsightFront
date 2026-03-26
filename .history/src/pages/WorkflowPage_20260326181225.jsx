import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WORKFLOW_CASES } from "../data/workflowCases";

const STAGES = [
  {
    id: "uploaded",
    title: "WSI Upload",
    subtitle: "Doctor submits one whole-slide image",
    image: "/img/patho-about.jpg",
    badge: "Step 01",
  },
  {
    id: "classifying",
    title: "Classification",
    subtitle: "Model predicts the pathology type",
    image: "/img/patho-story.jpg",
    badge: "Step 02",
  },
  {
    id: "patching",
    title: "Patch Tiling",
    subtitle: "WSI is split into many patches",
    image: "/img/patho-lab-1.jpg",
    badge: "Step 03",
  },
  {
    id: "patch_scoring",
    title: "Attention Scoring",
    subtitle: "Select top attention patches",
    image: "/img/patho-contact-1.jpg",
    badge: "Step 04",
  },
  {
    id: "retrieving_similar",
    title: "Case Retrieval",
    subtitle: "Retrieve similar patches and reports",
    image: "/img/patho-contact-2.jpg",
    badge: "Step 05",
  },
  {
    id: "generating_report",
    title: "Report Generation",
    subtitle: "Generate final diagnosis narrative",
    image: "/img/patho-lab-2.jpg",
    badge: "Step 06",
  },
  {
    id: "done",
    title: "Final Diagnosis",
    subtitle: "Present final clinical report",
    image: "/img/patho-lab-3.jpg",
    badge: "Step 07",
  },
];

const StagePanel = ({ stage, caseData }) => {
  const isUploadStep = stage.id === "uploaded";
  const content = caseData?.stageContent?.[stage.id];
  const isPatchStep = stage.id === "patching";
  const isScoreStep = stage.id === "patch_scoring";
  const isRetrieveStep = stage.id === "retrieving_similar";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/30 bg-black text-blue-100 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className={`relative overflow-hidden ${isUploadStep ? "h-[62%] md:h-[66%]" : "h-[58%] md:h-[62%]"}`}>
        <img
          src={stage.image}
          alt={stage.title}
          className={`h-full w-full object-cover ${isUploadStep ? "scale-100" : "scale-110"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="absolute left-5 top-5 rounded-full border border-white/35 bg-black/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
          {stage.badge}
        </div>

        <div className="absolute right-5 top-5 rounded-full border border-white/30 bg-black/55 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
          {caseData.name}
        </div>

        {isUploadStep && (
          <div className="absolute bottom-5 left-1/2 w-[92%] max-w-xl -translate-x-1/2 rounded-xl border border-yellow-300/50 bg-black/75 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-yellow-300">WSI Thumbnail Metadata</p>
            <div className="mt-2 grid gap-1 text-xs text-blue-100 md:grid-cols-2">
              <p>Type: CANCER_TYPE_PLACEHOLDER_001</p>
              <p>ID: CASE_ID_PLACEHOLDER_000001</p>
            </div>
          </div>
        )}

        {isPatchStep && (
          <>
            <div
              className="absolute inset-0 opacity-45"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent 0 24px, rgba(237,255,102,0.35) 24px 25px), repeating-linear-gradient(90deg, transparent 0 24px, rgba(237,255,102,0.35) 24px 25px)",
              }}
            />
            <div className="absolute bottom-0 top-0 w-1 animate-pulse bg-yellow-300/90 shadow-[0_0_20px_rgba(237,255,102,0.8)]" />
          </>
        )}

        {isScoreStep && (
          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
            {["Patch A", "Patch B", "Patch C", "Patch D"].map((name, idx) => (
              <div
                key={name}
                className={`rounded-md border px-3 py-2 text-xs ${
                  idx === 0
                    ? "border-yellow-300 bg-yellow-300/20 text-yellow-100"
                    : "border-white/20 bg-black/55 text-blue-100"
                }`}
              >
                {name} score: [to be filled]
              </div>
            ))}
          </div>
        )}

        {isRetrieveStep && (
          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
            {[1, 2].map((idx) => (
              <div key={idx} className="rounded-md border border-white/20 bg-black/55 p-2">
                <div className="h-20 w-full rounded bg-white/10" />
                <p className="mt-2 text-xs text-blue-100/90">similarity: [to be filled]</p>
                <p className="mt-1 text-[10px] text-blue-100/75">report snippet placeholder</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`space-y-3 px-5 py-6 md:px-7 ${isUploadStep ? "h-[38%] md:h-[34%]" : "h-[42%] md:h-[38%]"}`}>
        <h3 className="font-zentry text-4xl uppercase leading-none md:text-5xl">{stage.title}</h3>
        <p className="font-circular-web text-sm text-blue-100/75 md:text-base">{stage.subtitle}</p>

        <div className="rounded-lg border border-white/20 bg-white/5 p-4">
          <p className="text-xs uppercase text-yellow-300">{content?.panelTitle || "Placeholder"}</p>
          <p className="mt-2 text-sm text-blue-100/90">
            {content?.panelDescription || "Replace this stage content with your real pathology data."}
          </p>
        </div>
      </div>
    </div>
  );
};

function WorkflowPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const wrapperRef = useRef(null);
  const labelRef = useRef(null);
  const stageCardRef = useRef(null);
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
      const visible = Boolean(event?.detail?.visible);
      setIsNavVisible(visible);
    };

    window.addEventListener("workflow-nav-visibility", onWorkflowNavVisibility);

    return () => {
      window.removeEventListener("workflow-nav-visibility", onWorkflowNavVisibility);
    };
  }, []);

  const animateStageChange = (nextIndex, direction) => {
    const node = stageCardRef.current;
    if (!node || nextIndex === activeIndex) return;

    isAnimatingRef.current = true;

    const outY = direction > 0 ? -30 : 30;
    const inY = direction > 0 ? 30 : -30;

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    tl.to(node, {
      autoAlpha: 0,
      y: outY,
      scale: 0.98,
      duration: 0.32,
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
        {
          autoAlpha: 0.2,
          duration: 0.18,
          repeat: 3,
          yoyo: true,
          ease: "power1.inOut",
        }
      );
    },
    { dependencies: [activeIndex], scope: wrapperRef }
  );

  useGSAP(
    () => {
      gsap.fromTo(
        stageCardRef.current,
        { autoAlpha: 0, y: 32, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" }
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
                <div
                  className="h-full rounded-full bg-black transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
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

          <section onWheel={handleWheel} className="relative flex h-full flex-col gap-3 md:w-[70%]">
            {selectedCase ? (
              <>
                <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full bg-black/75 px-3 py-1 font-general text-[10px] uppercase tracking-wider text-blue-100">
                  scroll to switch stage
                </div>

                <div ref={stageCardRef} className="h-full">
                  <StagePanel stage={activeStage} caseData={selectedCase} />
                </div>
              </>
            ) : (
              <div className="grid h-full grid-cols-1 gap-3 overflow-auto rounded-2xl border border-black/15 bg-white/90 p-5 shadow-[0_12px_50px_rgba(1,1,1,0.08)] md:grid-cols-2">
                {WORKFLOW_CASES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/workflow/${item.id}`)}
                    className="group rounded-xl border border-black/15 bg-black/[0.02] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-black/[0.04]"
                  >
                    <p className="font-general text-[10px] uppercase tracking-wider text-black/45">Pathology Case</p>
                    <h3 className="mt-2 font-zentry text-2xl uppercase leading-none text-black">
                      {item.name}
                    </h3>
                    <p className="mt-3 text-xs text-black/55">Open this case workflow route and render case-specific stage placeholders.</p>
                    <p className="mt-3 text-[10px] uppercase tracking-wider text-black/50 group-hover:text-black">
                      Go to /workflow/{item.id}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default WorkflowPage;
