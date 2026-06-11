import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { MAX_IMAGE_SIZE_MB } from "@/constants/timetable";
import Button from "./Button";

interface Props {
  title?: string;
  imageDataUrl?: string;
  imageOffsetX: number;
  imageOffsetY: number;
  imageScale: number;
  onImageLoad: (dataUrl: string) => void;
  onImageRemove: () => void;
  onImageTransform: (offsetX: number, offsetY: number, scale: number) => void;
}

export default function BlockImageInput({ title, imageDataUrl, imageOffsetX, imageOffsetY, imageScale, onImageLoad, onImageRemove, onImageTransform }: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      alert(t("input.imageSizeError", { maxMB: MAX_IMAGE_SIZE_MB }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onImageLoad(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleImageRemove() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onImageRemove();
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text">{t("input.imageLabel")}</span>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {imageDataUrl ? (
        <>
          <div className="flex items-center gap-2">
            <img src={imageDataUrl} alt={title} className="w-10 h-10 rounded object-cover shrink-0 border border-border" />
            <Button type="button" variant="outline" onClick={handleImageRemove} className="flex-1 text-sm">
              {t("input.imageRemove")}
            </Button>
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-sm font-medium text-text">{t("input.imageAdjust")}</span>
            {([
              { key: "imageOffsetX", left: "←", right: "→", value: imageOffsetX, min: -230, max: 230, step: 1 },
              { key: "imageOffsetY", left: "↑", right: "↓", value: imageOffsetY, min: -230, max: 230, step: 1 },
              { key: "imageScale",   left: "−", right: "+", value: imageScale,   min: 0.5,  max: 3,   step: 0.05 },
            ] as const).map(({ key, left, right, value, min, max, step }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-base text-text/50 w-5 text-center shrink-0">{left}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  className="flex-1 accent-primary cursor-pointer"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onImageTransform(
                      key === "imageOffsetX" ? v : imageOffsetX,
                      key === "imageOffsetY" ? v : imageOffsetY,
                      key === "imageScale"   ? v : imageScale,
                    );
                  }}
                />
                <span className="text-base text-text/50 w-5 text-center shrink-0">{right}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full text-sm">
          {t("input.imageUpload")}
        </Button>
      )}
    </div>
  );
}
