# Admin 페이지 아키텍처 개선안

> 마지막 업데이트: 2026-01-18
> 목표: 확장성 ↑ 재사용성 ↑ 유지보수성 ↑

---

## 🎯 핵심 원칙

1. **Separation of Concerns** - UI / 로직 / 데이터 분리
2. **DRY (Don't Repeat Yourself)** - 공통 로직 재사용
3. **Composition over Inheritance** - 작은 컴포넌트 조합
4. **Single Responsibility** - 한 파일은 한 가지 역할만

---

## 📁 개선된 폴더 구조

```
features/admin/
├── index.ts                          # Public exports
├── AdminPage.tsx                     # 🎯 Main page (orchestrator만)
│
├── sections/                         # 📦 Page sections (큰 블록)
│   ├── StatsSection.tsx              # Stats 카드 영역
│   ├── UsersSection.tsx              # 사용자 목록 + 관리
│   ├── SystemSection.tsx             # 시스템 상태
│   ├── SubmissionsSection.tsx        # 제출 내역
│   └── AnalyticsSection.tsx          # 통계/차트 (Phase 2)
│
├── components/                       # 🧩 Reusable components
│   ├── cards/
│   │   ├── StatCard.tsx              # 통계 카드 (이미 AdminPage에 있음 → 분리)
│   │   ├── UserCard.tsx              # 사용자 카드
│   │   └── SystemStatusCard.tsx      # 시스템 상태 카드
│   │
│   ├── tables/
│   │   ├── DataTable.tsx             # 🔥 재사용 가능한 범용 테이블
│   │   ├── UserTable.tsx             # DataTable 사용
│   │   ├── SubmissionTable.tsx       # DataTable 사용
│   │   └── LessonProgressTable.tsx   # DataTable 사용 (Phase 2)
│   │
│   ├── modals/
│   │   ├── BaseModal.tsx             # 🔥 모달 공통 레이아웃
│   │   ├── ConfirmModal.tsx          # 확인 모달 (삭제 등)
│   │   ├── EditNicknameModal.tsx     # 닉네임 수정
│   │   ├── EditRoleModal.tsx         # 역할 변경
│   │   ├── DeleteUserModal.tsx       # 사용자 삭제 (ConfirmModal 사용)
│   │   └── ResetProgressModal.tsx    # 진도 초기화 (Phase 2)
│   │
│   ├── filters/
│   │   ├── SearchInput.tsx           # 🔥 검색 입력 (debounced)
│   │   ├── RoleFilter.tsx            # 역할 필터
│   │   ├── DateRangeFilter.tsx       # 날짜 범위
│   │   └── FilterBar.tsx             # 필터 조합
│   │
│   ├── charts/                       # Phase 2
│   │   ├── LineChart.tsx             # DAU/WAU/MAU
│   │   ├── BarChart.tsx              # 레슨별 완료율
│   │   └── PieChart.tsx              # 역할 분포
│   │
│   ├── AIProviderToggle.tsx          # ✅ 이미 존재
│   └── AdminRoute.tsx                # ✅ 이미 존재
│
├── hooks/                            # 🎣 Custom hooks
│   ├── useAdminStats.ts              # Stats 데이터 fetch + 캐싱
│   ├── useUserManagement.ts          # 사용자 CRUD 로직
│   ├── useSystemStatus.ts            # 시스템 상태 fetch
│   ├── useSubmissions.ts             # 제출 내역 fetch
│   ├── usePagination.ts              # 🔥 페이지네이션 로직
│   ├── useTableSort.ts               # 🔥 테이블 정렬 로직
│   └── useDebounce.ts                # 🔥 검색 디바운싱
│
├── services/                         # 🌐 API calls
│   ├── admin.api.ts                  # Admin API 전체
│   ├── users.api.ts                  # 사용자 관련 API
│   ├── stats.api.ts                  # 통계 API
│   └── system.api.ts                 # 시스템 API
│
├── types/                            # 📝 TypeScript types
│   ├── admin.types.ts                # Admin 전용 타입
│   ├── stats.types.ts                # 통계 타입
│   ├── user-management.types.ts      # 사용자 관리 타입
│   └── table.types.ts                # 테이블 공통 타입
│
├── constants/                        # ⚙️ 상수
│   ├── colors.ts                     # StatCard 색상 등
│   ├── table-columns.ts              # 테이블 컬럼 정의
│   └── permissions.ts                # 권한 레벨 (Phase 3)
│
└── utils/                            # 🛠 유틸 함수
    ├── formatters.ts                 # 날짜, 숫자 포맷
    ├── validators.ts                 # 입력 검증
    └── exporters.ts                  # CSV/Excel export (Phase 2)
```

---

## 🔥 핵심 공통 컴포넌트 설계

### 1. DataTable (범용 테이블)

**WHY**: 사용자 테이블, 제출 테이블, 진도 테이블 모두 동일한 패턴
- 정렬 (Sortable columns)
- 페이지네이션 (Pagination)
- 검색 (Search)
- 액션 버튼 (Edit/Delete)

```typescript
// components/tables/DataTable.tsx
interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({ data, columns, ... }: DataTableProps<T>) {
  // 🔥 재사용 가능한 테이블 로직
}
```

**사용 예시**:
```typescript
// sections/UsersSection.tsx
const userColumns: Column<UserInfo>[] = [
  { key: 'nickname', label: '닉네임', sortable: true },
  { key: 'role', label: '역할', render: (role) => <RoleBadge role={role} /> },
  { key: 'createdAt', label: '가입일', render: (date) => formatDate(date) },
];

<DataTable
  data={users}
  columns={userColumns}
  onSort={handleSort}
  actions={(user) => (
    <>
      <Button onClick={() => openEditModal(user)}>수정</Button>
      <Button onClick={() => openDeleteModal(user)}>삭제</Button>
    </>
  )}
/>
```

---

### 2. BaseModal (모달 공통 레이아웃)

**WHY**: 닉네임 수정, 역할 변경, 삭제 확인 등 모든 모달이 같은 구조

```typescript
// components/modals/BaseModal.tsx
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function BaseModal({ isOpen, onClose, title, children, footer, size = 'md' }: BaseModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      {/* 🔥 공통 모달 레이아웃 */}
      <div className={modalSizes[size]}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </Dialog>
  );
}
```

**사용 예시**:
```typescript
// components/modals/EditNicknameModal.tsx
export function EditNicknameModal({ user, isOpen, onClose, onSave }: Props) {
  const [nickname, setNickname] = useState(user.nickname);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="닉네임 변경"
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button onClick={() => onSave(nickname)}>저장</Button>
        </>
      }
    >
      <Input value={nickname} onChange={setNickname} />
    </BaseModal>
  );
}
```

---

### 3. Custom Hooks (재사용 로직)

#### useUserManagement (사용자 CRUD)

```typescript
// hooks/useUserManagement.ts
export function useUserManagement() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (filters?: UserFilters) => {
    setLoading(true);
    const data = await usersApi.getUsers(filters);
    setUsers(data);
    setLoading(false);
  };

  const updateNickname = async (userId: string, nickname: string) => {
    await usersApi.updateNickname(userId, nickname);
    await fetchUsers(); // 자동 새로고침
  };

  const deleteUser = async (userId: string) => {
    await usersApi.deleteUser(userId);
    await fetchUsers(); // 자동 새로고침
  };

  const changeRole = async (userId: string, role: 'user' | 'admin') => {
    await usersApi.changeRole(userId, role);
    await fetchUsers();
  };

  return {
    users,
    loading,
    fetchUsers,
    updateNickname,
    deleteUser,
    changeRole,
  };
}
```

**사용 예시**:
```typescript
// sections/UsersSection.tsx
export function UsersSection() {
  const { users, loading, updateNickname, deleteUser } = useUserManagement();
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);

  return (
    <>
      <DataTable data={users} ... />
      <EditNicknameModal
        user={editingUser}
        onSave={(nickname) => updateNickname(editingUser.id, nickname)}
      />
    </>
  );
}
```

---

#### usePagination (페이지네이션 로직)

```typescript
// hooks/usePagination.ts
export function usePagination(totalItems: number, itemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}
```

---

## 🎨 AdminPage.tsx (Orchestrator)

**Before** (현재):
```typescript
// AdminPage.tsx - 367 lines
export function AdminPage() {
  // 모든 state
  // 모든 API calls
  // 모든 UI 렌더링
  // StatCard 컴포넌트 정의
  // formatUptime 함수
  // ...
}
```

**After** (개선):
```typescript
// AdminPage.tsx - ~100 lines
export function AdminPage() {
  // 🎯 Orchestrator 역할만
  const { stats } = useAdminStats();
  const { system } = useSystemStatus();

  return (
    <div className="admin-layout">
      <AdminHeader title="관리자 페이지" />

      <StatsSection stats={stats} />
      <SystemSection system={system} />
      <UsersSection />
      <SubmissionsSection />
    </div>
  );
}
```

---

## 📊 Before vs After 비교

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| **AdminPage.tsx 라인 수** | 367 lines | ~100 lines | **-73%** |
| **재사용 가능 컴포넌트** | 0개 | 10+ 개 | ✅ |
| **API 로직 분리** | ❌ 컴포넌트 내부 | ✅ services/ | ✅ |
| **타입 관리** | inline types | types/ 폴더 | ✅ |
| **테이블 코드 중복** | 3번 반복 | DataTable 1개 | **-67%** |
| **모달 추가 시간** | 1시간 | 15분 | **-75%** |

---

## 🚀 마이그레이션 단계

### Phase 1: 기반 구축 (2시간)
1. ✅ 폴더 구조 생성
2. ✅ types/ 타입 이동
3. ✅ constants/ 생성 (색상, 컬럼 정의)
4. ✅ utils/ 생성 (formatters)

### Phase 2: 공통 컴포넌트 (3시간)
1. ✅ BaseModal 생성
2. ✅ DataTable 생성
3. ✅ StatCard 분리 (AdminPage에서 이동)
4. ✅ SearchInput 생성

### Phase 3: Hooks (2시간)
1. ✅ useUserManagement
2. ✅ useAdminStats
3. ✅ usePagination
4. ✅ useDebounce

### Phase 4: Services (1시간)
1. ✅ users.api.ts
2. ✅ stats.api.ts
3. ✅ system.api.ts

### Phase 5: Sections (2시간)
1. ✅ UsersSection (DataTable 사용)
2. ✅ StatsSection
3. ✅ SystemSection
4. ✅ SubmissionsSection

### Phase 6: AdminPage 리팩토링 (1시간)
1. ✅ Sections 조합
2. ✅ 불필요한 코드 제거
3. ✅ Props drilling 제거

**총 소요 시간: 약 11시간**

---

## 💡 확장 시나리오

### 새 기능 추가: "진도 초기화"

**Before** (모놀리식 구조):
```
1. AdminPage.tsx에 300줄 추가
2. API 호출 코드 추가
3. 모달 UI 작성
4. State 관리 추가
→ 총 4시간
```

**After** (모듈형 구조):
```
1. ResetProgressModal.tsx 생성 (BaseModal 사용) - 30분
2. useUserManagement에 resetProgress 함수 추가 - 15분
3. UsersSection에서 버튼 연결 - 10분
→ 총 1시간 (75% 단축!)
```

---

## 🎯 핵심 패턴

### 1. Composition Pattern (조합 패턴)
```typescript
// ❌ Bad: 하나의 큰 컴포넌트
<UserManagementSection>
  {/* 500 lines of code */}
</UserManagementSection>

// ✅ Good: 작은 컴포넌트 조합
<UsersSection>
  <FilterBar>
    <SearchInput />
    <RoleFilter />
  </FilterBar>
  <DataTable data={users} columns={columns} />
  <Pagination {...pagination} />
</UsersSection>
```

### 2. Custom Hooks Pattern
```typescript
// ❌ Bad: 컴포넌트에 모든 로직
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => { /* ... */ };
  const deleteUser = async () => { /* ... */ };
  // ... 200 lines
}

// ✅ Good: Hook으로 로직 분리
function UsersSection() {
  const { users, loading, deleteUser } = useUserManagement();
  // ... 50 lines (UI only)
}
```

### 3. Service Layer Pattern
```typescript
// ❌ Bad: 컴포넌트에서 직접 API 호출
const response = await fetch('/api/admin/users');

// ✅ Good: Service Layer 사용
const users = await usersApi.getUsers({ role: 'admin' });
```

---

## 📚 참고 자료

- React Composition: https://react.dev/learn/thinking-in-react
- Custom Hooks: https://react.dev/learn/reusing-logic-with-custom-hooks
- Service Layer: https://martinfowler.com/eaaCatalog/serviceLayer.html
