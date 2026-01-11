# Function Index

Grep-optimized function registry for quick lookup.

## Format
```
path:name:type:description
```

## Search Examples
```bash
grep "handleChat" funcindex.md        # find specific function
grep "routes.ts:" funcindex.md        # all functions in routes
grep ":HOOK:" funcindex.md            # all hooks
grep "streaming" funcindex.md         # functions related to streaming
```

---

## Backend

### modules/ai/
packages/backend/src/modules/ai/routes.ts:buildStepExplainPrompt:FUNC:generates system prompt for step explanation
packages/backend/src/modules/ai/routes.ts:buildExplainPrompt:FUNC:generates system prompt for code line explanation
packages/backend/src/modules/ai/routes.ts:buildChatPrompt:FUNC:generates system prompt for Q&A chat
packages/backend/src/modules/ai/routes.ts:aiRoutes:ROUTER:express router for AI endpoints
packages/backend/src/modules/ai/routes.ts:/explain:ROUTE:GET auto explanation for code line
packages/backend/src/modules/ai/routes.ts:/explain-step:ROUTE:POST step-by-step explanation (SSE streaming)
packages/backend/src/modules/ai/routes.ts:/chat:ROUTE:POST Q&A conversational chat
packages/backend/src/modules/ai/routes.ts:/chat/stream:ROUTE:POST streaming Q&A chat (SSE)
packages/backend/src/modules/ai/routes.ts:/health:ROUTE:GET AI provider health check
packages/backend/src/modules/ai/routes.ts:/providers:ROUTE:GET list available AI providers
packages/backend/src/modules/ai/routes.ts:/providers/switch:ROUTE:POST switch active AI provider
packages/backend/src/modules/ai/providers/ollama.provider.ts:OllamaProvider:CLASS:local LLM provider using Ollama
packages/backend/src/modules/ai/providers/ollama.provider.ts:isAvailable:METHOD:checks if Ollama server is reachable
packages/backend/src/modules/ai/providers/ollama.provider.ts:chat:METHOD:sends chat request to Ollama
packages/backend/src/modules/ai/providers/ollama.provider.ts:streamChat:METHOD:streaming chat request to Ollama (SSE)
packages/backend/src/modules/ai/providers/deepseek.provider.ts:DeepSeekProvider:CLASS:cloud AI provider using DeepSeek API
packages/backend/src/modules/ai/providers/deepseek.provider.ts:isAvailable:METHOD:checks if DeepSeek API key is configured
packages/backend/src/modules/ai/providers/deepseek.provider.ts:chat:METHOD:sends chat request to DeepSeek
packages/backend/src/modules/ai/providers/deepseek.provider.ts:streamChat:METHOD:streaming chat request to DeepSeek (SSE)
packages/backend/src/modules/ai/providers/index.ts:getCurrentProvider:FUNC:returns currently active AI provider
packages/backend/src/modules/ai/providers/index.ts:getProvider:FUNC:returns specific provider by type
packages/backend/src/modules/ai/providers/index.ts:getAllProviders:FUNC:returns list of all providers with status
packages/backend/src/modules/ai/providers/index.ts:setCurrentProvider:FUNC:switches active provider

### modules/c/
packages/backend/src/modules/c/executor.ts:FORBIDDEN_PATTERNS:CONST:regex patterns for banned C code (security)
packages/backend/src/modules/c/executor.ts:getExecErrorInfo:FUNC:extracts error info from exec exceptions
packages/backend/src/modules/c/executor.ts:checkCodeSecurity:FUNC:validates code against forbidden patterns
packages/backend/src/modules/c/executor.ts:runCCode:FUNC:compiles and executes C code with timeout
packages/backend/src/modules/c/executor.ts:judgeCode:FUNC:evaluates code against test cases
packages/backend/src/modules/c/routes.ts:cRoutes:ROUTER:express router for C execution
packages/backend/src/modules/c/routes.ts:validate:FUNC:middleware factory for Zod validation
packages/backend/src/modules/c/routes.ts:/run:ROUTE:POST compile and run C code
packages/backend/src/modules/c/routes.ts:/judge:ROUTE:POST judge code against test cases

