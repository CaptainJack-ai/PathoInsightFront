import base64
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
MANUAL_PATH = BASE_DIR / "manual.txt"
SILICON_API_URL = "https://api.siliconflow.cn/v1/chat/completions"
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"
USE_EXTERNAL_LLM = os.getenv("ASSISTANT_USE_EXTERNAL", "").strip().lower() in {"1", "true", "yes", "on"}
# 前端部署地址：用于把 manual.txt 里的 {{BASE}} 替换成真实域名
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")

load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)


def load_manual() -> str:
    if not MANUAL_PATH.exists():
        return "PathoInsight 系统使用指南暂不可用。"
    text = MANUAL_PATH.read_text(encoding="utf-8")
    return text.replace("{{BASE}}", FRONTEND_BASE_URL)


def build_avatar_data_url() -> str:
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>"
        "<circle cx='64' cy='64' r='60' fill='#f6c358'/>"
        "<circle cx='46' cy='54' r='12' fill='#111'/>"
        "<circle cx='82' cy='54' r='12' fill='#111'/>"
        "<path d='M38 86 Q64 108 90 86' stroke='#111' stroke-width='5' fill='none' stroke-linecap='round'/>"
        "</svg>"
    )
    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


def manual_fallback_reply(message: str, manual_text: str) -> str:
    normalized_message = message.strip().lower()
    if not normalized_message:
        return "请先输入一个问题。"

    if "如何使用" in normalized_message:
        return (
            "打开 PathoInsight 前端页面后，右下角会出现 Raggy 鸭子。"
            "点击鸭子打开对话框，输入问题或点击常见问题即可提问。"
            "关闭对话框后鸭子会重新显示。"
        )

    paragraphs = [part.strip() for part in manual_text.split("\n\n") if part.strip()]
    for paragraph in paragraphs:
        if normalized_message in paragraph.lower():
            return paragraph

    tokens = [token for token in normalized_message.replace("？", " ").replace("?", " ").split() if len(token) > 1]
    for token in tokens:
        for line in manual_text.splitlines():
            if token in line.lower():
                return line.strip()

    return (
        "抱歉，我在本地知识库中没有找到明确答案。"
        "你可以试试这些常见问题：如何使用、哪里上传WSI、系统支持哪些癌种识别、需要提供什么文件、生成报告需要多久。"
    )


def call_assistant_api(message: str) -> str:
    manual_text = load_manual()
    api_key = os.getenv("SILICON_API_KEY")

    if not USE_EXTERNAL_LLM or not api_key:
        return manual_fallback_reply(message, manual_text)

    system_prompt = f"""
你是一个专业的 PathoInsight 系统使用助手，名叫 Raggy。
请严格基于以下知识库内容回答用户的问题，不要编造。
如果需要给出页面跳转，请使用 Markdown 链接格式 [显示文字](完整URL)。

知识库内容：
{manual_text}
""".strip()

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
        "temperature": 0.1,
        "max_tokens": 1000,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(SILICON_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        if choices:
            message_data = choices[0].get("message", {})
            content = message_data.get("content") or choices[0].get("text")
            if content:
                return content
        return manual_fallback_reply(message, manual_text)
    except Exception as exc:
        print(f"调用外部模型失败: {exc}")
        return manual_fallback_reply(message, manual_text)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})


@app.route("/api/avatar", methods=["GET"])
def avatar():
    return jsonify({"avatar_url": build_avatar_data_url()})


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    if not message:
        return jsonify({"error": "消息不能为空"}), 400
    return jsonify({"reply": call_assistant_api(message)})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    app.run(host="0.0.0.0", port=port, debug=False)
