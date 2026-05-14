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
        start: "center center",
        end: "+=800 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });

    clipAnimation.to(".mask-clip-path", {
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
    });
  });

  return (
    <div id="about" className="min-h-screen w-screen">
      <div className="relative mb-8 mt-36 flex flex-col items-center gap-5">
        <p className="font-general text-sm uppercase md:text-[10px]">
          欢迎来到 PathoInsight
        </p>

        <AnimatedTitle
          title="Path<b>o</b>Insight <br /> intelligent pathology <b>a</b>ssistant"
          containerClass="mt-5 !text-black text-center"
        />

        <div className="about-subtext">
          <p>
            目标：构建面向临床的一体化病理智能辅助系统，将 WSI 上传、病理分类、切片分块、相似检索、
            报告生成与诊断复核串联为可追踪的闭环流程。
          </p>
          <p className="text-gray-600">
            方法：基于专家医生撰写的高质量病例与诊断报告进行学习，不只输出“结果”，
            更强调还原每一项结论背后的病理证据、关联特征与推理依据。
          </p>
          <p className="text-gray-500">
            价值：为医疗资源相对匮乏地区的医生与医疗机构提供可解释、可复核、可落地的辅助诊断能力，
            提升基层诊疗效率，推动医疗资源配置更加公平与合理。
          </p>
        </div>
      </div>

      <div className="h-dvh w-screen" id="clip">
        <div className="mask-clip-path about-image">
          <img
            src="img/patho-about.jpg"
            alt="Background"
            className="absolute left-0 top-0 size-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default About;