### modules/courses/
packages/backend/src/modules/courses/routes.ts:courseRoutes:ROUTER:express router for courses API
packages/backend/src/modules/courses/routes.ts:/languages:ROUTE:GET list programming languages
packages/backend/src/modules/courses/routes.ts:/:lang/chapters:ROUTE:GET chapters by language
packages/backend/src/modules/courses/routes.ts:/chapters/:id:ROUTE:GET chapter details with lessons
packages/backend/src/modules/courses/routes.ts:/chapters/:id/progress:ROUTE:GET user chapter progress (auth)
packages/backend/src/modules/courses/routes.ts:/lessons/:id:ROUTE:GET lesson full content
packages/backend/src/modules/courses/routes.ts:/progress:ROUTE:GET user overall progress (auth)
packages/backend/src/modules/courses/routes.ts:/progress:ROUTE:POST update lesson progress (auth)
packages/backend/src/modules/courses/service.ts:getLanguages:FUNC:retrieves all active languages
packages/backend/src/modules/courses/service.ts:getLanguageWithChapters:FUNC:retrieves language with chapters
packages/backend/src/modules/courses/service.ts:getChapters:FUNC:retrieves chapters for language
packages/backend/src/modules/courses/service.ts:getChapterWithLessons:FUNC:retrieves chapter with lessons
packages/backend/src/modules/courses/service.ts:getLessons:FUNC:retrieves lessons for chapter
packages/backend/src/modules/courses/service.ts:getLessonFull:FUNC:retrieves complete lesson with content
packages/backend/src/modules/courses/service.ts:getUserProgress:FUNC:retrieves user progress
packages/backend/src/modules/courses/service.ts:getChapterProgress:FUNC:retrieves chapter progress
packages/backend/src/modules/courses/service.ts:updateProgress:FUNC:upserts user progress for lesson
packages/backend/src/modules/courses/service.ts:createLanguage:FUNC:creates new language (admin)
packages/backend/src/modules/courses/service.ts:createChapter:FUNC:creates chapter with metadata
packages/backend/src/modules/courses/service.ts:createLessonWithContent:FUNC:creates lesson with content and quizzes

### modules/users/
packages/backend/src/modules/users/routes.ts:userRoutes:ROUTER:express router for user management
packages/backend/src/modules/users/routes.ts:NICKNAME_REGEX:CONST:pattern for valid nicknames
packages/backend/src/modules/users/routes.ts:RESERVED_NICKNAMES:CONST:list of forbidden nicknames
packages/backend/src/modules/users/routes.ts:validate:FUNC:middleware for Zod validation
packages/backend/src/modules/users/routes.ts:/:ROUTE:GET list all users (admin)
packages/backend/src/modules/users/routes.ts:/check-nickname/:nickname:ROUTE:GET nickname availability check
packages/backend/src/modules/users/routes.ts:/register:ROUTE:POST user registration with OAuth
packages/backend/src/modules/users/routes.ts:/me:ROUTE:GET current user info
packages/backend/src/modules/users/routes.ts:/me/role:ROUTE:GET current user role
packages/backend/src/modules/users/routes.ts:/link-oauth:ROUTE:POST link additional OAuth account

### services/
packages/backend/src/services/lessonContentLoader.ts:LessonContentLoader:CLASS:singleton for loading JSON lesson content
packages/backend/src/services/lessonContentLoader.ts:loadAll:METHOD:loads all lesson JSON files into cache
packages/backend/src/services/lessonContentLoader.ts:watchDirectory:METHOD:sets up file watchers for HMR
packages/backend/src/services/lessonContentLoader.ts:cleanup:METHOD:closes file watchers on shutdown
packages/backend/src/services/lessonContentLoader.ts:getContent:METHOD:retrieves cached lesson content by ID
packages/backend/src/services/lessonContentLoader.ts:getCachedCount:METHOD:returns number of cached lessons
packages/backend/src/services/lessonContentLoader.ts:hasContent:METHOD:checks if lesson exists in cache

