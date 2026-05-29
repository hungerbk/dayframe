# CLAUDE.md

## Commands

```bash
npm run dev       # 개발 서버 실행 (Vite HMR)
npm run build     # TypeScript 컴파일 후 Vite 프로덕션 빌드
npm run lint      # ESLint 검사
npm run preview   # 빌드 결과물 미리보기
```

테스트 러너 없음. 패키지 매니저는 npm.

## 아키텍처

단일 페이지 앱. `App.tsx` → `Timetable` → SVG 구성 컴포넌트 순으로 렌더링된다. 상태는 `Timetable`에서 모두 관리하며 별도의 전역 상태 라이브러리는 없다.

- **`svgUtils.ts`** — 좌표 상수, 색상 상수, 좌표 계산 함수 집중 관리
- **`BlockArc.tsx`** — `sketch` prop 하나로 일반/스케치 렌더링 전환. rough.js path는 `useMemo`로 캐싱
- **`TimetableCircle.tsx`** — 시계 배경, 눈금, 시각 레이블 담당

### 테마

`src/constants/palettes.ts`에서 `Theme` 정의 → `applyTheme()`이 CSS 변수를 `document.documentElement`에 직접 세팅 → Tailwind `@theme` 블록이 유틸리티 클래스에 연결.

테마 변경 시 기존 블록 색상도 새 팔레트 순서에 맞게 재할당된다 (`Timetable.handleThemeSelect`).

### PNG 다운로드

`XMLSerializer`로 SVG 직렬화 후 Canvas에 렌더링. DOM을 건드리지 않아 화면 깜빡임 없음 (`usePngDownload.ts`).

**CSS 변수 처리 (중요)**: SVG가 DOM에서 분리되면 `var(--color-*)` 가 해석되지 않는다. CSS 변수로 색상을 지정하는 SVG 요소에는 반드시 `data-bg-fill` 속성을 마킹해야 직렬화 전에 실제 색상으로 교체된다.

### 블록 이미지 SVG 렌더링

`<clipPath>`를 바깥 `<g>`에, `transform`을 안쪽 `<image>`에 분리해야 한다. 같은 요소에 함께 적용하면 클립 경계까지 이동/확대된다.

```
<g clipPath="url(#clip-{id})">       ← 클립 경계 고정
  <image transform="translate..." /> ← 이미지 내용만 이동/확대
</g>
```

### localStorage (`useTimetableStorage`)

**`canSave` 패턴**: `localStorage.getItem`이 null이면 `canSave.current = false`로 시작해 빈 상태에서 저장하지 않는다. 세터 호출 시점에 `true`로 전환. `fullReset` 시 `false`로 되돌려 `removeItem` 후 `useEffect` 재트리거에도 기본값이 덮어써지지 않는다.

## 코딩 컨벤션

- 경로 별칭 `@/` → `src/`
- UI 공통 컴포넌트는 `src/components/ui/`. `Dropdown.tsx`는 `DropdownPanel`과 `DropdownItem`을 export
- 스케치 변형은 별도 컴포넌트가 아닌 `sketch` prop으로 처리
- 주석은 한국어로 작성
