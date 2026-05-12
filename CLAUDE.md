# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 개발 서버 실행 (Vite HMR)
npm run build     # TypeScript 컴파일 후 Vite 프로덕션 빌드
npm run lint      # ESLint 검사
npm run preview   # 빌드 결과물 미리보기
```

테스트 러너 없음. 패키지 매니저는 npm (package-lock.json 기준).

## 아키텍처

단일 페이지 앱으로, `App.tsx` → `Timetable` → SVG 구성 컴포넌트 순으로 렌더링된다. 상태는 `Timetable`에서 모두 관리하며 별도의 전역 상태 라이브러리는 없다.

### 테마 시스템

테마는 두 레이어로 동작한다.

1. `src/constants/palettes.ts` — `Theme` 타입 정의와 `THEMES` 배열. 각 테마는 `blockColors[]`(블록 색상 팔레트)와 `ui`(CSS 변수에 매핑될 색상 5종)를 가진다.
2. `src/utils/themeUtils.ts` — `applyTheme(theme)`이 `document.documentElement`에 CSS 변수(`--color-primary`, `--color-border` 등)를 직접 세팅한다.
3. `src/index.css` — Tailwind v4의 `@theme` 블록으로 CSS 변수를 Tailwind 유틸리티 클래스(`text-text`, `bg-background` 등)에 연결한다.

테마를 변경하면 기존 블록 색상도 새 테마의 팔레트 순서에 맞게 재할당된다 (`Timetable.handleThemeSelect`).

### SVG 렌더링 파이프라인

원형 시간표는 600×600 `viewBox`의 SVG 위에 그려진다.

- **`svgUtils.ts`** — 좌표 상수(`CX`, `CY`, `OUTER_R`, `INNER_R` 등), 색상 상수, `timeToAngle` / `polar` / `sectorPath` 좌표 계산 함수, `splitIntoLines` 텍스트 줄바꿈 함수가 모두 이 파일에 있다.
- **`BlockArc.tsx`** — `BlockArc`(일반)와 `SketchBlockArc`(스케치) 두 가지 변형이 있다. `sectorPath`로 SVG `<path>` d 문자열을 생성하고, rough.js path는 `useMemo`로 캐싱해 re-render 시 흔들리지 않게 한다.
- **`TimetableCircle.tsx`** — 시계 배경(원/스케치), 눈금(HourTicks/SketchHourTicks), 시각 레이블(HourLabels)을 담당한다. `SketchBackground`, `SketchHourTicks`는 `memo`로 감싸져 있다.

### 스케치 모드

`isSketch` boolean 하나로 일반/스케치 렌더링을 전환한다. rough.js의 `generator`는 모듈 레벨 싱글턴으로 선언되어 있다(`BlockArc.tsx`, `TimetableCircle.tsx` 각각). 스케치 전용 폰트(`RoughlyWrittenJunwoo`)는 CDN에서 불러온다.

### 도넛/원형 모드

`shape` 상태(`"donut" | "circle"`)에 따라 `innerR`이 `INNER_R`(105) 또는 0으로 결정된다. 이 값이 `sectorPath`와 텍스트 중앙 위치 계산에 모두 전달된다. 도넛 구멍은 같은 색의 원을 위에 덮는 방식으로 구현된다.

### PNG 다운로드

`src/hooks/usePngDownload.ts`에 다운로드 로직이 집중되어 있으며, `{ isDownloading, targetRef, download }` 를 반환한다. UI는 `src/components/ui/DownloadButton.tsx`가 담당한다.

**일반 캡처**: `html-to-image`의 `toPng`를 사용한다 (`pixelRatio: 2`). 스케치 모드 폰트(`RoughlyWrittenJunwoo`)는 CDN에서 최초 1회 fetch해 Base64로 변환한 뒤 모듈 레벨 변수에 캐싱하고, `fontEmbedCSS` 옵션으로 주입한다.

**배경 제거 캡처**: html-to-image 대신 `XMLSerializer`로 SVG를 직렬화해 Canvas에 렌더링하는 방식을 사용한다. DOM을 건드리지 않아 화면 깜빡임이 없다. 배경색으로 채워야 하는 요소(`도넛 내부 원`)에는 `data-bg-fill` 속성을 마킹하고, 직렬화 시 해당 속성으로 셀렉팅해 색상을 교체한다.

**모바일(9:16) 사이즈**: 정사각형 캡처 결과를 Canvas에 합성해 세로 여백을 배경색으로 채운다.

## 코딩 컨벤션

- 경로 별칭 `@/` → `src/` (vite.config의 `resolve.alias`)
- UI 공통 컴포넌트(`Button`, `Input`, `ToggleGroup`)는 `src/components/ui/`에 위치
- 스케치 변형 컴포넌트는 같은 파일 내에 일반 컴포넌트와 나란히 export (`BlockArc` / `SketchBlockArc`)
- 색상 상수는 `svgUtils.ts`에 집중 관리, UI 색상 변수는 CSS custom properties로 관리
- 주석은 한국어로 작성
