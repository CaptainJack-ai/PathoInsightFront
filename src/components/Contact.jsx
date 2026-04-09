import AnimatedTitle from "./AnimatedTitle";
import Button from "./Button";

const ImageClipBox = ({ src, clipClass }) => (
  <div className={clipClass}>
    <img src={src} />
  </div>
);

const Contact = () => {
  return (
    <div id="contact" className="my-12 min-h-96 w-full px-4 sm:my-16 sm:px-6 md:my-20 md:px-10">
      <div className="relative rounded-lg bg-black py-16 text-blue-50 sm:overflow-hidden sm:py-24">
        <div className="absolute -left-20 top-0 hidden h-full w-72 overflow-hidden sm:block lg:left-20 lg:w-96">
          <ImageClipBox
            src="/img/patho-contact-1.webp"
            clipClass="contact-clip-path-1"
          />
          <ImageClipBox
            src="/img/patho-contact-2.webp"
            clipClass="contact-clip-path-2 lg:translate-y-40 translate-y-60"
          />
        </div>

        <div className="absolute -top-40 left-20 hidden w-60 sm:top-1/2 sm:block md:left-auto md:right-10 lg:top-20 lg:w-80">
          <ImageClipBox
            src="/img/patho-swordman.webp"
            clipClass="absolute md:scale-125"
          />
          <ImageClipBox
            src="/img/patho-swordman.webp"
            clipClass="sword-man-clip-path md:scale-125"
          />
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="mb-10 font-general text-[10px] uppercase">
            联系 PathoInsight
          </p>

          <AnimatedTitle
            title="let&#39;s b<b>u</b>ild <br /> trusted ai for <br /> p<b>a</b>th<b>o</b>logy."
            containerClass="special-font w-full font-zentry !text-4xl !font-black !leading-[.9] sm:!text-5xl md:!text-[6.2rem]"
          />

          <Button title="联系我们" containerClass="mt-10 cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

export default Contact;