### config/
packages/backend/src/config/env.ts:envSchema:CONST:Zod schema for env validation
packages/backend/src/config/env.ts:env:EXPORT:parsed environment variables
packages/backend/src/config/env.ts:corsOrigins:FUNC:converts CORS string to array
packages/backend/src/config/database.ts:pool:CONST:pg connection pool instance
packages/backend/src/config/database.ts:prisma:EXPORT:PrismaClient instance

---

## Frontend

### features/courses/
packages/frontend/src/features/courses/CoursesPage.tsx:CoursesPage:PAGE:language selection page with cards
packages/frontend/src/features/courses/LanguageCoursePage.tsx:LanguageCoursePage:PAGE:chapters for selected language
packages/frontend/src/features/courses/ChapterLessonsPage.tsx:ChapterLessonsPage:PAGE:lessons for selected chapter
packages/frontend/src/features/courses/LessonPage.tsx:LessonPage:PAGE:main lesson learning page
packages/frontend/src/features/courses/LessonPage.tsx:LoadingView:COMPONENT:loading spinner view
packages/frontend/src/features/courses/LessonPage.tsx:NotFoundView:COMPONENT:error/not found view
packages/frontend/src/features/courses/LessonPage.tsx:CompletedView:COMPONENT:lesson completion celebration
packages/frontend/src/features/courses/LessonPage.tsx:QuizCardAdapter:COMPONENT:quiz card with options
packages/frontend/src/features/courses/hooks/useLessonNavigation.ts:useLessonNavigation:HOOK:manages lesson flow (steps→quiz→completed)
packages/frontend/src/features/courses/hooks/useLessonVisualization.ts:useLessonVisualization:HOOK:manages memory and JS visualizations
packages/frontend/src/features/courses/hooks/useLessonVisualization.ts:useLessonMemory:HOOK:deprecated alias for useLessonVisualization
packages/frontend/src/features/courses/hooks/useLessonVisualization.ts:convertCumulativeFormat:FUNC:converts cumulative memory to visual format
packages/frontend/src/features/courses/hooks/useLessonVisualization.ts:convertToVisualFormat:FUNC:transforms memory changes to visualization
packages/frontend/src/features/courses/hooks/useLessonVisualization.ts:accumulateMemoryChanges:FUNC:accumulates memory changes to current step
packages/frontend/src/features/courses/hooks/useLessonVisualization.ts:detectFormat:FUNC:detects memory format (new-array, legacy-action, cumulative)
packages/frontend/src/features/courses/hooks/useLessonVisualization.ts:detectVisualizationType:FUNC:identifies visualization type from step
packages/frontend/src/features/courses/hooks/useCodeSelection.ts:useCodeSelection:HOOK:manages code text selection for AI context
packages/frontend/src/features/courses/components/CourseGrid.tsx:CourseGrid:COMPONENT:fixed column grid (2 cols mobile, 3 tablet, 4 desktop)
packages/frontend/src/features/courses/components/ChapterCard.tsx:ChapterCard:COMPONENT:aspect-square chapter card with responsive sizing
packages/frontend/src/features/courses/components/LessonCard.tsx:LessonCard:COMPONENT:lesson card with difficulty indicator
packages/frontend/src/features/courses/components/day/CodeViewer.tsx:CodeViewer:COMPONENT:read-only code viewer with highlighting
packages/frontend/src/features/courses/components/day/CodeViewer.tsx:HighlightedLine:COMPONENT:line with C syntax highlighting
packages/frontend/src/features/courses/components/day/StepExplanation.tsx:StepExplanation:COMPONENT:animated step explanation
packages/frontend/src/features/courses/components/day/StepExplanation.tsx:formatExplanation:FUNC:formats explanation with bold markers
packages/frontend/src/features/courses/components/day/SelectedCodeBadge.tsx:SelectedCodeBadge:COMPONENT:badge showing selected code
packages/frontend/src/features/courses/components/memory/CourseMemoryView.tsx:CourseMemoryView:COMPONENT:integrates MemoryPanel with ReturnOverlay
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:MemoryPanel:COMPONENT:main memory viz (lesson: address table, playground: simple list)
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:RegisterPanel:COMPONENT:displays RBP/RSP with dynamic values and tooltips
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:AddressBasedStackSection:COMPONENT:address ruler + frame columns (lesson mode)
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:StackCell:COMPONENT:individual block in address table row
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:HeapSection:COMPONENT:heap memory visualization
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:SimpleStackSection:COMPONENT:simple stack list (playground mode)
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:FilledSlot:COMPONENT:filled memory slot with value display
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:EmptySlot:COMPONENT:empty slot with dashed border
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:ArraySlot:COMPONENT:expandable array slot
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:isGarbageValue:FUNC:detects uninitialized/garbage values
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:REGISTER_TOOLTIPS:CONST:RBP/RSP tooltip descriptions
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:BASE_STACK_ADDR:CONST:base stack address (0x7FFFFFFC)
packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx:HEAP_ADDRESSES:CONST:predefined heap addresses

