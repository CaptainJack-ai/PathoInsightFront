import AnimatedTitle from "./AnimatedTitle";

const About = () => {
  return (
    <div id="about" className="w-screen bg-blue-50 py-20 md:py-28">
      <div className="container mx-auto px-5 md:px-10">
        <p className="font-general text-sm uppercase tracking-wider text-black/70 md:text-[11px]">
          关于 PathoInsight
        </p>

        <AnimatedTitle
          title="Path<b>o</b>Insight <br /> intelligent pathology <b>a</b>ssistant"
          containerClass="mt-5 !text-black text-left"
        />

        <div className="mt-12 grid items-start gap-8 md:mt-14 md:grid-cols-[1.05fr_1fr] md:gap-10">
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
            <img
              src="img/patho-about.jpg"
              alt="Pathology team and workflow"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/88 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:p-8">
            <h3 className="font-general text-xl font-semibold text-black md:text-2xl">我们的目标</h3>
            <p className="mt-3 text-base leading-relaxed text-black/85 md:text-lg">
              通过构建从 WSI 上传、病理分类、切片分块、相似检索到报告生成与诊断完成的六阶段流程，
              将病理分析从“黑盒结果”升级为“可追踪过程”，帮助医生在更短时间内获得稳定、可复核的辅助结论。
            </p>

            <h3 className="mt-7 font-general text-xl font-semibold text-black md:text-2xl">我们的理念</h3>
            <p className="mt-3 text-base leading-relaxed text-black/75 md:text-lg">
              以专家医生撰写的高质量病例与诊断报告为基础，模型不仅输出最终判断，
              还同步呈现结论背后的病理证据与原因链路，让每一步都可解释。
              这套能力将重点服务医疗资源相对匮乏地区的医生与医疗机构，
              提升辅助诊断可及性，推动医疗资源配置更加公平、更加合理。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
