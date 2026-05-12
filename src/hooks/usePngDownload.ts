import { useState, useRef } from "react";

export type DownloadSize = "square" | "mobile";

const SKETCH_FONT_URL = "https://cdn.jsdelivr.net/gh/projectnoonnu/2601-4@1.1/RFjunwooo.woff2";
let sketchFontCSSCache: string | null = null;

async function loadSketchFontCSS(): Promise<string> {
  if (sketchFontCSSCache) return sketchFontCSSCache;
  const blob = await fetch(SKETCH_FONT_URL).then((r) => r.blob());
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  sketchFontCSSCache = `@font-face { font-family: "RoughlyWrittenJunwoo"; src: url("${dataUrl}") format("woff2"); }`;
  return sketchFontCSSCache;
}

async function captureAsPng(container: HTMLDivElement, captureColor: string): Promise<string> {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("SVG not found");

  const fontCSS = await loadSketchFontCSS();
  const { width, height } = container.getBoundingClientRect();
  const pw = Math.round(width * 2);
  const ph = Math.round(height * 2);

  const svgClone = svg.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute("width", String(pw));
  svgClone.setAttribute("height", String(ph));

  // SVG 안에 스케치 폰트 embed
  let defs = svgClone.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgClone.insertBefore(defs, svgClone.firstChild);
  }
  const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleEl.textContent = fontCSS;
  defs.appendChild(styleEl);

  // CSS 변수로 채워진 fill을 실제 색상으로 교체
  svgClone.querySelectorAll("[data-bg-fill]").forEach((el) => {
    el.setAttribute("fill", captureColor);
  });

  const svgStr = new XMLSerializer().serializeToString(svgClone);
  const url = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" }));

  const canvas = document.createElement("canvas");
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = captureColor;
  ctx.fillRect(0, 0, pw, ph);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, pw, ph);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG 렌더링 실패"));
    };
    img.src = url;
  });
}

function composeMobileCanvas(squareDataUrl: string, bgColor: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = Math.round(w * (16 / 9));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, Math.round((h - w) / 2), w, w);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = squareDataUrl;
  });
}

export function usePngDownload(bgColor: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  async function download(size: DownloadSize, removeBackground: boolean) {
    if (!targetRef.current || isDownloading) return;
    setIsDownloading(true);

    const captureColor = removeBackground ? "#ffffff" : bgColor;

    try {
      const date = new Date().toISOString().slice(0, 10);
      const squareDataUrl = await captureAsPng(targetRef.current, captureColor);
      const finalDataUrl =
        size === "mobile" ? await composeMobileCanvas(squareDataUrl, captureColor) : squareDataUrl;
      const link = document.createElement("a");
      link.download = `dayframe-${date}.png`;
      link.href = finalDataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

  return { isDownloading, targetRef, download };
}