### features/chat/
packages/frontend/src/features/chat/ChatQA.tsx:ChatQA:COMPONENT:Q&A chat interface with streaming
packages/frontend/src/features/chat/hooks/useChatQA.ts:useChatQA:HOOK:manages chat state with localStorage (24h expiry)
packages/frontend/src/features/chat/hooks/useChatQA.ts:getStorageKey:FUNC:generates storage key for lesson context
packages/frontend/src/features/chat/hooks/useChatQA.ts:loadMessages:FUNC:loads messages from localStorage
packages/frontend/src/features/chat/hooks/useChatQA.ts:saveMessages:FUNC:saves messages to localStorage

### features/playground/
packages/frontend/src/features/playground/PlaygroundPage.tsx:PlaygroundPage:PAGE:multilanguage code simulator
packages/frontend/src/features/playground/stores/playgroundStore.ts:usePlaygroundStore:STORE:Zustand store for playground state
packages/frontend/src/features/playground/stores/playgroundStore.ts:useLanguage:HOOK:selector for current language
packages/frontend/src/features/playground/stores/playgroundStore.ts:useCurrentCode:HOOK:selector for current code
packages/frontend/src/features/playground/stores/playgroundStore.ts:useSimulationState:HOOK:selector for simulation state
packages/frontend/src/features/playground/stores/playgroundStore.ts:useStepControls:HOOK:selector for step control actions
packages/frontend/src/features/playground/stores/playgroundStore.ts:nextStep:FUNC:moves to next simulation step
packages/frontend/src/features/playground/stores/playgroundStore.ts:prevStep:FUNC:moves to previous step
packages/frontend/src/features/playground/stores/playgroundStore.ts:goToStep:FUNC:jumps to specific step
packages/frontend/src/features/playground/stores/playgroundStore.ts:reset:FUNC:resets simulation state
packages/frontend/src/features/playground/stores/explanationStore.ts:useExplanationStore:STORE:Zustand store for AI explanation prefetch
packages/frontend/src/features/playground/stores/explanationStore.ts:getCodeAtLine:FUNC:extracts code at line from fullCode (LessonStep helper)
packages/frontend/src/features/playground/components/LanguageTabs.tsx:LanguageTabs:COMPONENT:language selection tabs (C/Python/Java)
packages/frontend/src/features/playground/components/CodeEditor.tsx:CodeEditor:COMPONENT:Monaco Editor for code input
packages/frontend/src/features/playground/components/StepControls.tsx:StepControls:COMPONENT:prev/next/run buttons with counter
packages/frontend/src/features/playground/components/StepExplanation.tsx:StepExplanation:COMPONENT:displays explanation for step
packages/frontend/src/features/playground/components/VisualizerPanel.tsx:VisualizerPanel:COMPONENT:renders visualizer (memory, terminal)

