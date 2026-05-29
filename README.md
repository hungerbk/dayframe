# dayframe

하루 일정을 원형 시간표로 시각화하는 웹 앱입니다.
블록을 추가해 하루를 계획하고, PNG로 저장해 다이어리나 굿노트 등에서 활용할 수 있습니다.

<!-- 스크린샷 -->

## 실행 방법

Node.js 18 이상이 필요합니다.

```bash
npm install
npm run dev
```

| 명령어            | 설명                 |
| ----------------- | -------------------- |
| `npm run dev`     | 개발 서버 실행       |
| `npm run build`   | 프로덕션 빌드        |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint`    | ESLint 검사          |

## 기술 스택

| 분류        | 사용 기술            |
| ----------- | -------------------- |
| 프레임워크  | React 19, TypeScript |
| 빌드 도구   | Vite                 |
| 스타일      | Tailwind CSS v4      |
| SVG 렌더링  | rough.js             |
| 다국어 지원 | i18next              |
