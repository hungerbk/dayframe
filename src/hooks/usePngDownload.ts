import { useState, useRef } from "react";
import { CX, CY, OUTER_R } from "@/components/timetable/svgUtils";

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

async function captureAsPng(container: HTMLDivElement, captureColor: string, isSketch: boolean, transparent: boolean): Promise<string> {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("SVG not found");

  const { width, height } = container.getBoundingClientRect();
  const pw = Math.round(width * 2);
  const ph = Math.round(height * 2);

  const svgClone = svg.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute("width", String(pw));
  svgClone.setAttribute("height", String(ph));

  // 스케치 모드일 때만 폰트 embed
  if (isSketch) {
    const fontCSS = await loadSketchFontCSS();
    let defs = svgClone.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgClone.insertBefore(defs, svgClone.firstChild);
    }
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = fontCSS;
    defs.appendChild(styleEl);
  }

  // CSS 변수로 채워진 fill을 실제 색상으로 교체 (배경 제거 시 none으로 처리)
  svgClone.querySelectorAll("[data-bg-fill]").forEach((el) => {
    el.setAttribute("fill", transparent ? "none" : captureColor);
  });

  // 배경 제거 + 도넛 모드: 외곽 원 배경을 도넛 모양으로 클리핑해 중심을 투명하게 만든다
  if (transparent) {
    const donutHoleEl = svgClone.querySelector("circle[data-bg-fill]") as SVGCircleElement | null;
    if (donutHoleEl) {
      const innerR = parseFloat(donutHoleEl.getAttribute("r") || "0");
      if (innerR > 0) {
        const cx = parseFloat(donutHoleEl.getAttribute("cx") || String(CX));
        const cy = parseFloat(donutHoleEl.getAttribute("cy") || String(CY));
        const outerEl = svgClone.querySelector("[data-outer-circle]") as SVGCircleElement | null;
        const outerR = parseFloat((outerEl?.getAttribute("r")) || String(OUTER_R));

        let defs = svgClone.querySelector("defs");
        if (!defs) {
          defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          svgClone.insertBefore(defs, svgClone.firstChild);
        }

        // evenodd 규칙으로 바깥 원에서 안쪽 구멍을 뚫는 clipPath
        const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clipPath.setAttribute("id", "donut-bg-clip");
        const clipShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
        clipShape.setAttribute("clip-rule", "evenodd");
        clipShape.setAttribute(
          "d",
          `M ${cx - outerR},${cy} a ${outerR},${outerR} 0 1,0 ${2 * outerR},0 a ${outerR},${outerR} 0 1,0 ${-2 * outerR},0 ` +
            `M ${cx - innerR},${cy} a ${innerR},${innerR} 0 1,0 ${2 * innerR},0 a ${innerR},${innerR} 0 1,0 ${-2 * innerR},0`,
        );
        clipPath.appendChild(clipShape);
        defs.appendChild(clipPath);

        if (outerEl) outerEl.setAttribute("clip-path", "url(#donut-bg-clip)");
        const sketchBgEl = svgClone.querySelector("[data-sketch-background]") as SVGElement | null;
        if (sketchBgEl) sketchBgEl.setAttribute("clip-path", "url(#donut-bg-clip)");
      }
    }
  }

  const svgStr = new XMLSerializer().serializeToString(svgClone);
  const url = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" }));

  const canvas = document.createElement("canvas");
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext("2d")!;
  // 배경 제거 시 canvas는 기본값인 투명 상태 유지
  if (!transparent) {
    ctx.fillStyle = captureColor;
    ctx.fillRect(0, 0, pw, ph);
  }

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

function composeMobileCanvas(squareDataUrl: string, bgColor: string, transparent: boolean): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = Math.round(w * (16 / 9));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      if (!transparent) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, Math.round((h - w) / 2), w, w);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = squareDataUrl;
  });
}

export function usePngDownload(bgColor: string, isSketch: boolean) {
  const [isDownloading, setIsDownloading] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  async function download(size: DownloadSize, removeBackground: boolean) {
    if (!targetRef.current || isDownloading) return;
    setIsDownloading(true);

    const captureColor = bgColor;

    try {
      const date = new Date().toISOString().slice(0, 10);
      const squareDataUrl = await captureAsPng(targetRef.current, captureColor, isSketch, removeBackground);
      const finalDataUrl =
        size === "mobile" ? await composeMobileCanvas(squareDataUrl, captureColor, removeBackground) : squareDataUrl;
      const link = document.createElement("a");
      link.download = `dayframe-${date}.png`;
      link.href = finalDataUrl;
      link.click();
    } catch (err) {
      console.error("PNG 다운로드 실패:", err);
      alert("PNG 다운로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsDownloading(false);
    }
  }

  return { isDownloading, targetRef, download };
}
