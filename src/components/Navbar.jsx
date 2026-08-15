import clsx from "clsx";
import gsap from "gsap";
import { useLocation, useNavigate } from "react-router-dom";
import { useWindowScroll } from "react-use";
import { useEffect, useRef, useState } from "react";

import { ROUTE_PATHS } from "../routes/paths";

const navItems = [
  { label: "总览", type: "section", sectionId: "overview" },
  { label: "切片处理", type: "route", href: ROUTE_PATHS.SLICE_PROCESSING },
  { label: "流程图", type: "route", href: ROUTE_PATHS.AI_DIAGRAM },
  { label: "工作流", type: "route", href: ROUTE_PATHS.WORKFLOW },
  { label: "联系", type: "section", sectionId: "contact" },
];

const NavBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isWorkflowPage = pathname.startsWith(ROUTE_PATHS.WORKFLOW);

  // State for toggling audio and visual indicator
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);

  // Refs for audio and navigation container
  const audioElementRef = useRef(null);
  const navContainerRef = useRef(null);
  const topHoverTimeoutRef = useRef(null);
  const pendingSectionRef = useRef("");

  const { y: currentScrollY } = useWindowScroll();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isWorkflowNavVisible, setIsWorkflowNavVisible] = useState(true);
  const [isTopHoverActive, setIsTopHoverActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navVisible =
    isMobileMenuOpen || isTopHoverActive || (isWorkflowPage ? isWorkflowNavVisible : isNavVisible);

  // Toggle audio and visual indicator
  const toggleAudioIndicator = () => {
    setIsAudioPlaying((prev) => !prev);
    setIsIndicatorActive((prev) => !prev);
  };

  // Manage audio playback
  useEffect(() => {
    if (isAudioPlaying) {
      audioElementRef.current.play();
    } else {
      audioElementRef.current.pause();
    }
  }, [isAudioPlaying]);

  useEffect(() => {
    if (isWorkflowPage) return;

    if (currentScrollY === 0) {
      setIsNavVisible(true);
    } else if (currentScrollY > lastScrollY) {
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY) {
      setIsNavVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [currentScrollY, isWorkflowPage, lastScrollY]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const scrollToSection = (sectionId) => {
    const maxRetries = 24;
    let retries = 0;

    const tryScroll = () => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `/#${sectionId}`);
        return;
      }

      if (retries < maxRetries) {
        retries += 1;
        window.setTimeout(tryScroll, 70);
      }
    };

    tryScroll();
  };

  const handleNavItemClick = (item) => {
    setIsMobileMenuOpen(false);

    if (item.type === "route") {
      navigate(item.href);
      return;
    }

    const sectionId = item.sectionId;
    if (!sectionId) return;

    if (pathname === ROUTE_PATHS.HOME) {
      scrollToSection(sectionId);
      return;
    }

    pendingSectionRef.current = sectionId;
    navigate(ROUTE_PATHS.HOME);
  };

  useEffect(() => {
    if (pathname !== ROUTE_PATHS.HOME || !pendingSectionRef.current) return;

    const target = pendingSectionRef.current;
    pendingSectionRef.current = "";
    scrollToSection(target);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onMouseMove = (event) => {
      if (event.clientY <= 24) {
        if (topHoverTimeoutRef.current) {
          window.clearTimeout(topHoverTimeoutRef.current);
          topHoverTimeoutRef.current = null;
        }
        setIsTopHoverActive(true);
        return;
      }

      if (topHoverTimeoutRef.current) return;

      topHoverTimeoutRef.current = window.setTimeout(() => {
        setIsTopHoverActive(false);
        topHoverTimeoutRef.current = null;
      }, 3000);
    };

    const canUseHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canUseHover) {
      setIsTopHoverActive(false);
      return;
    }

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      if (topHoverTimeoutRef.current) {
        window.clearTimeout(topHoverTimeoutRef.current);
      }
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useEffect(() => {
    if (!isWorkflowPage) {
      setIsWorkflowNavVisible(true);
      return;
    }

    const onWorkflowNavVisibility = (event) => {
      const visible = Boolean(event?.detail?.visible);
      setIsWorkflowNavVisible(visible);
    };

    window.addEventListener("workflow-nav-visibility", onWorkflowNavVisibility);

    return () => {
      window.removeEventListener("workflow-nav-visibility", onWorkflowNavVisibility);
    };
  }, [isWorkflowPage]);

  useEffect(() => {
    gsap.to(navContainerRef.current, {
      y: navVisible ? 0 : -100,
      opacity: navVisible ? 1 : 0,
      duration: 0.2,
    });
  }, [navVisible]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("app-nav-visibility", {
        detail: { visible: navVisible },
      })
    );
  }, [navVisible]);

  return (
    <div
      ref={navContainerRef}
      className="fixed inset-x-2 top-2 z-50 h-14 border-none transition-all duration-700 sm:inset-x-6 sm:top-4 sm:h-16"
    >
      <header className="absolute top-1/2 w-full -translate-y-1/2">
        <nav className="flex size-full items-center justify-between p-3 sm:p-4">
          <div className="flex items-center">
            <img src="/img/logo.png" alt="logo" className="w-8 sm:w-10" />
            <div className="ml-2 text-sm font-bold text-white sm:text-lg">PathoInsight</div>
          </div>
         

          {/* Navigation Links and Audio Button */}
          <div className="flex h-full items-center">
            <div className="hidden md:block">
              {navItems.map((item, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => handleNavItemClick(item)}
                  className={clsx("nav-hover-btn", {
                    "!text-black after:!bg-black": isWorkflowPage,
                  })}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/25 bg-black/30 text-white md:hidden"
              aria-label={isMobileMenuOpen ? "关闭导航菜单" : "打开导航菜单"}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className="text-lg leading-none">{isMobileMenuOpen ? "×" : "☰"}</span>
            </button>

            <button onClick={toggleAudioIndicator} className="ml-4 flex items-center space-x-0.5 sm:ml-10">
              <audio
                ref={audioElementRef}
                className="hidden"
                src="/audio/loop.mp3"
                loop
              />
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={clsx("indicator-line", {
                    active: isIndicatorActive,
                    "!bg-black": isWorkflowPage,
                  })}
                  style={{
                    animationDelay: `${bar * 0.1}s`,
                  }}
                />
              ))}
            </button>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-sky-200/25 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.24),transparent_42%),radial-gradient(circle_at_95%_100%,rgba(14,165,233,0.2),transparent_42%),rgba(2,6,23,0.92)] p-3 text-white shadow-[0_18px_48px_rgba(2,6,23,0.56)] backdrop-blur-md md:hidden">
            <p className="px-1 pb-2 font-general text-[10px] uppercase tracking-[0.24em] text-sky-100/70">
              Navigation
            </p>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item, index) => (
                <button
                  type="button"
                  key={`mobile-${index}`}
                  onClick={() => handleNavItemClick(item)}
                  className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-3 text-left font-general text-xs uppercase tracking-[0.14em] text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/60 hover:bg-sky-400/10"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-circular-web text-[11px] text-sky-50/75">
              联系将定位到首页底部的「联系 PathoInsight」区域。
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default NavBar;
