import { useState, useEffect, useRef, type SetStateAction } from "react";
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
  // localStorage에 데이터가 있을 때만 저장한다.
  // getItem이 null이면 아직 사용자가 아무것도 입력하지 않은 상태이므로 저장을 건너뛴다.
  // 세터를 호출하는 시점에 true로 바뀌며, fullReset 시 false로 되돌아간다.
  const canSave = useRef(localStorage.getItem(STORAGE_KEY) !== null);

  useEffect(() => {
    if (!canSave.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ blocks, shape, isSketch, themeId: selectedTheme.id, numberDisplay }));
    } catch {
      // 저장 공간 부족 또는 브라우저 보안 설정으로 저장 실패 시 무시
    }
  }, [blocks, shape, isSketch, selectedTheme, numberDisplay]);

  function blockReset() {
    canSave.current = true;
    setBlocks([]);
  }

  function fullReset() {
    canSave.current = false;
    localStorage.removeItem(STORAGE_KEY);
    setBlocks([]);
    setShape("donut");
    setIsSketch(false);
    setSelectedTheme(THEMES[0]);
    setNumberDisplay("major");
  }

  return {
    blocks,
    setBlocks: (v: SetStateAction<TimeBlock[]>) => { canSave.current = true; setBlocks(v); },
    shape,
    setShape: (v: SetStateAction<Shape>) => { canSave.current = true; setShape(v); },
    isSketch,
    setIsSketch: (v: SetStateAction<boolean>) => { canSave.current = true; setIsSketch(v); },
    selectedTheme,
    setSelectedTheme: (v: SetStateAction<Theme>) => { canSave.current = true; setSelectedTheme(v); },
    numberDisplay,
    setNumberDisplay: (v: SetStateAction<NumberDisplay>) => { canSave.current = true; setNumberDisplay(v); },
    blockReset,
    fullReset,
  };
}
