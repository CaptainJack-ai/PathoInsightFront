import clsx from "clsx";
import gsap from "gsap";
import { Link, useLocation } from "react-router-dom";
import { useWindowScroll } from "react-use";
import { useEffect, useRef, useState } from "react";

import { ROUTE_PATHS } from "../routes/paths";

const navItems = [
  { label: "总览", href: "/#overview", type: "route" },
  { label: "切片处理", href: ROUTE_PATHS.SLICE_PROCESSING, type: "route" },
  { label: "工作流", href: ROUTE_PATHS.WORKFLOW, type: "route" },
  { label: "关于", href: "/#about", type: "route" },
  { label: "联系", href: "/#contact", type: "route" },
];

const NavBar = () => {
  const { pathname } = useLocation();
  const isWorkflowPage = pathname.startsWith(ROUTE_PATHS.WORKFLOW);

  // State for toggling audio and visual indicator
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);

  // Refs for audio and navigation container
  const audioElementRef = useRef(null);
  const navContainerRef = useRef(null);
  const topHoverTimeoutRef = useRef(null);

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
                <Link
                  key={index}
                  to={item.href}
                  className={clsx("nav-hover-btn", {
                    "!text-black after:!bg-black": isWorkflowPage,
                  })}
                >
                  {item.label}
                </Link>
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
          <div className="mt-2 rounded-xl border border-white/15 bg-black/90 p-2 text-white md:hidden">
            {navItems.map((item, index) => (
              <Link
                key={`mobile-${index}`}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm uppercase tracking-wide hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </div>
  );
};

export default NavBar;
