import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  createJobStatusPoller,
  getJobStatus,
  isKnownStage,
  uploadWSI,
} from "../api/workflowApi";

const STAGES = [
  {
    id: "uploaded",
    title: "WSI Uploaded",
    subtitle: "Doctor uploads one whole-slide image",
    image: "/img/patho-about.jpg",
  },
  {
    id: "classifying",
    title: "Slide Classification",
    subtitle: "Model predicts slide category with confidence",
    image: "/img/patho-story.jpg",
  },
  {
    id: "patching",
    title: "Patch Generation",
    subtitle: "WSI is tiled into many analysis patches",
    image: "/img/patho-lab-1.jpg",
  },
  {
    id: "patch_scoring",
    title: "Attention Scoring",
    subtitle: "Select top patches by attention score",
    image: "/img/patho-contact-1.jpg",
  },
  {
    id: "retrieving_similar",
    title: "Retrieve Similar Cases",
    subtitle: "Find similar historical patches and reports",
    image: "/img/patho-contact-2.jpg",
  },
  {
    id: "generating_report",
    title: "Qwen Report Generation",
    subtitle: "Combine type, top patch, and evidence reports",
    image: "/img/patho-lab-2.jpg",
  },
  {
    id: "done",
    title: "Final Diagnosis",
    subtitle: "Clinical-grade final pathology report",
    image: "/img/patho-lab-3.jpg",
  },
];

const STAGE_INDEX_MAP = STAGES.reduce((acc, stage, index) => {
  acc[stage.id] = index;
  return acc;
}, {});

const EMPTY_RESULT = {
  classification: undefined,
  topPatches: [],
  similarCases: [],
  finalReport: null,
};

