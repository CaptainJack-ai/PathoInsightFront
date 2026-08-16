import { useCallback, useEffect, useRef, useState } from "react";

import "./RaggyAssistant.css";

// 助手后端地址：本地默认 8001，生产通过 VITE_ASSISTANT_API_BASE 注入
const API_BASE = (import.meta.env.VITE_ASSISTANT_API_BASE || "http://127.0.0.1:8001").replace(/\/$/, "");

const DUCK_WEBM = "/videos/raggy-duck.webm";
const DUCK_MP4 = "/videos/raggy-duck.mp4";

const FAQ_ITEMS = [
  "如何使用？",
  "系统支持哪些癌种识别？",
  "需要提供什么文件？",
  "生成报告需要多久？",
];

// ---------- 绿幕抠图（HSV）----------
function chromaKey(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const MIN_H = 55;
  const MAX_H = 145;
  const MIN_S = 0.15;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : delta / max;
    const greenDominance = g - Math.max(r, b);

    const isGreen = h >= MIN_H && h <= MAX_H && s >= MIN_S && greenDominance > 22 && g > 110;

    data[i + 3] = isGreen ? 0 : 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

// ---------- 边缘柔化（默认不启用）----------
function featherEdges(ctx, width, height, radius = 7) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = data[i * 4 + 3];
  }
  const originalAlpha = new Uint8Array(alpha);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (originalAlpha[idx] === 0) continue;

      let edge = false;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (originalAlpha[ny * width + nx] === 0) {
              edge = true;
              break;
            }
          }
        }
        if (edge) break;
      }
      if (edge) {
        data[idx * 4 + 3] = 200;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// 把 Markdown 链接 [text](url) 渲染为 <a>
const renderInlineLinks = (content) => {
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) {
      return (
        <a
          key={i}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#2c3e50", textDecoration: "underline" }}
        >
          {m[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const RaggyAssistant = () => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [duckFailed, setDuckFailed] = useState(false);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const messagesRef = useRef(null);
  const animIdRef = useRef(null);

  // 初始化鸭子视频 + 动画（含绿幕抠图）
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let useAlpha = false;

    const drawFrame = () => {
      if (!video.paused && !video.ended) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (!useAlpha) chromaKey(ctx, canvas.width, canvas.height);
      }
      animIdRef.current = requestAnimationFrame(drawFrame);
    };

    const onError = () => {
      if (video.src !== DUCK_MP4) {
        video.src = DUCK_MP4;
        video.load();
        return;
      }
      setDuckFailed(true);
    };

    const onMetadata = () => {
      useAlpha = video.currentSrc.includes(".webm");
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;
      const targetHeight = 150;
      const targetWidth = (vw / vh) * targetHeight;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;
      video.play().catch(() => {});
      drawFrame();
    };

    video.src = DUCK_WEBM;
    video.addEventListener("error", onError);
    video.addEventListener("loadedmetadata", onMetadata);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      video.removeEventListener("error", onError);
      video.removeEventListener("loadedmetadata", onMetadata);
    };
  }, []);

  // 加载头像
  useEffect(() => {
    fetch(`${API_BASE}/api/avatar`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("avatar failed"))))
      .then((data) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      })
      .catch(() => {});
  }, []);

  // 欢迎消息（仅一次）
  useEffect(() => {
    setMessages([{ role: "assistant", content: "你好！我是PathoInsight小助手，有什么可以帮你的吗？" }]);
  }, []);

  // 消息变化时滚动到底部
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (preset) => {
      const message = (preset ?? inputValue).trim();
      if (!message || isLoading) return;
      setInputValue("");
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setIsLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify({ message }),
        });
        if (!res.ok) throw new Error("请求失败");
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，服务暂时不可用，请稍后再试。" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading]
  );

  const toggleDialog = () => {
    setDialogVisible((prev) => {
      const next = !prev;
      if (!next) {
        // 关闭对话框时恢复鸭子动画
        const video = videoRef.current;
        if (video && video.paused) video.play().catch(() => {});
      }
      return next;
    });
  };

  return (
    <>
      {/* 聊天对话框 */}
      <div
        className={`patho-assistant-dialog${dialogVisible ? "" : " hidden"}`}
        aria-hidden={!dialogVisible}
      >
        <div className="dialog-header">
          <div className="avatar-icon">
            {avatarUrl ? (
              <img src={avatarUrl} alt="助手" style={{ width: 36, height: 36, objectFit: "cover" }} />
            ) : (
              <span>🩺</span>
            )}
          </div>
          <div className="title">PathoInsight 小助手</div>
          <button type="button" className="close-btn" onClick={toggleDialog} aria-label="关闭">
            ✖
          </button>
        </div>

        <div className="dialog-messages" ref={messagesRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              {renderInlineLinks(msg.content)}
            </div>
          ))}
          {isLoading && <div className="message assistant">思考中...</div>}
        </div>

        <div className="faq-bar">
          <span className="faq-label">常见问题：</span>
          {FAQ_ITEMS.map((q) => (
            <span key={q} className="faq-item" onClick={() => sendMessage(q)}>
              {q}
            </span>
          ))}
        </div>

        <div className="dialog-input-area">
          <input
            type="text"
            value={inputValue}
            placeholder="输入你的问题..."
            autoComplete="off"
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button type="button" onClick={() => sendMessage()}>
            发送
          </button>
        </div>
      </div>

      {/* 右下角悬浮鸭子按钮 */}
      <div
        className="patho-assistant-float-btn"
        style={{ display: dialogVisible ? "none" : "flex" }}
        onClick={toggleDialog}
        role="button"
        aria-label="打开 PathoInsight 小助手"
      >
        <div className="tooltip-bubble">我是Raggy！点我询问任何问题！</div>
        {duckFailed ? (
          <span style={{ fontSize: 64 }}>🦆</span>
        ) : (
          <canvas id="duck-canvas" ref={canvasRef} />
        )}
        <video ref={videoRef} loop muted playsInline style={{ display: "none" }} />
      </div>
    </>
  );
};

export default RaggyAssistant;
