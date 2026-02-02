# CodeInsight Architecture

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Web["Web Browser<br/>(React + Vite)"]
        Mobile["Mobile App<br/>(Capacitor)"]
    end

    subgraph Frontend["Frontend (packages/frontend)"]
        Router["React Router"]
        Zustand["Zustand Store"]
        Monaco["Monaco Editor"]
        Visualizers["Visualizers<br/>(C/Python/Java/JS)"]
        ReactQuery["React Query"]
    end

    subgraph Backend["Backend (packages/backend)"]
        Express["Express Server"]
        Auth["Auth Middleware<br/>(Firebase)"]
        Prisma["Prisma ORM"]
        Simulators["Simulators"]
        AI["AI Module<br/>(Ollama/DeepSeek)"]
    end

    subgraph External["External Services"]
        Firebase["Firebase Auth"]
        Neon["Neon PostgreSQL"]
        Ollama["Ollama LLM"]
    end

    Web --> Router
    Mobile --> Router
    Router --> Zustand
    Zustand --> Monaco
    Zustand --> Visualizers
    Zustand --> ReactQuery
    ReactQuery --> Express
    Express --> Auth
    Auth --> Firebase
    Express --> Prisma
    Prisma --> Neon
    Express --> Simulators
    Express --> AI
    AI --> Ollama
```

## 2. Monorepo Structure

```mermaid
graph LR
    subgraph Root["C-OSINE (Monorepo)"]
        direction TB
        subgraph Packages["packages/"]
            Frontend["frontend/<br/>React + Vite"]
            Backend["backend/<br/>Node.js + Express"]
            Shared["shared/<br/>Types + Schemas"]
        end

        subgraph Config["Configuration"]
            Prisma["prisma/<br/>DB Schema"]
            Claude[".claude/<br/>AI Context"]
            Scripts["scripts/<br/>Utilities"]
        end
    end

    Frontend -->|imports| Shared
    Backend -->|imports| Shared
    Backend -->|uses| Prisma
```

## 3. Frontend Architecture

```mermaid
graph TB
    subgraph Entry["Entry Point"]
        Main["main.tsx"]
        RouterConfig["router.tsx"]
    end

    subgraph Pages["Features (Pages)"]
        Home["home/"]
        Auth["auth/"]
        Courses["courses/"]
        Playground["playground/"]
        Dashboard["dashboard/"]
        Quiz["quiz/"]
    end

    subgraph Core["Core Components"]
        Components["components/<br/>(UI, Common)"]
        Layouts["layouts/"]
        Hooks["hooks/"]
    end

    subgraph State["State Management"]
        Store["stores/store.ts<br/>(Zustand)"]
        ThemeStore["themeStore.ts"]
        LessonHistory["lessonHistoryStore.ts"]
    end

    subgraph Services["API Services"]
        Simulator["simulator.ts"]
        CoursesAPI["courses.ts"]
        AIAPI["ai.ts"]
        Analytics["analytics.ts"]
    end

    subgraph Visualizers["Visualizers"]
        CVisual["visualizers/c/"]
        PythonVisual["visualizers/flow/<br/>(Python)"]
        JavaVisual["visualizers/java/"]
        JSVisual["visualizers/flow/<br/>(JS)"]
    end

    Main --> RouterConfig
    RouterConfig --> Pages
    Pages --> Core
    Pages --> State
    Pages --> Services
    Playground --> Visualizers
    Services -->|Axios| Backend["Backend API"]
```

## 4. Backend Architecture

```mermaid
graph TB
    subgraph Entry["Entry Point"]
        App["app.ts"]
    end

    subgraph Middleware["Middleware"]
        AuthMW["auth.ts"]
        RateLimit["rate-limit.ts"]
        ErrorHandler["error-handler.ts"]
        Logger["request-logger.ts"]
    end

    subgraph Modules["Domain Modules"]
        SimModule["simulators/"]
        CoursesModule["courses/"]
        UsersModule["users/"]
        AIModule["ai/"]
        AnalyticsModule["analytics/"]
        GamificationModule["gamification/"]
        AdminModule["admin/"]
    end

    subgraph Simulators["Simulator Engines"]
        CSim["c/<br/>GCC Parser"]
        PySim["python/<br/>sys.settrace"]
        JavaSim["java/<br/>JDWP"]
        JSSim["javascript/<br/>Node.js VM"]
    end

    subgraph Data["Data Layer"]
        PrismaClient["Prisma Client"]
        PostgreSQL["PostgreSQL<br/>(Neon)"]
    end

    App --> Middleware
    Middleware --> Modules
    SimModule --> Simulators
    Modules --> PrismaClient
    PrismaClient --> PostgreSQL
