import { useState, useRef } from "react";
import { toPng } from "html-to-image";

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

  async function download(size: DownloadSize) {
    if (!targetRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const fontEmbedCSS = await loadSketchFontCSS();
      const squareDataUrl = await toPng(targetRef.current, {
        pixelRatio: 2,
        backgroundColor: bgColor,
        fontEmbedCSS,
      });
      const finalDataUrl =
        size === "mobile" ? await composeMobileCanvas(squareDataUrl, bgColor) : squareDataUrl;
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
