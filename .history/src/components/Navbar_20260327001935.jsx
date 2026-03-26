import clsx from "clsx";
import gsap from "gsap";
import { Link, useLocation } from "react-router-dom";
import { useWindowScroll } from "react-use";
import { useEffect, useRef, useState } from "react";
import { TiLocationArrow } from "react-icons/ti";

import Button from "./Button";
import { ROUTE_PATHS } from "../routes/paths";

const navItems = [
  { label: "总览", href: "/#overview", type: "route" },
  { label: "数据", href: "/#data", type: "route" },
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

  const { y: currentScrollY } = useWindowScroll();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isWorkflowNavVisible, setIsWorkflowNavVisible] = useState(true);
  const [isTopHoverActive, setIsTopHoverActive] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

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
    const onMouseMove = (event) => {
      setIsTopHoverActive(event.clientY <= 24);
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => {
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
    const visible = isTopHoverActive || (isWorkflowPage ? isWorkflowNavVisible : isNavVisible);

    gsap.to(navContainerRef.current, {
      y: visible ? 0 : -100,
      opacity: visible ? 1 : 0,
      duration: 0.2,
    });
  }, [isNavVisible, isWorkflowNavVisible, isWorkflowPage, isTopHoverActive]);

  return (
    <div
      ref={navContainerRef}
      className="fixed inset-x-0 top-4 z-50 h-16 border-none transition-all duration-700 sm:inset-x-6"
    >
      <header className="absolute top-1/2 w-full -translate-y-1/2">
        <nav className="flex size-full items-center justify-between p-4">
          {/* Logo and Product button */}
          <div className="flex items-center gap-7">
            <img src="/img/logo.png" alt="logo" className="w-10" />

            <Button
              id="product-button"
              title="模块"
              rightIcon={<TiLocationArrow />}
              containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
            />
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
              onClick={toggleAudioIndicator}
              className="ml-10 flex items-center space-x-0.5"
            >
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
      </header>
    </div>
  );
};

export default NavBar;