```

## 5. Simulator Architecture

```mermaid
graph LR
    subgraph Input["Input"]
        Code["User Code"]
        Stdin["Standard Input"]
    end

    subgraph CSimulator["C Simulator"]
        CParser["Parser<br/>(AST)"]
        CRuntime["Runtime<br/>(Stack/Heap)"]
        CExecutor["Executor"]
        CEvents["Event Emitter"]
    end

    subgraph PythonSimulator["Python Simulator"]
        PyFileManager["File Manager<br/>(/tmp)"]
        PyTracer["tracer.py<br/>(sys.settrace)"]
        PyDebugger["Debugger Client"]
    end

    subgraph JavaSimulator["Java Simulator"]
        JavaCompiler["Compiler<br/>(javac)"]
        JDWP["JDWP<br/>Debug Protocol"]
        JavaHandler["Event Handler"]
    end

    subgraph JSSimulator["JavaScript Simulator"]
        JSVM["Node.js VM<br/>(Isolated)"]
        JSHandler["Step Handler"]
    end

    subgraph Output["Output"]
        Steps["Steps Array"]
        Stdout["Standard Output"]
        Memory["Memory State"]
    end

    Code --> CParser --> CRuntime --> CExecutor --> CEvents --> Steps
    Code --> PyFileManager --> PyTracer --> PyDebugger --> Steps
    Code --> JavaCompiler --> JDWP --> JavaHandler --> Steps
    Code --> JSVM --> JSHandler --> Steps
