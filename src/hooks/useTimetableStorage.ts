import { useState, useEffect, useRef } from "react";
import type { TimeBlock } from "@/types";
import type { Shape, NumberDisplay } from "@/components/timetable/svgUtils";
import { THEMES } from "@/constants/palettes";
import type { Theme } from "@/constants/palettes";

const STORAGE_KEY = "timechart_timetable";

interface PersistedState {
  blocks: TimeBlock[];
  shape: Shape;
  isSketch: boolean;
  themeId: string;
  numberDisplay: NumberDisplay;
}

function loadFromStorage(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
}

export function useTimetableStorage() {
  // 초기 로드는 한 번만 수행
  const [saved] = useState(loadFromStorage);

  const [blocks, setBlocks] = useState<TimeBlock[]>(saved.blocks ?? []);
  const [shape, setShape] = useState<Shape>(saved.shape ?? "donut");
  const [isSketch, setIsSketch] = useState<boolean>(saved.isSketch ?? false);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(() => THEMES.find((t) => t.id === saved.themeId) ?? THEMES[0]);
  const [numberDisplay, setNumberDisplay] = useState<NumberDisplay>(saved.numberDisplay ?? "major");
  // fullReset 직후 상태 변경이 useEffect를 재트리거해 localStorage가 기본값으로 덮어써지는 것을 막기 위한 플래그.
  // fullReset에서 true로 세우면 다음 useEffect 실행 한 번만 저장을 건너뛴다.
  const suppressSave = useRef(false);

  useEffect(() => {
    if (suppressSave.current) {
      suppressSave.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ blocks, shape, isSketch, themeId: selectedTheme.id, numberDisplay }));
  }, [blocks, shape, isSketch, selectedTheme, numberDisplay]);

  function reset() {
    setBlocks([]);
  }

  function fullReset() {
    suppressSave.current = true;
    localStorage.removeItem(STORAGE_KEY);
    setBlocks([]);
    setShape("donut");
    setIsSketch(false);
    setSelectedTheme(THEMES[0]);
    setNumberDisplay("major");
  }

  return { blocks, setBlocks, shape, setShape, isSketch, setIsSketch, selectedTheme, setSelectedTheme, numberDisplay, setNumberDisplay, reset, fullReset };
}
