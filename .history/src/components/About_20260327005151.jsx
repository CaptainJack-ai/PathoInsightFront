import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";

import AnimatedTitle from "./AnimatedTitle";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "top center",
        end: "+=700 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });

    clipAnimation
      .fromTo(
        ".mask-clip-path",
        {
          clipPath: "polygon(8% 0, 94% 4%, 88% 100%, 4% 96%)",
          borderRadius: "24px",
          scale: 0.92,
        },
        {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          borderRadius: "8px",
          scale: 1,
          ease: "power2.out",
        }
      )
      .fromTo(
        ".about-copy",
        { autoAlpha: 0.75, y: 24 },
        { autoAlpha: 1, y: 0, ease: "power2.out" },
        0.05
      );
  });

  return (
    <div id="about" className="min-h-screen w-screen">
      <div className="relative mb-8 mt-24 flex flex-col items-center gap-5 md:mt-28">
        <p className="font-general text-sm uppercase md:text-[10px]">
          欢迎来到 PathoInsight
        </p>

        <AnimatedTitle
          title="Path<b>o</b>Insight <br /> intelligent pathology <b>a</b>ssistant"
          containerClass="mt-5 !text-black text-center"
        />
      </div>

      <div className="h-dvh w-screen px-5 pb-10 md:px-10" id="clip">
        <div className="mx-auto grid h-full w-full max-w-7xl grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative h-[56vh] overflow-hidden rounded-3xl md:h-[70vh]">
            <div className="mask-clip-path absolute inset-0">
              <img
                src="img/patho-about.jpg"
                alt="Pathology diagnostic workflow"
                className="absolute left-0 top-0 size-full object-cover"
              />
            </div>
          </div>

          <div className="about-copy rounded-3xl bg-white/65 p-6 text-black backdrop-blur-sm md:p-8">
            <h3 className="font-zentry text-3xl uppercase leading-none md:text-4xl">
              目标与理念
            </h3>
            <p className="mt-4 text-base leading-relaxed text-black/90 md:text-lg">
              我们的目标是把病理诊断从“只给结果”升级为“结果 + 证据 + 成因”的完整决策支持。
              通过解析高质量数据集，包括专家医生撰写的病例记录与诊断报告，系统能够回溯诊断依据，
              明确关键病理特征与推断链路。
            </p>
            <p className="mt-4 text-base leading-relaxed text-black/75 md:text-lg">
              在应用层面，PathoInsight 致力于服务医疗资源相对匮乏地区，为基层医生与医疗机构提供稳定、
              可解释的辅助诊断能力，减少经验差异带来的误差，推动医疗资源分配更加公平与合理。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
