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

**캡처 방식**: 외부 라이브러리 없이 `XMLSerializer`로 SVG를 직렬화한 뒤 Canvas에 렌더링한다. DOM을 전혀 건드리지 않아 화면 깜빡임이 없고, 배경색·폰트 처리를 완전히 제어할 수 있다. (`pixelRatio: 2`에 해당하는 2배 해상도로 캡처)

**폰트 임베딩**: 스케치 모드 폰트(`RoughlyWrittenJunwoo`)는 최초 1회 CDN에서 fetch해 Base64로 변환한 뒤 모듈 레벨 변수에 캐싱한다. 직렬화 전 SVG 클론의 `<defs><style>` 안에 `@font-face`로 주입한다.

**CSS 변수 처리**: SVG가 DOM에서 분리되면 `var(--color-*)` 같은 CSS 변수가 해석되지 않는다. 캡처 시 색상을 교체해야 하는 요소에는 `data-bg-fill` 속성을 마킹하고, 직렬화 직전에 실제 색상으로 교체한다. **새로운 SVG 요소를 추가할 때 CSS 변수로 색상을 지정한다면 반드시 이 속성을 함께 붙여야 한다.**

**모바일(9:16) 사이즈**: 정사각형 캡처 결과를 Canvas에 합성해 세로 여백을 배경색으로 채운다.

### localStorage 영속성

`src/hooks/useTimetableStorage.ts`에서 타임테이블 상태(`blocks`, `shape`, `isSketch`, `selectedTheme`, `numberDisplay`)를 `'timechart_timetable'` 키로 저장/복원한다.

**뷰별 키 네이밍**: 뷰마다 독립된 키를 사용한다. 타임트래커는 `'timechart_tracker'`로 분리 예정.

**확장 시 훅 구조**: 저장/복원/초기화 메커니즘은 뷰가 달라도 동일하므로, 타임트래커 작업 시점에 공통 로직을 `useLocalStorage<T>(key, defaultValue)`로 추출하고 두 도메인 훅이 그 위에 얹히는 구조로 리팩터링한다.

```
useLocalStorage<T>(key, defaultValue)   ← JSON 파싱, 자동 저장, clear() 담당
  └─ useTimetableStorage  ('timechart_timetable')
  └─ useTrackerStorage    ('timechart_tracker')
```

**전체 초기화(`fullReset`)의 suppressSave 패턴**: `fullReset` 호출 시 상태를 기본값으로 리셋하면 `useEffect`가 즉시 재트리거되어 localStorage가 기본값으로 덮어써진다. 이를 막기 위해 `suppressSave` ref를 `true`로 세운 뒤 `removeItem`하고, `useEffect` 내에서 플래그를 확인해 한 사이클만 저장을 건너뛴다.

### 캡처 확장 시 주의사항

타임트래커 등 새로운 뷰에서 `usePngDownload`를 재사용할 때 고려할 점:

- **SVG 외부 HTML은 캡처되지 않는다.** 제목, 범례 등 텍스트를 함께 캡처하려면 SVG 내부의 `<text>` 요소로 구성해야 한다. HTML 요소를 함께 캡처해야 한다면 `foreignObject`를 쓰거나 별도의 캡처 전략이 필요하다.
- **이미지(배경 이미지 등)를 SVG 안에 삽입할 경우** CORS 제약으로 Canvas가 오염(tainted)될 수 있다. 외부 이미지는 서버 측 프록시나 blob URL 변환을 거쳐야 한다.
- **CSS 변수로 색상을 지정한 SVG 요소**는 직렬화 후 색상이 사라진다. `data-bg-fill` 패턴처럼 별도 속성으로 마킹하고 `captureAsPng` 내부에서 교체 처리를 추가해야 한다.

## 코딩 컨벤션

- 경로 별칭 `@/` → `src/` (vite.config의 `resolve.alias`)
- UI 공통 컴포넌트(`Button`, `Input`, `ToggleGroup`)는 `src/components/ui/`에 위치
- 스케치 변형 컴포넌트는 같은 파일 내에 일반 컴포넌트와 나란히 export (`BlockArc` / `SketchBlockArc`)
- 색상 상수는 `svgUtils.ts`에 집중 관리, UI 색상 변수는 CSS custom properties로 관리
- 주석은 한국어로 작성
