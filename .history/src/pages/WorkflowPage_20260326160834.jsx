import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

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

const DEMO = {
  classification: { label: "Tumor", confidence: 0.93 },
  topPatch: {
    img: "/img/patho-swordman.jpg",
    score: 0.98,
    report: "High-risk epithelial atypia with dense nuclear crowding.",
  },
  similarCases: [
    { patchImg: "/img/patho-contact-1.jpg", similarity: 0.91 },
    { patchImg: "/img/patho-contact-2.jpg", similarity: 0.88 },
  ],
  finalReport:
    "PathoInsight suggests malignant potential with high confidence. Recommend correlation with immunohistochemistry and clinical context for final confirmation.",
};

const StageSection = ({ stage }) => {
  const isPatchStep = stage.id === "patching";
  const isClassifyStep = stage.id === "classifying";
  const isScoreStep = stage.id === "patch_scoring";
  const isRetrieveStep = stage.id === "retrieving_similar";
  const isGenerateStep = stage.id === "generating_report";
  const isDoneStep = stage.id === "done";

  return (
    <section className="workflow-step relative min-h-[88vh] w-full" data-stage={stage.id}>
      <div
        data-stage-card
        className="relative overflow-hidden rounded-2xl border border-white/30 bg-black text-blue-100 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
      >
        <div className="relative h-[28rem] overflow-hidden md:h-[34rem]">
          <img
            data-image-parallax
            src={stage.image}
            alt={stage.title}
            className="h-full w-full scale-110 object-cover"
          />
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
              <div
                data-scan-line
                className="absolute bottom-0 top-0 w-1 bg-yellow-300/90 shadow-[0_0_20px_rgba(237,255,102,0.8)]"
              />
            </>
          )}

          {isClassifyStep && (
            <div className="absolute right-5 top-5 rounded-full bg-yellow-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-black">
              {DEMO.classification.label} • {(DEMO.classification.confidence * 100).toFixed(1)}%
            </div>
          )}

          {isScoreStep && (
            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
              {[0.98, 0.95, 0.92, 0.89].map((score, index) => (
                <div
                  key={score}
                  className={`rounded-md border px-3 py-2 text-xs ${
                    index === 0
                      ? "border-yellow-300 bg-yellow-300/20 text-yellow-100"
                      : "border-white/20 bg-black/50 text-blue-100"
                  }`}
                >
                  patch_{index + 1} score: {score.toFixed(2)}
                </div>
              ))}
            </div>
          )}

          {isRetrieveStep && (
            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
              {DEMO.similarCases.map((item, idx) => (
                <div key={idx} className="rounded-md border border-white/20 bg-black/55 p-2">
                  <img src={item.patchImg} alt={`similar-${idx}`} className="h-20 w-full rounded object-cover" />
                  <p className="mt-2 text-xs text-blue-100/90">similarity: {item.similarity.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 px-5 py-6 md:px-7">
          <h3 className="font-zentry text-4xl uppercase leading-none md:text-5xl">{stage.title}</h3>
          <p className="font-circular-web text-sm text-blue-100/75 md:text-base">{stage.subtitle}</p>

          {isGenerateStep && (
            <div className="rounded-lg border border-white/20 bg-white/5 p-4">
              <p className="text-xs uppercase text-yellow-300">Input To Qwen</p>
              <p className="mt-2 text-sm text-blue-100/90">
                Type: {DEMO.classification.label} | Top patch score: {DEMO.topPatch.score.toFixed(2)} | Evidence report included
              </p>
            </div>
          )}

          {isDoneStep && (
            <div className="rounded-lg border border-yellow-300/70 bg-yellow-300/10 p-4">
              <p className="text-xs uppercase text-yellow-300">Final Report</p>
              <p className="mt-2 text-sm text-blue-100/90">{DEMO.finalReport}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

function WorkflowPage() {
  const wrapperRef = useRef(null);
  const labelRef = useRef(null);
  const [activeStage, setActiveStage] = useState(STAGES[0].id);

  useGSAP(
    () => {
      const steps = gsap.utils.toArray(".workflow-step");

      steps.forEach((step, index) => {
        const card = step.querySelector("[data-stage-card]");
        const visual = step.querySelector("[data-image-parallax]");

        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 80, scale: 0.98 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: step,
              start: "top 80%",
              end: "top 35%",
              scrub: false,
              onEnter: () => setActiveStage(STAGES[index].id),
              onEnterBack: () => setActiveStage(STAGES[index].id),
            },
          }
        );

        gsap.to(visual, {
          yPercent: -10,
          ease: "none",
          scrollTrigger: {
            trigger: step,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

        const scanLine = step.querySelector("[data-scan-line]");
        if (scanLine) {
          gsap.fromTo(
            scanLine,
            { x: 0 },
            {
              x: "100%",
              duration: 2,
              ease: "none",
              repeat: -1,
              yoyo: true,
            }
          );
        }
      });
    },
    { scope: wrapperRef }
  );

  useGSAP(
    () => {
      gsap.fromTo(
        labelRef.current,
        { autoAlpha: 1 },
        {
          autoAlpha: 0.2,
          duration: 0.2,
          repeat: 3,
          yoyo: true,
          ease: "power1.inOut",
        }
      );
    },
    { dependencies: [activeStage], scope: wrapperRef }
  );

  const activeIndex = STAGES.findIndex((item) => item.id === activeStage);
  const progress = ((activeIndex + 1) / STAGES.length) * 100;

  return (
    <main ref={wrapperRef} className="min-h-screen w-screen overflow-x-hidden bg-blue-100 px-6 py-10 md:px-10">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-general text-xs uppercase tracking-widest text-black/60">PathoInsight Demo</p>
            <h1 className="font-zentry text-5xl uppercase text-black md:text-7xl">Workflow Scrollytelling</h1>
          </div>
          <Link
            to="/"
            className="rounded-full border border-black/20 px-5 py-2 font-general text-xs uppercase text-black transition hover:bg-black hover:text-blue-100"
          >
            Back Home
          </Link>
        </div>

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
          <aside className="md:sticky md:top-20 md:w-2/5">
            <div className="rounded-2xl border border-black/15 bg-white/90 p-6 shadow-[0_12px_50px_rgba(1,1,1,0.08)]">
              <p className="font-general text-xs uppercase tracking-wider text-black/50">Current Stage</p>
              <h2 ref={labelRef} className="mt-3 font-zentry text-4xl uppercase text-black md:text-5xl">
                {STAGES[activeIndex]?.title || "Uploaded"}
              </h2>
              <p className="mt-2 font-circular-web text-sm text-black/65">{STAGES[activeIndex]?.subtitle}</p>

              <div className="mt-5 h-2 rounded-full bg-black/10">
                <div className="h-full rounded-full bg-black transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-5 space-y-2">
                {STAGES.map((item, idx) => {
                  const isActive = item.id === activeStage;
                  const isDone = idx <= activeIndex;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs uppercase transition ${
                        isActive
                          ? "border-black bg-black text-blue-100"
                          : isDone
                          ? "border-black/25 bg-black/5 text-black"
                          : "border-black/10 bg-transparent text-black/40"
                      }`}
                    >
                      <span>{item.id.replaceAll("_", " ")}</span>
                      <span>{String(idx + 1).padStart(2, "0")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="md:w-3/5">
            <div className="space-y-14">
              {STAGES.map((stage) => (
                <StageSection key={stage.id} stage={stage} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WorkflowPage;