const StagePanel = ({ stage, result }) => {
  const isPatchStep = stage.id === "patching";
  const isClassifyStep = stage.id === "classifying";
  const isScoreStep = stage.id === "patch_scoring";
  const isRetrieveStep = stage.id === "retrieving_similar";
  const isGenerateStep = stage.id === "generating_report";
  const isDoneStep = stage.id === "done";

  const topPatches = result?.topPatches ?? [];
  const similarCases = result?.similarCases ?? [];
  const topPatch = topPatches[0];
  const classification = result?.classification;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/30 bg-black text-blue-100 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="relative h-[58%] overflow-hidden md:h-[62%]">
        <img src={stage.image} alt={stage.title} className="h-full w-full scale-110 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

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

        {isClassifyStep && classification && (
          <div className="absolute right-5 top-5 rounded-full bg-yellow-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-black">
            {classification.label} • {(classification.confidence * 100).toFixed(1)}%
          </div>
        )}

        {isScoreStep && (
          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
            {topPatches.slice(0, 4).map((patch, index) => (
              <div
                key={`${patch.img}-${index}`}
                className={`overflow-hidden rounded-md border text-xs ${
                  index === 0
                    ? "border-yellow-300 bg-yellow-300/15 text-yellow-100"
                    : "border-white/20 bg-black/55 text-blue-100"
                }`}
              >
                {patch.img && (
                  <img
                    src={patch.img}
                    alt={`top-patch-${index + 1}`}
                    className="h-16 w-full object-cover"
                  />
                )}
                <div className="space-y-1 p-2">
                  <p>patch_{index + 1} score: {Number(patch.score || 0).toFixed(2)}</p>
                  {patch.report && <p className="line-clamp-2 text-[10px] text-blue-100/80">{patch.report}</p>}
                </div>
              </div>
            ))}
            {topPatches.length === 0 && (
              <div className="col-span-2 rounded-md border border-white/20 bg-black/50 px-3 py-2 text-xs text-blue-100/75">
                Waiting for patch scoring result...
              </div>
            )}
          </div>
        )}

        {isRetrieveStep && (
          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
            {similarCases.slice(0, 2).map((item, idx) => (
              <div key={`${item.patchImg}-${idx}`} className="rounded-md border border-white/20 bg-black/55 p-2">
                <img
                  src={item.patchImg || stage.image}
                  alt={`similar-${idx}`}
                  className="h-20 w-full rounded object-cover"
                />
                <p className="mt-2 text-xs text-blue-100/90">
                  similarity: {Number(item.similarity || 0).toFixed(2)}
                </p>
                {item.report && (
                  <p className="mt-1 line-clamp-2 text-[10px] text-blue-100/75">{item.report}</p>
                )}
              </div>
            ))}
            {similarCases.length === 0 && (
              <div className="col-span-2 rounded-md border border-white/20 bg-black/50 px-3 py-2 text-xs text-blue-100/75">
                Waiting for similar case retrieval...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-[42%] space-y-3 px-5 py-6 md:h-[38%] md:px-7">
        <h3 className="font-zentry text-4xl uppercase leading-none md:text-5xl">{stage.title}</h3>
        <p className="font-circular-web text-sm text-blue-100/75 md:text-base">{stage.subtitle}</p>

        {isGenerateStep && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <p className="text-xs uppercase text-yellow-300">Input To Qwen</p>
            <p className="mt-2 text-sm text-blue-100/90">
              Type: {classification?.label || "-"} | Top patch score: {topPatch ? Number(topPatch.score || 0).toFixed(2) : "-"} | Evidence report: {topPatch?.report ? "attached" : "pending"}
            </p>
            {topPatch?.img && (
              <img
                src={topPatch.img}
                alt="top patch evidence"
                className="mt-3 h-20 w-full rounded-md object-cover"
              />
            )}
          </div>
        )}

        {isDoneStep && (
          <div className="rounded-lg border border-yellow-300/70 bg-yellow-300/10 p-4">
            <p className="text-xs uppercase text-yellow-300">Final Report</p>
            <p className="mt-2 text-sm text-blue-100/90">
              {result?.finalReport || "Waiting for final report generation..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function WorkflowPage() {
  const wrapperRef = useRef(null);
  const labelRef = useRef(null);
  const stageCardRef = useRef(null);
  const pollerRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobIdInput, setJobIdInput] = useState("");
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState(EMPTY_RESULT);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [uploadPanelState, setUploadPanelState] = useState("expanded");
  const [error, setError] = useState("");

  const activeStage = STAGES[activeIndex];

  const stopPolling = () => {
    pollerRef.current?.stop?.();
    pollerRef.current = null;
    setIsPolling(false);
  };

  useEffect(() => {
    return () => stopPolling();
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

  const updateFromStatus = (data) => {
    const nextStage = isKnownStage(data.stage) ? data.stage : "uploaded";
    const nextIndex = STAGE_INDEX_MAP[nextStage] ?? 0;
    const direction = nextIndex >= activeIndex ? 1 : -1;

    animateStageChange(nextIndex, direction);
    setProgress(typeof data.progress === "number" ? data.progress : 0);
    setResult(data.result || EMPTY_RESULT);
  };

  const startPolling = async (nextJobId) => {
    if (!nextJobId) {
      setError("Please input a valid jobId");
      return;
    }

    stopPolling();
    setError("");

    try {
      const firstStatus = await getJobStatus(nextJobId);
      updateFromStatus(firstStatus);
      setIsPolling(true);

      pollerRef.current = createJobStatusPoller({
        jobId: nextJobId,
        onData: (data) => {
          updateFromStatus(data);
          if (data.stage === "done") {
            stopPolling();
          }
        },
        onError: (err) => {
          setError(err.message || "Polling failed");
          stopPolling();
        },
      });
    } catch (err) {
      setError(err.message || "Status query failed");
      stopPolling();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a WSI file first");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const uploadResult = await uploadWSI(selectedFile);
      const nextJobId = uploadResult.jobId;
      setJobId(nextJobId);
      setJobIdInput(nextJobId);
      setUploadPanelState("collapsed");
      await startPolling(nextJobId);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();

    // Live mode uses backend stage; manual wheel switch is disabled while polling.
    if (isPolling || isAnimatingRef.current) return;

    const delta = event.deltaY;
    if (Math.abs(delta) < 8) return;

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
    { scope: wrapperRef }
  );

  const progressPercent = Math.max(0, Math.min(100, progress * 100));
  const showUploadPanel = activeStage.id === "uploaded";

  return (
    <main
      ref={wrapperRef}
      className="h-screen w-screen overflow-hidden bg-blue-100 px-5 pb-6 pt-24 md:px-10 md:pb-8 md:pt-28"
    >
      <div className="mx-auto h-full w-full max-w-[1600px]">
        <div className="mb-5 flex items-end justify-between md:mb-7">
          <div>
            <p className="font-general text-xs uppercase tracking-widest text-black/60">
              PathoInsight Demo
            </p>
            <h1 className="font-zentry text-4xl uppercase text-black md:text-6xl">
              Workflow Scrollytelling
            </h1>
          </div>
          <Link
            to="/"
            className="rounded-full border border-black/20 px-5 py-2 font-general text-xs uppercase text-black transition hover:bg-black hover:text-blue-100"
          >
            Back Home
          </Link>
        </div>

        <div className="flex h-[calc(100%-5rem)] flex-col gap-6 md:flex-row md:gap-8">
          <aside className="flex h-full md:w-[30%] md:min-w-[320px] md:max-w-[480px] md:items-center">
            <div className="w-full rounded-2xl border border-black/15 bg-white/90 p-6 shadow-[0_12px_50px_rgba(1,1,1,0.08)] md:p-7">
              <p className="font-general text-xs uppercase tracking-wider text-black/50">
                Current Stage
              </p>
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
                      disabled={isPolling}
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

              {error && (
                <p className="mt-3 rounded border border-red-300 bg-red-50 px-2 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}
            </div>
          </aside>

          <section onWheel={handleWheel} className="relative flex h-full flex-col gap-3 md:w-[70%]">
            <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full bg-black/75 px-3 py-1 font-general text-[10px] uppercase tracking-wider text-blue-100">
              {isPolling ? "live stage from backend" : "scroll to switch stage"}
            </div>

            {showUploadPanel && (
              <div className="z-30 rounded-xl border border-black/15 bg-white/90 shadow-[0_12px_40px_rgba(1,1,1,0.12)] backdrop-blur">
                <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                  <p className="font-general text-[10px] uppercase tracking-wider text-black/65">
                    Upload & Live Control
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadPanelState((prev) =>
                        prev === "collapsed" ? "expanded" : "collapsed"
                      )
                    }
                    className="rounded border border-black/20 px-2 py-1 text-[10px] uppercase text-black"
                  >
                    {uploadPanelState === "collapsed" ? "Expand" : "Minimize"}
                  </button>
                </div>

                {uploadPanelState === "expanded" ? (
                  <div className="space-y-3 p-4">
                    <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <input
                        type="file"
                        onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                        className="w-full rounded border border-black/20 bg-white px-3 py-2 text-xs text-black"
                      />
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="rounded bg-black px-4 py-2 text-xs uppercase text-white disabled:opacity-50"
                      >
                        {isUploading ? "Uploading..." : "Upload WSI"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={jobIdInput}
                        onChange={(event) => setJobIdInput(event.target.value)}
                        placeholder="Optional: resume by jobId"
                        className="min-w-0 flex-1 rounded border border-black/20 bg-white px-3 py-2 text-xs text-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const value = jobIdInput.trim();
                          setJobId(value);
                          startPolling(value);
                        }}
                        className="rounded bg-yellow-300 px-3 py-2 text-xs font-semibold uppercase text-black"
                      >
                        Resume
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-black/60">
                        Upload requires only one WSI file. Other data is generated by backend stages.
                      </p>
                      <button
                        type="button"
                        onClick={stopPolling}
                        disabled={!isPolling}
                        className="rounded border border-black/25 px-3 py-2 text-[10px] uppercase text-black disabled:opacity-40"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2 text-[11px] text-black/60">
                    {isPolling
                      ? `Live mode running${jobId ? ` (jobId: ${jobId})` : ""}`
                      : "Panel minimized. Click Expand to continue."}
                  </div>
                )}
              </div>
            )}

            <div ref={stageCardRef} className={showUploadPanel ? "h-[calc(100%-8.5rem)]" : "h-full"}>
              <StagePanel stage={activeStage} result={result} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default WorkflowPage;