```

## 6. Database Schema (ERD)

```mermaid
erDiagram
    User ||--o{ UserProgress : has
    User ||--o{ Submission : creates
    User ||--o{ ChatHistory : has
    User ||--o{ QuizAttempt : attempts
    User ||--|| UserStreak : has
    User ||--|| UserProfile : has

    Language ||--o{ Chapter : contains
    Language ||--o{ Lesson : contains

    Chapter ||--o{ Lesson : contains

    Lesson ||--|| LessonContent : has
    Lesson ||--o{ Quiz : contains
    Lesson ||--o{ UserProgress : tracks
    Lesson ||--o{ LessonActivity : logs

    Quiz ||--o{ QuizAttempt : has
    Quiz ||--o{ Note : has

    StandaloneQuiz ||--o{ StandaloneQuizAttempt : has

    User {
        uuid id PK
        string nickname UK
        string role
        datetime createdAt
    }

    Language {
        string id PK
        string name
        boolean isSequential
    }

    Chapter {
        string id PK
        string languageId FK
        string title
        int order
    }

    Lesson {
        string id PK
        string chapterId FK
        string title
        int difficulty
        int order
    }

    LessonContent {
        int id PK
        string lessonId FK
        json steps
        string code
    }

    UserProgress {
        int id PK
        uuid userId FK
        string lessonId FK
        string status
        int currentStep
    }
```

## 7. Code Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant Editor as Monaco Editor
    participant Store as Zustand Store
    participant API as Backend API
    participant Sim as Simulator
    participant Visual as Visualizer

    User->>Editor: Write code
    Editor->>Store: setCode(code)
    User->>Store: Run (click)
    Store->>API: POST /simulators/{lang}/run
    API->>Sim: Execute code

    loop Each Statement
        Sim->>Sim: Parse & Execute
        Sim->>Sim: Capture state
        Sim->>Sim: Generate events
    end

    Sim-->>API: Return steps[]
    API-->>Store: Response { steps, stdout }
    Store->>Store: setSteps(steps)
    Store->>Visual: Render step[0]

    loop Navigation
        User->>Store: nextStep()
        Store->>Visual: Render step[n]
        Visual->>Visual: Animate transition
    end
```

## 8. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant App as React App
    participant Firebase as Firebase Auth
    participant API as Backend API
    participant DB as PostgreSQL

    User->>App: Open app
    App->>Firebase: Check auth state

    alt Not logged in
        User->>App: Login (Email/Google)
        App->>Firebase: Authenticate
        Firebase-->>App: Firebase User + Token
    end

    App->>API: GET /users/me (with token)
    API->>Firebase: Verify token
    Firebase-->>API: User claims
    API->>DB: Find user

    alt User exists
        DB-->>API: AppUser
        API-->>App: User data
        App->>App: Show Dashboard
    else User not found
        API-->>App: 404 / needsRegistration
        App->>App: Show NicknameModal
        User->>App: Enter nickname
        App->>API: POST /users/register
        API->>DB: Create user
        App->>App: Show OnboardingModal
    end
```

## 9. Course Navigation Flow

```mermaid
flowchart TD
    A[Home Page] -->|Click Courses| B[Courses Page]
    B -->|GET /languages| C{Select Language}

    C -->|C| D1[C Course]
    C -->|Python| D2[Python Course]
    C -->|Java| D3[Java Course]
    C -->|JavaScript| D4[JS Course]

    D1 -->|GET /chapters| E[Chapter List]
    E -->|Select Chapter| F[Lesson List]
    F -->|GET /lessons/:id| G[Lesson Page]

    G --> H{Lesson Content}
    H --> I[Code Example]
    H --> J[Step Visualizer]
    H --> K[Quiz Section]

    K -->|Submit| L{Check Answer}
    L -->|Correct| M[Next Lesson]
    L -->|Wrong| N[Show Explanation]

    M -->|POST /progress| O[Update Progress]
    O --> P[Unlock Next]
```

## 10. State Management (Zustand)

```mermaid
graph TB
    subgraph Store["Main Store (store.ts)"]
        subgraph UI["UI State"]
            Sidebar["sidebarOpen"]
            PageTitle["pageTitle"]
            PageLang["pageLanguage"]
        end

        subgraph Auth["Auth State"]
            FirebaseUser["firebaseUser"]
            AppUser["appUser"]
            NeedsReg["needsRegistration"]
            AuthLoading["authLoading"]
        end

        subgraph Simulator["Simulator State"]
            Code["code"]
            Result["result"]
            Steps["steps[]"]
            CurrentStep["currentStep"]
            IsRunning["isRunning"]
        end

        subgraph Chat["Chat State"]
            Messages["messages[]"]
            IsAiLoading["isAiLoading"]
        end
    end

    subgraph ThemeStore["Theme Store"]
        Theme["theme: 'light' | 'dark'"]
    end

    subgraph LessonStore["Lesson History Store"]
        History["lessonHistory[]"]
    end

    Components["React Components"] --> Store
    Components --> ThemeStore
    Components --> LessonStore
```

## 11. API Routes Overview

```mermaid
graph LR
    subgraph V1["/api/v1"]
        subgraph Simulators["/simulators"]
            C["/c/run"]
            Python["/python/run"]
            Java["/java/run"]
            JS["/javascript/run"]
        end

        subgraph Courses["/courses"]
            Languages["/languages"]
            Chapters["/chapters/:id"]
            Lessons["/lessons/:id"]
            Progress["/progress"]
        end

        subgraph Users["/users"]
            Me["/me"]
            Register["/register"]
            Profile["/profile"]
        end

        subgraph AI["/ai"]
            Chat["/chat"]
            Explain["/explain"]
        end

        subgraph Analytics["/analytics"]
            Report["/report"]
        end

        subgraph Gamification["/gamification"]
            Streak["/streak"]
        end
    end
```

## 12. Deployment Architecture

```mermaid
graph TB
    subgraph Client["Clients"]
        Browser["Web Browser"]
        iOS["iOS App"]
        Android["Android App"]
    end

    subgraph Hosting["Hosting"]
        Vercel["Vercel<br/>(Frontend)"]
        Railway["Railway/Render<br/>(Backend)"]
    end

    subgraph Services["Cloud Services"]
        Neon["Neon<br/>PostgreSQL"]
        Firebase["Firebase<br/>Auth"]
        Ollama["Ollama<br/>(Self-hosted)"]
    end

    Browser --> Vercel
    iOS --> Vercel
    Android --> Vercel
    Vercel --> Railway
    Railway --> Neon
    Railway --> Firebase
    Railway --> Ollama
```

## 13. Visualizer Component Hierarchy

```mermaid
graph TB
    subgraph Playground["PlaygroundPage"]
        Editor["MonacoEditor"]
        Controls["Step Controls"]
        VisualizerContainer["Visualizer Container"]
    end

    subgraph CVisualizer["C Memory Visualizer"]
        CMemory["CMemoryView"]
        Stack["Stack Segments"]
        Heap["Heap Blocks"]
        Pointers["Pointer Arrows"]
    end

    subgraph FlowVisualizer["Flow Visualizer"]
        FlowView["FlowView<br/>(Python/JS)"]
        FunctionFrame["FunctionFrame"]
        VariableBox["VariableBox"]
        ArrowLayer["ArrowLayer"]
        ControlFlow["ControlFlowOverlay"]
    end

    subgraph JavaVisualizer["Java Visualizer"]
        JavaMemory["JavaMemoryView"]
        JavaFlow["JavaFlowView"]
        ObjectDiagram["Object Diagram"]
    end

    VisualizerContainer -->|C| CVisualizer
    VisualizerContainer -->|Python/JS| FlowVisualizer
    VisualizerContainer -->|Java| JavaVisualizer
```

## 14. Tech Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, Vite | UI Framework |
| | TailwindCSS | Styling |
| | Zustand | State Management |
| | React Query | Server State |
| | Monaco Editor | Code Editor |
| | Framer Motion | Animations |
| | Capacitor | Mobile Bridge |
| **Backend** | Express 5 | Web Framework |
| | Prisma | ORM |
| | Zod | Validation |
| | Winston | Logging |
| **Database** | PostgreSQL (Neon) | Primary DB |
| **Auth** | Firebase | Authentication |
| **AI** | Ollama/DeepSeek | LLM Integration |
| **Simulators** | GCC, sys.settrace, JDWP, VM | Code Execution |