### features/visualizers/
packages/frontend/src/features/visualizers/c/index.tsx:CMemoryView:COMPONENT:C memory viz with stack/heap
packages/frontend/src/features/visualizers/c/index.tsx:getPointerColor:FUNC:gets pointer arrow color
packages/frontend/src/features/visualizers/c/index.tsx:SEGMENT_COLORS:CONST:color mappings for memory segments
packages/frontend/src/features/visualizers/c/index.tsx:POINTER_PALETTE:CONST:color palette for pointer arrows
packages/frontend/src/features/visualizers/python/PyVisualizerView.tsx:PyVisualizerView:COMPONENT:Python object reference viz
packages/frontend/src/features/visualizers/python/components/NamesPanel.tsx:NamesPanel:COMPONENT:displays Python name bindings
packages/frontend/src/features/visualizers/python/components/ObjectsPanel.tsx:ObjectsPanel:COMPONENT:displays Python objects on heap
packages/frontend/src/features/visualizers/python/components/ObjectCard.tsx:ObjectCard:COMPONENT:individual Python object card
packages/frontend/src/features/visualizers/python/components/ReferenceArrow.tsx:ReferenceArrow:COMPONENT:arrows showing variable refs
packages/frontend/src/features/visualizers/python/components/ReferenceArrow.tsx:ArrowOverlay:COMPONENT:overlay for reference arrows
packages/frontend/src/features/visualizers/js/JSVisualizerView.tsx:JSVisualizerView:COMPONENT:JS visualization dispatcher
packages/frontend/src/features/visualizers/js/components/EventLoopView.tsx:EventLoopView:COMPONENT:visualizes JS event loop
packages/frontend/src/features/visualizers/shared/CallStackView.tsx:CallStackView:COMPONENT:shared call stack viz
packages/frontend/src/features/visualizers/shared/CallStackView.tsx:StackFrameItem:COMPONENT:individual stack frame
packages/frontend/src/features/visualizers/shared/CallStackView.tsx:EmptyStack:COMPONENT:empty stack display
packages/frontend/src/features/visualizers/shared/ReturnOverlay.tsx:ReturnOverlay:COMPONENT:animates stack frame pop
packages/frontend/src/features/visualizers/shared/ReturnOverlay.tsx:ReturnArrow:COMPONENT:arrow showing return value flow
packages/frontend/src/features/visualizers/shared/components/TerminalOutput.tsx:TerminalOutput:COMPONENT:VSCode-style terminal output

### features/home/
packages/frontend/src/features/home/HomePage.tsx:HomePage:PAGE:landing page with story panels
packages/frontend/src/features/home/HomePage.tsx:StoryPanel:COMPONENT:SVG story visualization
packages/frontend/src/features/home/MatrixRain.tsx:MatrixRain:COMPONENT:Matrix code rain effect

### features/admin/
packages/frontend/src/features/admin/AdminPage.tsx:AdminPage:PAGE:admin dashboard with stats
packages/frontend/src/features/admin/components/AdminRoute.tsx:AdminRoute:COMPONENT:route guard for admin pages
packages/frontend/src/features/admin/components/AIProviderToggle.tsx:AIProviderToggle:COMPONENT:toggle AI providers

### services/
packages/frontend/src/services/courses.ts:getLanguages:FUNC:fetches available languages
packages/frontend/src/services/courses.ts:getChapters:FUNC:fetches chapters for language
packages/frontend/src/services/courses.ts:getChapterWithLessons:FUNC:fetches chapter with lessons
packages/frontend/src/services/courses.ts:getLessonFull:FUNC:fetches complete lesson
packages/frontend/src/services/courses.ts:getUserProgress:FUNC:fetches user progress
packages/frontend/src/services/courses.ts:updateProgress:FUNC:updates lesson progress to server
packages/frontend/src/services/ai.ts:getExplanation:FUNC:gets auto explanation for code line
packages/frontend/src/services/ai.ts:explainStep:FUNC:gets detailed explanation with memory
packages/frontend/src/services/ai.ts:askAI:FUNC:sends chat message to AI
packages/frontend/src/services/ai.ts:askAIStream:FUNC:sends chat message with streaming
packages/frontend/src/services/simulator.ts:simulatorService.simulate:FUNC:runs code simulation
packages/frontend/src/services/simulator.ts:parseSimulationResult:FUNC:converts backend response to frontend
packages/frontend/src/services/user.ts:checkNickname:FUNC:checks if nickname is available
packages/frontend/src/services/user.ts:registerNickname:FUNC:registers user nickname
packages/frontend/src/services/admin.ts:getAdminStats:FUNC:fetches admin dashboard stats
packages/frontend/src/services/admin.ts:getSystemStatus:FUNC:fetches system health status
packages/frontend/src/services/firebase.ts:initializeAuth:FUNC:initializes Firebase auth
packages/frontend/src/services/firebase.ts:signInWithGoogle:FUNC:signs in with Google OAuth
packages/frontend/src/services/firebase.ts:signInWithGithub:FUNC:signs in with GitHub OAuth
packages/frontend/src/services/firebase.ts:signInWithKakao:FUNC:signs in with Kakao OAuth
packages/frontend/src/services/firebase.ts:signOut:FUNC:signs out current user

