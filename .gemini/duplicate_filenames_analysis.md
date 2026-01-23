### 중복 파일명 분석 결과

프로젝트 내에서 이름이 중복되는 주요 파일들의 현황입니다.

| 파일명 | 중복 횟수 (대략) | 주요 위치 (예시) |
| :--- | :--- | :--- |
| **`index.ts`** | **~60** | 각 `features`와 그 하위 폴더들의 진입점 역할을 합니다.<br>- `packages/frontend/src/features/courses/index.ts`<br>- `packages/frontend/src/features/visualizers/js/index.ts`<br>- `packages/backend/src/modules/users/index.ts` |
| **`types.ts`** | **~20** | 각 기능 모듈 또는 서비스에 필요한 타입들을 지역적으로 정의합니다.<br>- `packages/frontend/src/features/visualizers/js/types.ts`<br>- `packages/frontend/src/features/visualizers/shared/types.ts`<br>- `packages/backend/src/modules/simulators/c/runtime/types.ts` |
| **`routes.ts`** | **~14** | 백엔드의 각 API 모듈별로 라우팅 경로를 정의합니다. (모두 백엔드에 위치)<br>- `packages/backend/src/modules/users/routes.ts`<br>- `packages/backend/src/modules/courses/routes.ts`<br>- `packages/backend/src/modules/problems/routes.ts` |
| **`simulator.ts`** | **~6** | 각 언어별 시뮬레이터의 핵심 로직을 담고 있습니다.<br>- `packages/backend/src/modules/simulators/c/simulator.ts`<br>- `packages/backend/src/modules/simulators/python/simulator.ts`<br>- `packages/frontend/src/services/simulator.ts` |

**분석 요약:**
대부분의 중복 파일들은 각자의 기능 폴더(`features` 또는 `modules`) 내에서 지역적인 역할(진입점, 타입 정의 등)을 수행하고 있습니다. 이는 기능별로 코드를 분리하는 일반적인 패턴의 일부입니다.