### stores/
packages/frontend/src/stores/store.ts:useStore:STORE:global app state (auth, messages, code)
packages/frontend/src/stores/store.ts:setFirebaseUser:FUNC:sets Firebase user
packages/frontend/src/stores/store.ts:setAppUser:FUNC:sets app user from DB
packages/frontend/src/stores/store.ts:addMessage:FUNC:adds message to chat
packages/frontend/src/stores/store.ts:setAiLoading:FUNC:sets AI loading state
packages/frontend/src/stores/store.ts:clearMessages:FUNC:clears chat messages
packages/frontend/src/stores/store.ts:setCode:FUNC:updates code
packages/frontend/src/stores/store.ts:setResult:FUNC:sets execution result
packages/frontend/src/stores/store.ts:setRunning:FUNC:sets running state
packages/frontend/src/stores/store.ts:setSteps:FUNC:updates simulation steps
packages/frontend/src/stores/store.ts:setCurrentStep:FUNC:sets current step index
packages/frontend/src/stores/store.ts:nextStep:FUNC:moves to next step
packages/frontend/src/stores/store.ts:prevStep:FUNC:moves to previous step
packages/frontend/src/stores/lessonHistoryStore.ts:useLessonHistoryStore:STORE:lesson history with persistence (max 5)
packages/frontend/src/stores/lessonHistoryStore.ts:addEntry:FUNC:adds lesson to history
packages/frontend/src/stores/lessonHistoryStore.ts:removeEntry:FUNC:removes lesson from history
packages/frontend/src/stores/lessonHistoryStore.ts:clearHistory:FUNC:clears all history
packages/frontend/src/stores/lessonHistoryStore.ts:getEntriesByLanguage:FUNC:gets history for language

### layouts/
packages/frontend/src/layouts/MainLayout.tsx:MainLayout:COMPONENT:main app layout (sidebar+topbar)
packages/frontend/src/layouts/Sidebar.tsx:Sidebar:COMPONENT:navigation sidebar
packages/frontend/src/layouts/TopBar.tsx:TopBar:COMPONENT:top navigation bar

### components/
packages/frontend/src/components/NicknameModal.tsx:NicknameModal:COMPONENT:modal for nickname registration
packages/frontend/src/components/PixelAvatar.tsx:PixelAvatar:COMPONENT:generates pixel art avatar

### lib/
packages/frontend/src/lib/utils.ts:cn:FUNC:combines classnames with clsx+tailwind-merge

### config/
packages/frontend/src/config/index.ts:config:CONST:API endpoints and configuration
packages/frontend/src/config/env.ts:parseEnv:FUNC:parses env variables with Zod
packages/frontend/src/config/theme.ts:theme:CONST:CSS theme variables

### hooks/
packages/frontend/src/hooks/useTheme.ts:useTheme:HOOK:manages app theme (light/dark)
packages/frontend/src/hooks/useEnterKey.ts:useEnterKey:HOOK:Enter key submit handler for forms/quizzes

---

## Type Legend
- FUNC: Function
- HOOK: React Hook
- COMPONENT: React Component
- PAGE: Page Component (route)
- STORE: Zustand Store
- CLASS: TypeScript Class
- METHOD: Class Method
- CONST: Constant/Config
- ROUTE: API Endpoint
- ROUTER: Express Router
- EXPORT: Module Export
