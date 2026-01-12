--
-- PostgreSQL database dump
--

\restrict kbIyN7ifAEEhhZs8wTTPl1pbKRlbHoqCkAXhGUPa8mh3oBUCHk7bNFfpktbrPWV

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chapters; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.chapters (
    id text NOT NULL,
    language_id text NOT NULL,
    title text NOT NULL,
    description text,
    key_question text,
    part text DEFAULT 'syntax'::text NOT NULL,
    part_label text,
    "order" integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.chapters OWNER TO codeinsight;

--
-- Name: drafts; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.drafts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    problem_id uuid NOT NULL,
    code text NOT NULL,
    saved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.drafts OWNER TO codeinsight;

--
-- Name: languages; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.languages (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    is_active boolean DEFAULT true NOT NULL,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.languages OWNER TO codeinsight;

--
-- Name: lesson_contents; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.lesson_contents (
    id text NOT NULL,
    lesson_id text NOT NULL,
    code text NOT NULL,
    language text NOT NULL,
    steps jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.lesson_contents OWNER TO codeinsight;

--
-- Name: lessons; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.lessons (
    id text NOT NULL,
    chapter_id text NOT NULL,
    title text NOT NULL,
    description text,
    difficulty text DEFAULT 'basic'::text NOT NULL,
    "order" integer NOT NULL,
    estimated_time integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.lessons OWNER TO codeinsight;

--
-- Name: oauth_accounts; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.oauth_accounts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    provider_id text NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.oauth_accounts OWNER TO codeinsight;

--
-- Name: problems; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.problems (
    id uuid NOT NULL,
    number integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    difficulty character varying(20) DEFAULT 'bronze_5'::character varying NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    source text,
    src_url text,
    hints jsonb DEFAULT '[]'::jsonb NOT NULL,
    solution text,
    test_cases jsonb DEFAULT '[]'::jsonb NOT NULL,
    time_limit integer DEFAULT 1000 NOT NULL,
    memory_limit integer DEFAULT 256 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.problems OWNER TO codeinsight;

--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.quizzes (
    id text NOT NULL,
    lesson_id text NOT NULL,
    type text NOT NULL,
    question text NOT NULL,
    options jsonb,
    answer text NOT NULL,
    explanation text,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.quizzes OWNER TO codeinsight;

--
-- Name: submissions; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.submissions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    problem_id uuid NOT NULL,
    code text NOT NULL,
    verdict text DEFAULT 'judging'::text NOT NULL,
    execution_time integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.submissions OWNER TO codeinsight;

--
-- Name: user_progress; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.user_progress (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    lesson_id text NOT NULL,
    status text DEFAULT 'not_started'::text NOT NULL,
    current_step integer DEFAULT 0 NOT NULL,
    quiz_score integer,
    quiz_total integer,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_progress OWNER TO codeinsight;

--
-- Name: users; Type: TABLE; Schema: public; Owner: codeinsight
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    nickname text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO codeinsight;

--
-- Data for Name: chapters; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.chapters (id, language_id, title, description, key_question, part, part_label, "order", is_active, created_at, updated_at) FROM stdin;
c-1	c	변수와 메모리 모델	변수가 메모리에 어떻게 저장되는지 시각적으로 이해	변수는 메모리 어디에, 어떤 형태로 저장되는가?	syntax	문법/실행	1	t	2026-01-07 07:45:37.664+00	2026-01-07 07:45:37.664+00
c-2	c	포인터 기본	포인터는 주소를 담는 변수 - Two-Level 개념 확립	포인터와 포인티, 둘 다 필요한 이유는?	syntax	문법/실행	2	t	2026-01-07 07:45:37.839+00	2026-01-07 07:45:37.839+00
c-3	c	배열과 포인터	배열은 연속된 메모리 블록, 배열명은 첫 번째 요소의 주소	arr과 &arr[0]은 정말 같은가?	syntax	문법/실행	3	t	2026-01-07 07:45:38.046+00	2026-01-07 07:45:38.046+00
c-4	c	함수와 메모리	Call by Value의 진실과 스택 프레임	함수 매개변수를 수정하면 원본도 바뀌는가?	design	설계/구조	4	t	2026-01-07 07:45:38.212+00	2026-01-07 07:45:38.212+00
c-5	c	동적 메모리	Heap 영역과 수동 메모리 관리	malloc이 반환한 메모리는 언제까지 유효한가?	design	설계/구조	5	t	2026-01-07 07:45:38.369+00	2026-01-07 07:45:38.369+00
c-6	c	구조체와 문자열	복합 데이터 타입의 메모리 구조	구조체와 문자열은 메모리에 어떻게 저장되는가?	design	설계/구조	6	t	2026-01-07 07:45:38.567+00	2026-01-07 07:45:38.567+00
\.


--
-- Data for Name: drafts; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.drafts (id, user_id, problem_id, code, saved_at) FROM stdin;
\.


--
-- Data for Name: languages; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.languages (id, name, description, icon, color, is_active, "order", created_at, updated_at) FROM stdin;
c	C	포인터와 메모리를 직접 다루는 시스템 프로그래밍 언어	C	#00599C	t	1	2026-01-07 07:45:37.591+00	2026-01-07 07:45:37.591+00
python	Python	간결하고 읽기 쉬운 문법의 고급 프로그래밍 언어	🐍	#3776AB	t	2	2026-01-07 07:45:37.62+00	2026-01-07 07:45:37.62+00
java	Java	객체지향 프로그래밍과 JVM 기반 언어	☕	#007396	t	3	2026-01-07 07:45:37.632+00	2026-01-07 07:45:37.632+00
javascript	JavaScript	웹 개발의 핵심 언어, 비동기와 프로토타입	⚡	#F7DF1E	t	4	2026-01-07 07:45:37.646+00	2026-01-07 07:45:37.646+00
\.


--
-- Data for Name: lesson_contents; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.lesson_contents (id, lesson_id, code, language, steps, created_at, updated_at) FROM stdin;
content-c-1-1	c-1-1	#include <stdio.h>\n\nint main() {\n    int a;\n    printf("a의 값: %d\\n", a);\n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"변수 선언\\",\\"explanation\\":\\"int a;는 4바이트 메모리 공간을 스택에 예약합니다. 이 시점에서 a에는 '쓰레기 값'이 들어있습니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":\\"???\\",\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":5,\\"title\\":\\"쓰레기 값 출력\\",\\"explanation\\":\\"초기화하지 않은 변수를 읽으면 이전에 그 메모리에 있던 값이 출력됩니다. 매번 다른 값이 나올 수 있습니다.\\",\\"highlight\\":[5],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.704+00	2026-01-07 07:45:37.704+00
content-c-1-2	c-1-2	#include <stdio.h>\n\nint main() {\n    int a = 10;\n    int b = 20;\n    a = 30;\n    printf("a=%d, b=%d\\n", a, b);\n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"변수 선언과 초기화\\",\\"explanation\\":\\"int a = 10;은 두 가지 작업을 합니다: 1) 4바이트 공간 할당, 2) 그 공간에 10 저장\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":5,\\"title\\":\\"두 번째 변수 초기화\\",\\"explanation\\":\\"b도 스택에 연속해서 할당됩니다. 주소가 a보다 낮은 것에 주목하세요 (스택은 아래로 자람).\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"b\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":20,\\"address\\":\\"0x7ffc0ffc\\"}]},{\\"line\\":6,\\"title\\":\\"값 변경 (재할당)\\",\\"explanation\\":\\"a = 30;은 a의 메모리 위치(0x7ffc1000)에 새 값 30을 덮어씁니다. 메모리 크기는 변하지 않습니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":30,\\"previousValue\\":10,\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":7,\\"title\\":\\"값 출력\\",\\"explanation\\":\\"a=30, b=20이 출력됩니다. 각 변수는 독립적인 메모리 공간을 가집니다.\\",\\"highlight\\":[7],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.743+00	2026-01-07 07:45:37.743+00
content-c-1-3	c-1-3	#include <stdio.h>\n\nint main() {\n    int a = 10;\n    char c = 'A';\n    double d = 3.14;\n    \n    printf("a: 주소=%p, 크기=%lu\\n", &a, sizeof(a));\n    printf("c: 주소=%p, 크기=%lu\\n", &c, sizeof(c));\n    printf("d: 주소=%p, 크기=%lu\\n", &d, sizeof(d));\n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"int 변수 할당\\",\\"explanation\\":\\"int는 4바이트를 차지합니다. &a는 이 변수의 시작 주소를 의미합니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":5,\\"title\\":\\"char 변수 할당\\",\\"explanation\\":\\"char는 1바이트만 차지합니다. 'A'는 ASCII 코드 65로 저장됩니다.\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"c\\",\\"type\\":\\"char\\",\\"size\\":1,\\"value\\":\\"'A' (65)\\",\\"address\\":\\"0x7ffc0fff\\"}]},{\\"line\\":6,\\"title\\":\\"double 변수 할당\\",\\"explanation\\":\\"double은 8바이트를 차지합니다. 더 정밀한 소수점을 저장할 수 있습니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"d\\",\\"type\\":\\"double\\",\\"size\\":8,\\"value\\":3.14,\\"address\\":\\"0x7ffc0ff0\\"}]},{\\"line\\":8,\\"title\\":\\"주소와 크기 출력\\",\\"explanation\\":\\"&a는 변수 a의 메모리 주소를 반환합니다. sizeof(a)는 a의 바이트 크기를 반환합니다.\\",\\"highlight\\":[8,9,10],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.78+00	2026-01-07 07:45:37.78+00
content-c-1-4	c-1-4	#include <stdio.h>\n\nvoid foo() {\n    int local = 100;\n    printf("foo 안: local=%d\\n", local);\n}\n\nint main() {\n    int x = 10;\n    foo();\n    printf("main: x=%d\\n", x);\n    return 0;\n}	c	"[{\\"line\\":9,\\"title\\":\\"main 시작 - 스택 프레임 생성\\",\\"explanation\\":\\"main() 함수가 시작되면 스택에 main의 프레임이 생성되고, x가 할당됩니다.\\",\\"highlight\\":[9],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"main\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"x\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc2000\\",\\"frame\\":\\"main\\"}]},{\\"line\\":10,\\"title\\":\\"foo() 호출 - 새 스택 프레임\\",\\"explanation\\":\\"foo()가 호출되면 main 위에 foo의 스택 프레임이 쌓입니다.\\",\\"highlight\\":[10,3],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"foo\\",\\"type\\":\\"frame\\"}]},{\\"line\\":4,\\"title\\":\\"foo 안에서 local 생성\\",\\"explanation\\":\\"local은 foo의 스택 프레임 안에 할당됩니다. main의 x와는 완전히 별개입니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"local\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":100,\\"address\\":\\"0x7ffc1ff0\\",\\"frame\\":\\"foo\\"}]},{\\"line\\":6,\\"title\\":\\"foo 종료 - 스택 프레임 해제\\",\\"explanation\\":\\"foo()가 끝나면 foo의 스택 프레임 전체가 해제됩니다. local도 함께 사라집니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[{\\"action\\":\\"deallocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"local\\",\\"frame\\":\\"foo\\"},{\\"action\\":\\"frame_end\\",\\"area\\":\\"stack\\",\\"name\\":\\"foo\\"}]},{\\"line\\":11,\\"title\\":\\"main으로 복귀\\",\\"explanation\\":\\"main의 x는 여전히 존재합니다. 각 함수의 지역 변수는 독립적입니다.\\",\\"highlight\\":[11],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.818+00	2026-01-07 07:45:37.818+00
content-c-2-1	c-2-1	#include <stdio.h>\n\nint main() {\n    int a = 10;\n    \n    printf("a의 값: %d\\n", a);\n    printf("a의 주소: %p\\n", &a);\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"변수 a 생성\\",\\"explanation\\":\\"a는 메모리 주소 0x7ffc1000에 할당되고, 값 10이 저장됩니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":6,\\"title\\":\\"값 출력\\",\\"explanation\\":\\"a를 사용하면 a에 저장된 '값' 10을 가져옵니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[]},{\\"line\\":7,\\"title\\":\\"주소 출력\\",\\"explanation\\":\\"&a는 a의 '주소' 0x7ffc1000을 반환합니다. 값이 아닌 위치 정보입니다.\\",\\"highlight\\":[7],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.866+00	2026-01-07 07:45:37.866+00
content-c-2-2	c-2-2	#include <stdio.h>\n\nint main() {\n    int a = 10;\n    int *p;\n    \n    p = &a;\n    \n    printf("a의 값: %d\\n", a);\n    printf("p의 값: %p\\n", p);\n    printf("a의 주소: %p\\n", &a);\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"일반 변수 생성\\",\\"explanation\\":\\"a는 값 10을 저장합니다. 이것이 나중에 포인터가 '가리킬 대상'(pointee)이 됩니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":5,\\"title\\":\\"포인터 선언 (Two-Level: Level 1만 존재)\\",\\"explanation\\":\\"int *p;는 '정수의 주소를 저장할 수 있는' 변수 p를 만듭니다. 아직 p는 아무것도 가리키지 않습니다!\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"??? (쓰레기)\\",\\"address\\":\\"0x7ffc0ff8\\"}]},{\\"line\\":7,\\"title\\":\\"포인터에 주소 할당 (Two-Level 완성)\\",\\"explanation\\":\\"p = &a;로 p에 a의 주소를 저장합니다. 이제 p는 a를 '가리킵니다'. Two-Level이 완성됩니다!\\",\\"highlight\\":[7],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"value\\":\\"0x7ffc1000\\",\\"previousValue\\":\\"???\\",\\"pointsTo\\":\\"a\\"}]},{\\"line\\":10,\\"title\\":\\"p의 값 = a의 주소\\",\\"explanation\\":\\"p에 저장된 값은 0x7ffc1000, 이것은 a의 주소와 같습니다.\\",\\"highlight\\":[10,11],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.899+00	2026-01-07 07:45:37.899+00
content-c-2-3	c-2-3	#include <stdio.h>\n\nint main() {\n    int a = 10;\n    int *p = &a;\n    \n    printf("a의 값: %d\\n", a);\n    printf("p가 가리키는 값: %d\\n", *p);\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"변수 a 생성\\",\\"explanation\\":\\"a에 값 10이 저장됩니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":5,\\"title\\":\\"포인터 p가 a를 가리킴\\",\\"explanation\\":\\"p는 a의 주소를 저장합니다. 화살표로 표현하면 p → a 관계입니다.\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"address\\":\\"0x7ffc0ff8\\",\\"pointsTo\\":\\"a\\"}]},{\\"line\\":7,\\"title\\":\\"a의 값 직접 읽기\\",\\"explanation\\":\\"a를 사용하면 직접 10을 가져옵니다.\\",\\"highlight\\":[7],\\"memoryChanges\\":[]},{\\"line\\":8,\\"title\\":\\"역참조로 값 읽기\\",\\"explanation\\":\\"*p는 '포인터 따라가기'입니다. p(0x7ffc1000) → 그 주소의 값(10). a와 *p는 같은 결과!\\",\\"highlight\\":[8],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.928+00	2026-01-07 07:45:37.928+00
content-c-2-4	c-2-4	#include <stdio.h>\n\nint main() {\n    int a = 10;\n    int *p = &a;\n    \n    printf("변경 전 a: %d\\n", a);\n    \n    *p = 20;\n    \n    printf("변경 후 a: %d\\n", a);\n    printf("변경 후 *p: %d\\n", *p);\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"a에 10 저장\\",\\"explanation\\":\\"a가 생성되고 10이 저장됩니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":5,\\"title\\":\\"p가 a를 가리킴\\",\\"explanation\\":\\"p는 a의 주소를 저장합니다.\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"address\\":\\"0x7ffc0ff8\\",\\"pointsTo\\":\\"a\\"}]},{\\"line\\":9,\\"title\\":\\"역참조로 값 변경!\\",\\"explanation\\":\\"*p = 20;은 p가 가리키는 주소(a의 위치)에 20을 저장합니다. a 자체가 변경됩니다!\\",\\"highlight\\":[9],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"value\\":20,\\"previousValue\\":10,\\"updatedVia\\":\\"p\\"}]},{\\"line\\":11,\\"title\\":\\"변경 확인\\",\\"explanation\\":\\"a를 직접 읽어도 20입니다. *p로 읽어도 20입니다. 같은 메모리를 가리키기 때문입니다.\\",\\"highlight\\":[11,12],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.961+00	2026-01-07 07:45:37.961+00
content-c-2-5	c-2-5	#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int *p1;           // 위험! 초기화 안됨\n    int *p2 = NULL;    // 안전! 명시적 NULL\n    \n    // *p1 = 10;  // 위험! 어디에 쓸지 모름\n    // *p2 = 10;  // 에러! NULL 역참조\n    \n    if (p2 == NULL) {\n        printf("p2는 아무것도 가리키지 않음\\n");\n    }\n    \n    return 0;\n}	c	"[{\\"line\\":5,\\"title\\":\\"초기화되지 않은 포인터 (위험!)\\",\\"explanation\\":\\"p1은 쓰레기 주소를 가집니다. 어떤 메모리를 가리키는지 알 수 없습니다. 역참조하면 프로그램이 크래시할 수 있습니다!\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p1\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x???????? (쓰레기)\\",\\"address\\":\\"0x7ffc1000\\",\\"danger\\":true}]},{\\"line\\":6,\\"title\\":\\"NULL 초기화 (안전!)\\",\\"explanation\\":\\"p2 = NULL은 '아무것도 가리키지 않음'을 명시적으로 표현합니다. NULL은 주소 0입니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p2\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"NULL (0x0)\\",\\"address\\":\\"0x7ffc0ff8\\",\\"safe\\":true}]},{\\"line\\":8,\\"title\\":\\"쓰레기 포인터 역참조 (금지!)\\",\\"explanation\\":\\"*p1 = 10;은 임의의 메모리에 쓰는 것입니다. 시스템 메모리를 덮어쓸 수도 있습니다!\\",\\"highlight\\":[8],\\"memoryChanges\\":[]},{\\"line\\":11,\\"title\\":\\"NULL 체크\\",\\"explanation\\":\\"포인터 사용 전 NULL 체크는 좋은 습관입니다. NULL이면 역참조하지 않습니다.\\",\\"highlight\\":[11,12,13],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:37.99+00	2026-01-07 07:45:37.99+00
content-c-2-6	c-2-6	#include <stdio.h>\n\nint main() {\n    int a = 10;\n    char c = 'A';\n    double d = 3.14;\n    \n    int *pi = &a;\n    char *pc = &c;\n    double *pd = &d;\n    \n    printf("int* 크기: %lu\\n", sizeof(pi));\n    printf("char* 크기: %lu\\n", sizeof(pc));\n    printf("double* 크기: %lu\\n", sizeof(pd));\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"다양한 타입의 변수\\",\\"explanation\\":\\"int(4B), char(1B), double(8B) - 각각 다른 크기를 가집니다.\\",\\"highlight\\":[4,5,6],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"a\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"c\\",\\"type\\":\\"char\\",\\"size\\":1,\\"value\\":\\"'A'\\",\\"address\\":\\"0x7ffc0fff\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"d\\",\\"type\\":\\"double\\",\\"size\\":8,\\"value\\":3.14,\\"address\\":\\"0x7ffc0ff0\\"}]},{\\"line\\":8,\\"title\\":\\"포인터들 생성\\",\\"explanation\\":\\"세 포인터 모두 8바이트입니다! 포인터는 '주소를 저장'하는데, 64비트 시스템에서 주소는 8바이트입니다.\\",\\"highlight\\":[8,9,10],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"pi\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"pointsTo\\":\\"a\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"pc\\",\\"type\\":\\"char*\\",\\"size\\":8,\\"value\\":\\"0x7ffc0fff\\",\\"pointsTo\\":\\"c\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"pd\\",\\"type\\":\\"double*\\",\\"size\\":8,\\"value\\":\\"0x7ffc0ff0\\",\\"pointsTo\\":\\"d\\"}]},{\\"line\\":12,\\"title\\":\\"포인터 크기 확인\\",\\"explanation\\":\\"모든 포인터는 8바이트입니다. 타입(int*, char*, double*)은 역참조할 때 '몇 바이트를 읽을지'를 결정합니다.\\",\\"highlight\\":[12,13,14],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.024+00	2026-01-07 07:45:38.024+00
content-c-3-1	c-3-1	#include <stdio.h>\n\nint main() {\n    int arr[5] = {10, 20, 30, 40, 50};\n    \n    for (int i = 0; i < 5; i++) {\n        printf("arr[%d] = %d, 주소 = %p\\n", \n               i, arr[i], &arr[i]);\n    }\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"배열 선언과 초기화\\",\\"explanation\\":\\"int arr[5]는 4바이트 × 5 = 20바이트의 연속된 메모리를 할당합니다. 각 요소가 연속해서 배치됩니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[0]\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[1]\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":20,\\"address\\":\\"0x7ffc1004\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[2]\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":30,\\"address\\":\\"0x7ffc1008\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[3]\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":40,\\"address\\":\\"0x7ffc100c\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[4]\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":50,\\"address\\":\\"0x7ffc1010\\"}]},{\\"line\\":6,\\"title\\":\\"배열 순회\\",\\"explanation\\":\\"주소를 보면 각 요소가 4바이트씩 증가합니다: 1000, 1004, 1008... 연속 배치의 증거입니다!\\",\\"highlight\\":[6,7,8],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.065+00	2026-01-07 07:45:38.065+00
content-c-3-2	c-3-2	#include <stdio.h>\n\nint main() {\n    int arr[3] = {10, 20, 30};\n    \n    printf("arr[1] = %d\\n", arr[1]);\n    printf("*(arr+1) = %d\\n", *(arr+1));\n    \n    printf("arr 주소: %p\\n", arr);\n    printf("arr+1 주소: %p\\n", arr+1);\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"배열 생성\\",\\"explanation\\":\\"arr은 배열의 첫 번째 요소 주소입니다. arr == &arr[0]\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[0]\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[1]\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":20,\\"address\\":\\"0x7ffc1004\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[2]\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":30,\\"address\\":\\"0x7ffc1008\\"}]},{\\"line\\":6,\\"title\\":\\"인덱스 접근\\",\\"explanation\\":\\"arr[1]은 두 번째 요소(값 20)에 접근합니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[]},{\\"line\\":7,\\"title\\":\\"포인터 산술로 접근\\",\\"explanation\\":\\"*(arr+1)도 같은 결과! arr+1은 '다음 int 위치'를 의미합니다. arr[i] == *(arr+i)\\",\\"highlight\\":[7],\\"memoryChanges\\":[]},{\\"line\\":9,\\"title\\":\\"주소 확인\\",\\"explanation\\":\\"arr=1000, arr+1=1004. 포인터에 1을 더하면 sizeof(int)=4만큼 증가합니다!\\",\\"highlight\\":[9,10],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.096+00	2026-01-07 07:45:38.096+00
content-c-3-3	c-3-3	#include <stdio.h>\n\nint main() {\n    int arr[5] = {1, 2, 3, 4, 5};\n    int *p = arr;\n    \n    printf("sizeof(arr) = %lu\\n", sizeof(arr));\n    printf("sizeof(p) = %lu\\n", sizeof(p));\n    \n    // arr = p;  // 에러! 배열은 재할당 불가\n    p = arr;     // OK\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"배열 생성\\",\\"explanation\\":\\"arr은 5개 int의 배열입니다. sizeof(arr) = 20바이트 (4×5)\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr\\",\\"type\\":\\"int[5]\\",\\"size\\":20,\\"value\\":\\"[1,2,3,4,5]\\",\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":5,\\"title\\":\\"포인터에 배열 할당\\",\\"explanation\\":\\"배열 이름 arr은 첫 요소 주소로 'decay'됩니다. p = &arr[0]과 동일.\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"address\\":\\"0x7ffc0ff8\\",\\"pointsTo\\":\\"arr[0]\\"}]},{\\"line\\":7,\\"title\\":\\"sizeof 차이 확인\\",\\"explanation\\":\\"sizeof(arr)=20 (전체 배열), sizeof(p)=8 (포인터). 배열은 크기 정보를 유지합니다!\\",\\"highlight\\":[7,8],\\"memoryChanges\\":[]},{\\"line\\":10,\\"title\\":\\"배열은 상수!\\",\\"explanation\\":\\"arr = p는 에러입니다. 배열 이름은 고정된 주소이며 변경할 수 없습니다.\\",\\"highlight\\":[10,11],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.127+00	2026-01-07 07:45:38.127+00
content-c-3-4	c-3-4	#include <stdio.h>\n\nvoid printSize(int arr[]) {\n    printf("함수 내 sizeof: %lu\\n", sizeof(arr));\n}\n\nint main() {\n    int arr[5] = {1, 2, 3, 4, 5};\n    \n    printf("main sizeof: %lu\\n", sizeof(arr));\n    printSize(arr);\n    \n    return 0;\n}	c	"[{\\"line\\":8,\\"title\\":\\"main에서 배열 생성\\",\\"explanation\\":\\"arr은 5개 int 배열. sizeof(arr) = 20바이트\\",\\"highlight\\":[8],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr\\",\\"type\\":\\"int[5]\\",\\"size\\":20,\\"value\\":\\"[1,2,3,4,5]\\",\\"address\\":\\"0x7ffc1000\\",\\"frame\\":\\"main\\"}]},{\\"line\\":10,\\"title\\":\\"main에서 sizeof\\",\\"explanation\\":\\"main에서는 배열 전체 크기 20이 출력됩니다.\\",\\"highlight\\":[10],\\"memoryChanges\\":[]},{\\"line\\":11,\\"title\\":\\"함수 호출 - decay 발생!\\",\\"explanation\\":\\"printSize(arr)를 호출하면 arr은 포인터로 decay됩니다. 주소만 전달됩니다.\\",\\"highlight\\":[11,3],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"printSize\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr (매개변수)\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"frame\\":\\"printSize\\",\\"pointsTo\\":\\"main의 arr[0]\\"}]},{\\"line\\":4,\\"title\\":\\"함수 내 sizeof\\",\\"explanation\\":\\"함수 내 sizeof(arr) = 8! 포인터 크기만 나옵니다. 배열 크기 정보가 사라졌습니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.162+00	2026-01-07 07:45:38.162+00
content-c-3-5	c-3-5	#include <stdio.h>\n\nint main() {\n    int arr[5] = {10, 20, 30, 40, 50};\n    int *p = arr;\n    \n    for (int i = 0; i < 5; i++) {\n        printf("*p = %d (주소: %p)\\n", *p, p);\n        p++;\n    }\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"배열 생성\\",\\"explanation\\":\\"5개 요소를 가진 배열이 연속된 메모리에 저장됩니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr\\",\\"type\\":\\"int[5]\\",\\"size\\":20,\\"value\\":\\"[10,20,30,40,50]\\",\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":5,\\"title\\":\\"포인터 초기화\\",\\"explanation\\":\\"p는 arr[0]을 가리킵니다. p = 0x7ffc1000\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"pointsTo\\":\\"arr[0]\\"}]},{\\"line\\":8,\\"title\\":\\"첫 번째 요소\\",\\"explanation\\":\\"*p = 10. p는 arr[0]을 가리키고 있습니다.\\",\\"highlight\\":[8],\\"memoryChanges\\":[]},{\\"line\\":9,\\"title\\":\\"포인터 증가 (첫 번째)\\",\\"explanation\\":\\"p++로 p가 다음 int 위치로 이동합니다. 1000 → 1004\\",\\"highlight\\":[9],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"value\\":\\"0x7ffc1004\\",\\"previousValue\\":\\"0x7ffc1000\\",\\"pointsTo\\":\\"arr[1]\\"}]},{\\"line\\":8,\\"title\\":\\"두 번째 요소\\",\\"explanation\\":\\"*p = 20. 이제 p는 arr[1]을 가리킵니다.\\",\\"highlight\\":[8],\\"memoryChanges\\":[]},{\\"line\\":9,\\"title\\":\\"포인터 증가 (두 번째)\\",\\"explanation\\":\\"p++로 1004 → 1008. arr[2]를 가리킵니다.\\",\\"highlight\\":[9],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"value\\":\\"0x7ffc1008\\",\\"previousValue\\":\\"0x7ffc1004\\",\\"pointsTo\\":\\"arr[2]\\"}]}]"	2026-01-07 07:45:38.192+00	2026-01-07 07:45:38.192+00
content-c-4-1	c-4-1	#include <stdio.h>\n\nvoid bar() {\n    int z = 30;\n    printf("bar: z=%d\\n", z);\n}\n\nvoid foo() {\n    int y = 20;\n    printf("foo: y=%d\\n", y);\n    bar();\n}\n\nint main() {\n    int x = 10;\n    printf("main: x=%d\\n", x);\n    foo();\n    return 0;\n}	c	"[{\\"line\\":15,\\"title\\":\\"main 스택 프레임 생성\\",\\"explanation\\":\\"main()이 시작되면 스택에 main의 프레임이 생성됩니다. x가 이 프레임에 할당됩니다.\\",\\"highlight\\":[14,15],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"main\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"x\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"frame\\":\\"main\\"}]},{\\"line\\":17,\\"title\\":\\"foo 호출 - 새 프레임\\",\\"explanation\\":\\"foo()가 호출되면 main 위에 foo 프레임이 쌓입니다.\\",\\"highlight\\":[17,8,9],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"foo\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"y\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":20,\\"frame\\":\\"foo\\"}]},{\\"line\\":11,\\"title\\":\\"bar 호출 - 세 번째 프레임\\",\\"explanation\\":\\"bar()가 호출되면 foo 위에 bar 프레임이 쌓입니다. 스택: main → foo → bar\\",\\"highlight\\":[11,3,4],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"bar\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"z\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":30,\\"frame\\":\\"bar\\"}]},{\\"line\\":6,\\"title\\":\\"bar 종료 - 프레임 제거\\",\\"explanation\\":\\"bar()가 끝나면 bar 프레임이 제거됩니다. z도 함께 사라집니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[{\\"action\\":\\"deallocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"z\\",\\"frame\\":\\"bar\\"},{\\"action\\":\\"frame_end\\",\\"area\\":\\"stack\\",\\"name\\":\\"bar\\"}]}]"	2026-01-07 07:45:38.232+00	2026-01-07 07:45:38.232+00
content-c-4-2	c-4-2	#include <stdio.h>\n\nvoid addOne(int n) {\n    n = n + 1;\n    printf("함수 내 n: %d\\n", n);\n}\n\nint main() {\n    int x = 10;\n    printf("호출 전 x: %d\\n", x);\n    addOne(x);\n    printf("호출 후 x: %d\\n", x);\n    return 0;\n}	c	"[{\\"line\\":9,\\"title\\":\\"main에서 x 생성\\",\\"explanation\\":\\"x에 10이 저장됩니다.\\",\\"highlight\\":[9],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"main\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"x\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"frame\\":\\"main\\"}]},{\\"line\\":11,\\"title\\":\\"함수 호출 - 값 복사!\\",\\"explanation\\":\\"addOne(x)가 호출되면 x의 값 10이 n에 '복사'됩니다. n은 별개의 변수입니다.\\",\\"highlight\\":[11,3],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"addOne\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"n\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"frame\\":\\"addOne\\",\\"note\\":\\"x의 복사본\\"}]},{\\"line\\":4,\\"title\\":\\"n 수정 (복사본)\\",\\"explanation\\":\\"n = n + 1로 n이 11이 됩니다. 하지만 x는 여전히 10입니다!\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"n\\",\\"value\\":11,\\"previousValue\\":10,\\"frame\\":\\"addOne\\"}]},{\\"line\\":12,\\"title\\":\\"함수 종료 후 x 확인\\",\\"explanation\\":\\"x는 여전히 10입니다. n의 변경은 x에 영향을 주지 않았습니다.\\",\\"highlight\\":[12],\\"memoryChanges\\":[{\\"action\\":\\"frame_end\\",\\"area\\":\\"stack\\",\\"name\\":\\"addOne\\"}]}]"	2026-01-07 07:45:38.262+00	2026-01-07 07:45:38.262+00
content-c-4-3	c-4-3	#include <stdio.h>\n\nvoid addOne(int *p) {\n    *p = *p + 1;\n    printf("함수 내 *p: %d\\n", *p);\n}\n\nint main() {\n    int x = 10;\n    printf("호출 전 x: %d\\n", x);\n    addOne(&x);\n    printf("호출 후 x: %d\\n", x);\n    return 0;\n}	c	"[{\\"line\\":9,\\"title\\":\\"main에서 x 생성\\",\\"explanation\\":\\"x에 10이 저장됩니다. 주소는 0x7ffc1000.\\",\\"highlight\\":[9],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"main\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"x\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\",\\"frame\\":\\"main\\"}]},{\\"line\\":11,\\"title\\":\\"주소 전달\\",\\"explanation\\":\\"addOne(&x)는 x의 '주소'를 전달합니다. p는 이 주소(0x7ffc1000)를 받습니다.\\",\\"highlight\\":[11,3],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"addOne\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"frame\\":\\"addOne\\",\\"pointsTo\\":\\"x\\"}]},{\\"line\\":4,\\"title\\":\\"역참조로 원본 수정!\\",\\"explanation\\":\\"*p = *p + 1은 p가 가리키는 x를 11로 변경합니다. 원본이 수정됩니다!\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"x\\",\\"value\\":11,\\"previousValue\\":10,\\"frame\\":\\"main\\",\\"updatedVia\\":\\"p\\"}]},{\\"line\\":12,\\"title\\":\\"원본 변경 확인\\",\\"explanation\\":\\"x가 11로 변경되었습니다. 포인터를 통해 원본을 수정할 수 있습니다.\\",\\"highlight\\":[12],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.292+00	2026-01-07 07:45:38.292+00
content-c-4-4	c-4-4	#include <stdio.h>\n\nvoid doubleFirst(int arr[]) {\n    arr[0] = arr[0] * 2;\n    printf("함수 내 arr[0]: %d\\n", arr[0]);\n}\n\nint main() {\n    int nums[3] = {5, 10, 15};\n    printf("호출 전: %d\\n", nums[0]);\n    doubleFirst(nums);\n    printf("호출 후: %d\\n", nums[0]);\n    return 0;\n}	c	"[{\\"line\\":9,\\"title\\":\\"main에서 배열 생성\\",\\"explanation\\":\\"nums 배열이 스택에 생성됩니다.\\",\\"highlight\\":[9],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"main\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"nums\\",\\"type\\":\\"int[3]\\",\\"size\\":12,\\"value\\":\\"[5,10,15]\\",\\"address\\":\\"0x7ffc1000\\",\\"frame\\":\\"main\\"}]},{\\"line\\":11,\\"title\\":\\"배열 전달 = 포인터 전달\\",\\"explanation\\":\\"doubleFirst(nums)는 nums가 포인터로 decay되어 전달됩니다. 배열 자체가 복사되지 않습니다!\\",\\"highlight\\":[11,3],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"doubleFirst\\",\\"type\\":\\"frame\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"frame\\":\\"doubleFirst\\",\\"pointsTo\\":\\"nums[0]\\"}]},{\\"line\\":4,\\"title\\":\\"원본 배열 수정!\\",\\"explanation\\":\\"arr[0] = arr[0] * 2는 nums[0]을 직접 수정합니다. arr은 nums를 가리키기 때문입니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"nums[0]\\",\\"value\\":10,\\"previousValue\\":5,\\"frame\\":\\"main\\",\\"updatedVia\\":\\"arr\\"}]},{\\"line\\":12,\\"title\\":\\"원본 변경 확인\\",\\"explanation\\":\\"nums[0]이 10으로 변경되었습니다. 배열 전달은 항상 '원본'에 접근합니다.\\",\\"highlight\\":[12],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.32+00	2026-01-07 07:45:38.32+00
content-c-4-5	c-4-5	#include <stdio.h>\n\nint* dangerous() {\n    int local = 100;\n    return &local;  // 위험!\n}\n\nint main() {\n    int *p = dangerous();\n    printf("*p = %d\\n", *p);  // 정의되지 않은 동작!\n    return 0;\n}	c	"[{\\"line\\":9,\\"title\\":\\"dangerous() 호출\\",\\"explanation\\":\\"dangerous() 함수의 스택 프레임이 생성됩니다.\\",\\"highlight\\":[9,3],\\"memoryChanges\\":[{\\"action\\":\\"frame\\",\\"area\\":\\"stack\\",\\"name\\":\\"dangerous\\",\\"type\\":\\"frame\\"}]},{\\"line\\":4,\\"title\\":\\"지역 변수 생성\\",\\"explanation\\":\\"local은 dangerous의 스택 프레임에 할당됩니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"local\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":100,\\"address\\":\\"0x7ffc0ff0\\",\\"frame\\":\\"dangerous\\"}]},{\\"line\\":5,\\"title\\":\\"지역 변수 주소 반환 (위험!)\\",\\"explanation\\":\\"&local(0x7ffc0ff0)을 반환합니다. 하지만 이 주소는 곧 무효가 됩니다!\\",\\"highlight\\":[5],\\"memoryChanges\\":[],\\"warning\\":\\"지역 변수 주소 반환!\\"},{\\"line\\":6,\\"title\\":\\"함수 종료 - local 해제!\\",\\"explanation\\":\\"dangerous() 종료 시 local이 해제됩니다. 0x7ffc0ff0은 이제 쓰레기입니다.\\",\\"highlight\\":[],\\"memoryChanges\\":[{\\"action\\":\\"deallocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"local\\",\\"frame\\":\\"dangerous\\",\\"danger\\":true},{\\"action\\":\\"frame_end\\",\\"area\\":\\"stack\\",\\"name\\":\\"dangerous\\"}]},{\\"line\\":10,\\"title\\":\\"Dangling Pointer 역참조!\\",\\"explanation\\":\\"p는 해제된 메모리를 가리킵니다. *p의 결과는 예측 불가능합니다. 크래시할 수도 있습니다!\\",\\"highlight\\":[10],\\"memoryChanges\\":[],\\"danger\\":true}]"	2026-01-07 07:45:38.35+00	2026-01-07 07:45:38.35+00
content-c-5-1	c-5-1	#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // Stack: 자동 할당/해제\n    int stackVar = 10;\n    \n    // Heap: 수동 할당\n    int *heapVar = malloc(sizeof(int));\n    *heapVar = 20;\n    \n    printf("Stack: %d, Heap: %d\\n", stackVar, *heapVar);\n    \n    // Heap: 수동 해제 (필수!)\n    free(heapVar);\n    \n    return 0;\n}	c	"[{\\"line\\":6,\\"title\\":\\"Stack 변수\\",\\"explanation\\":\\"stackVar는 스택에 자동 할당됩니다. 함수 종료 시 자동 해제됩니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"stackVar\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\",\\"auto\\":true}]},{\\"line\\":9,\\"title\\":\\"Heap 할당 (malloc)\\",\\"explanation\\":\\"malloc은 Heap에 메모리를 할당하고 그 주소를 반환합니다. heapVar는 이 주소를 저장합니다.\\",\\"highlight\\":[9],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"heapVar\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x55001000\\",\\"address\\":\\"0x7ffc0ff8\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"heap\\",\\"name\\":\\"(anonymous)\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":\\"???\\",\\"address\\":\\"0x55001000\\",\\"manual\\":true}]},{\\"line\\":10,\\"title\\":\\"Heap에 값 저장\\",\\"explanation\\":\\"*heapVar = 20으로 Heap 메모리에 값을 저장합니다.\\",\\"highlight\\":[10],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"heap\\",\\"name\\":\\"(via heapVar)\\",\\"value\\":20,\\"address\\":\\"0x55001000\\"}]},{\\"line\\":15,\\"title\\":\\"Heap 해제 (free)\\",\\"explanation\\":\\"free(heapVar)로 Heap 메모리를 반환합니다. 안 하면 Memory Leak!\\",\\"highlight\\":[15],\\"memoryChanges\\":[{\\"action\\":\\"deallocate\\",\\"area\\":\\"heap\\",\\"address\\":\\"0x55001000\\"}]}]"	2026-01-07 07:45:38.387+00	2026-01-07 07:45:38.387+00
content-c-5-2	c-5-2	#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // int 하나 할당\n    int *p = malloc(sizeof(int));\n    \n    if (p == NULL) {\n        printf("할당 실패!\\n");\n        return 1;\n    }\n    \n    *p = 42;\n    printf("*p = %d\\n", *p);\n    \n    free(p);\n    return 0;\n}	c	"[{\\"line\\":6,\\"title\\":\\"malloc 호출\\",\\"explanation\\":\\"malloc(sizeof(int))는 4바이트를 Heap에 할당하고 그 주소를 반환합니다.\\",\\"highlight\\":[6],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"size\\":8,\\"value\\":\\"0x55001000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"heap\\",\\"name\\":\\"(malloc)\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":\\"??? (초기화 안됨)\\",\\"address\\":\\"0x55001000\\"}]},{\\"line\\":8,\\"title\\":\\"NULL 체크\\",\\"explanation\\":\\"malloc이 실패하면 NULL을 반환합니다. 항상 체크해야 합니다!\\",\\"highlight\\":[8,9,10,11],\\"memoryChanges\\":[]},{\\"line\\":13,\\"title\\":\\"Heap에 값 저장\\",\\"explanation\\":\\"*p = 42로 할당된 메모리에 값을 저장합니다.\\",\\"highlight\\":[13],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"heap\\",\\"address\\":\\"0x55001000\\",\\"value\\":42,\\"previousValue\\":\\"???\\"}]},{\\"line\\":16,\\"title\\":\\"free로 해제\\",\\"explanation\\":\\"사용이 끝난 Heap 메모리는 반드시 free()로 해제합니다.\\",\\"highlight\\":[16],\\"memoryChanges\\":[{\\"action\\":\\"deallocate\\",\\"area\\":\\"heap\\",\\"address\\":\\"0x55001000\\"}]}]"	2026-01-07 07:45:38.417+00	2026-01-07 07:45:38.417+00
content-c-5-3	c-5-3	#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int *p = malloc(sizeof(int));\n    *p = 100;\n    \n    printf("해제 전: *p = %d\\n", *p);\n    \n    free(p);\n    \n    // p = NULL;  // 좋은 습관!\n    \n    // printf("해제 후: *p = %d\\n", *p);  // 위험!\n    \n    return 0;\n}	c	"[{\\"line\\":5,\\"title\\":\\"메모리 할당\\",\\"explanation\\":\\"Heap에 4바이트가 할당되고 p가 그 주소를 가집니다.\\",\\"highlight\\":[5,6],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"heap\\",\\"name\\":\\"(malloc)\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":100,\\"address\\":\\"0x55001000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"value\\":\\"0x55001000\\",\\"pointsTo\\":\\"heap\\"}]},{\\"line\\":10,\\"title\\":\\"free 호출\\",\\"explanation\\":\\"free(p)는 0x55001000의 메모리를 시스템에 반환합니다. 하지만 p는 여전히 이 주소를 가리킵니다!\\",\\"highlight\\":[10],\\"memoryChanges\\":[{\\"action\\":\\"deallocate\\",\\"area\\":\\"heap\\",\\"address\\":\\"0x55001000\\",\\"warning\\":\\"p는 여전히 이 주소를 가리킴\\"}]},{\\"line\\":12,\\"title\\":\\"p = NULL 권장\\",\\"explanation\\":\\"free 후 p = NULL;로 설정하면 Dangling Pointer 문제를 방지할 수 있습니다.\\",\\"highlight\\":[12],\\"memoryChanges\\":[]},{\\"line\\":14,\\"title\\":\\"해제 후 접근 (위험!)\\",\\"explanation\\":\\"free 후 *p 접근은 정의되지 않은 동작입니다. 크래시하거나 이상한 값이 나올 수 있습니다.\\",\\"highlight\\":[14],\\"danger\\":true,\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.449+00	2026-01-07 07:45:38.449+00
content-c-5-4	c-5-4	#include <stdio.h>\n#include <stdlib.h>\n\nvoid leaky() {\n    int *p = malloc(1000);  // 1000 바이트 할당\n    *p = 42;\n    // free(p);  // 실수로 누락!\n}  // p는 사라지지만 Heap 메모리는 남음\n\nint main() {\n    for (int i = 0; i < 1000; i++) {\n        leaky();  // 매번 1KB 누수!\n    }\n    // 약 1MB 메모리 누수 발생\n    printf("프로그램 종료\\n");\n    return 0;\n}	c	"[{\\"line\\":5,\\"title\\":\\"첫 번째 할당\\",\\"explanation\\":\\"Heap에 1000바이트가 할당되고 p가 그 주소를 가집니다.\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"heap\\",\\"name\\":\\"블록 1\\",\\"size\\":1000,\\"address\\":\\"0x55001000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"value\\":\\"0x55001000\\",\\"frame\\":\\"leaky\\"}]},{\\"line\\":8,\\"title\\":\\"함수 종료 - p만 사라짐\\",\\"explanation\\":\\"leaky() 종료 시 p(스택)는 사라지지만, Heap 메모리(0x55001000)는 그대로 남습니다. 접근 방법이 사라졌습니다!\\",\\"highlight\\":[8],\\"memoryChanges\\":[{\\"action\\":\\"frame_end\\",\\"area\\":\\"stack\\",\\"name\\":\\"leaky\\"},{\\"action\\":\\"leak\\",\\"area\\":\\"heap\\",\\"address\\":\\"0x55001000\\",\\"size\\":1000,\\"warning\\":\\"접근 불가능한 메모리\\"}]},{\\"line\\":11,\\"title\\":\\"반복 호출 - 누적 누수\\",\\"explanation\\":\\"1000번 호출하면 1000 × 1000 = 1,000,000 바이트(약 1MB)가 누수됩니다.\\",\\"highlight\\":[11,12],\\"memoryChanges\\":[{\\"action\\":\\"leak\\",\\"area\\":\\"heap\\",\\"note\\":\\"매 호출마다 1KB 추가 누수\\"}]}]"	2026-01-07 07:45:38.48+00	2026-01-07 07:45:38.48+00
content-c-5-5	c-5-5	#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int *p = malloc(sizeof(int));\n    *p = 100;\n    \n    free(p);\n    // 여기서 p는 Dangling Pointer!\n    \n    // 위험한 시도들:\n    // printf("%d\\n", *p);  // 해제된 메모리 읽기\n    // *p = 200;            // 해제된 메모리 쓰기\n    // free(p);             // Double free!\n    \n    p = NULL;  // 안전한 처리\n    \n    return 0;\n}	c	"[{\\"line\\":5,\\"title\\":\\"메모리 할당\\",\\"explanation\\":\\"정상적으로 Heap 메모리가 할당됩니다.\\",\\"highlight\\":[5,6],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"heap\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":100,\\"address\\":\\"0x55001000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"int*\\",\\"value\\":\\"0x55001000\\",\\"pointsTo\\":\\"heap\\"}]},{\\"line\\":8,\\"title\\":\\"free 호출\\",\\"explanation\\":\\"메모리는 해제되지만 p는 여전히 0x55001000을 가리킵니다. 이것이 Dangling Pointer!\\",\\"highlight\\":[8,9],\\"memoryChanges\\":[{\\"action\\":\\"deallocate\\",\\"area\\":\\"heap\\",\\"address\\":\\"0x55001000\\"}],\\"warning\\":\\"p는 해제된 메모리를 가리킴\\"},{\\"line\\":12,\\"title\\":\\"해제된 메모리 읽기 (위험!)\\",\\"explanation\\":\\"운이 좋으면 이전 값이 나오고, 운이 나쁘면 크래시하거나 다른 프로그램의 데이터가 나옵니다.\\",\\"highlight\\":[12],\\"danger\\":true,\\"memoryChanges\\":[]},{\\"line\\":14,\\"title\\":\\"Double Free (위험!)\\",\\"explanation\\":\\"같은 메모리를 두 번 free하면 메모리 관리 구조가 손상됩니다. 매우 위험!\\",\\"highlight\\":[14],\\"danger\\":true,\\"memoryChanges\\":[]},{\\"line\\":16,\\"title\\":\\"안전한 처리\\",\\"explanation\\":\\"p = NULL로 설정하면 실수로 사용해도 즉시 크래시하여 버그를 발견할 수 있습니다.\\",\\"highlight\\":[16],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"value\\":\\"NULL\\",\\"previousValue\\":\\"0x55001000 (해제됨)\\"}]}]"	2026-01-07 07:45:38.511+00	2026-01-07 07:45:38.511+00
content-c-5-6	c-5-6	#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    printf("배열 크기: ");\n    scanf("%d", &n);\n    \n    // 동적 배열 생성\n    int *arr = malloc(n * sizeof(int));\n    \n    if (arr == NULL) {\n        return 1;\n    }\n    \n    // 배열처럼 사용\n    for (int i = 0; i < n; i++) {\n        arr[i] = i * 10;\n    }\n    \n    for (int i = 0; i < n; i++) {\n        printf("arr[%d] = %d\\n", i, arr[i]);\n    }\n    \n    free(arr);\n    return 0;\n}	c	"[{\\"line\\":7,\\"title\\":\\"크기 입력\\",\\"explanation\\":\\"사용자가 배열 크기를 입력합니다. 컴파일 시점에는 크기를 알 수 없습니다.\\",\\"highlight\\":[5,6,7],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"n\\",\\"type\\":\\"int\\",\\"value\\":5,\\"note\\":\\"(예: 사용자가 5 입력)\\"}]},{\\"line\\":10,\\"title\\":\\"동적 배열 할당\\",\\"explanation\\":\\"malloc(5 * 4) = malloc(20)으로 20바이트를 Heap에 할당합니다. 5개 int를 저장할 수 있습니다.\\",\\"highlight\\":[10],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"heap\\",\\"name\\":\\"arr\\",\\"type\\":\\"int[]\\",\\"size\\":20,\\"value\\":\\"[?,?,?,?,?]\\",\\"address\\":\\"0x55001000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr\\",\\"type\\":\\"int*\\",\\"value\\":\\"0x55001000\\"}]},{\\"line\\":17,\\"title\\":\\"배열처럼 사용\\",\\"explanation\\":\\"arr[i]로 접근 가능합니다. arr[i] == *(arr+i)이므로 포인터와 배열 문법 모두 사용 가능.\\",\\"highlight\\":[17,18,19],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"heap\\",\\"name\\":\\"arr\\",\\"value\\":\\"[0,10,20,30,40]\\",\\"address\\":\\"0x55001000\\"}]},{\\"line\\":25,\\"title\\":\\"해제\\",\\"explanation\\":\\"동적 배열도 반드시 free()로 해제해야 합니다.\\",\\"highlight\\":[25],\\"memoryChanges\\":[{\\"action\\":\\"deallocate\\",\\"area\\":\\"heap\\",\\"address\\":\\"0x55001000\\"}]}]"	2026-01-07 07:45:38.546+00	2026-01-07 07:45:38.546+00
content-c-6-1	c-6-1	#include <stdio.h>\n\nint main() {\n    char str[] = "hello";\n    \n    printf("문자열: %s\\n", str);\n    printf("길이: %lu\\n", sizeof(str));\n    \n    // 각 문자 확인\n    for (int i = 0; i < 6; i++) {\n        printf("str[%d] = '%c' (ASCII: %d)\\n", \n               i, str[i], str[i]);\n    }\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"문자열 선언\\",\\"explanation\\":\\"\\\\\\"hello\\\\\\"는 실제로 {'h','e','l','l','o','\\\\\\\\0'} 6바이트로 저장됩니다. 끝에 null 문자(\\\\\\\\0)가 자동 추가됩니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"str[0]\\",\\"type\\":\\"char\\",\\"value\\":\\"'h' (104)\\",\\"address\\":\\"0x7ffc1000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"str[1]\\",\\"type\\":\\"char\\",\\"value\\":\\"'e' (101)\\",\\"address\\":\\"0x7ffc1001\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"str[2]\\",\\"type\\":\\"char\\",\\"value\\":\\"'l' (108)\\",\\"address\\":\\"0x7ffc1002\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"str[3]\\",\\"type\\":\\"char\\",\\"value\\":\\"'l' (108)\\",\\"address\\":\\"0x7ffc1003\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"str[4]\\",\\"type\\":\\"char\\",\\"value\\":\\"'o' (111)\\",\\"address\\":\\"0x7ffc1004\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"str[5]\\",\\"type\\":\\"char\\",\\"value\\":\\"'\\\\\\\\0' (0)\\",\\"address\\":\\"0x7ffc1005\\"}]},{\\"line\\":7,\\"title\\":\\"sizeof 확인\\",\\"explanation\\":\\"sizeof(str) = 6. 'hello'는 5글자지만 null 종료 문자 포함해서 6바이트입니다.\\",\\"highlight\\":[7],\\"memoryChanges\\":[]},{\\"line\\":10,\\"title\\":\\"각 문자 확인\\",\\"explanation\\":\\"마지막 str[5]는 '\\\\\\\\0'(null 문자, ASCII 0)입니다. 이것이 문자열의 끝을 표시합니다.\\",\\"highlight\\":[10,11,12],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.589+00	2026-01-07 07:45:38.589+00
content-c-6-2	c-6-2	#include <stdio.h>\n\nint main() {\n    char arr[] = "hello";  // 스택에 복사\n    char *ptr = "hello";    // 읽기전용 영역 가리킴\n    \n    arr[0] = 'H';  // OK! 수정 가능\n    printf("arr: %s\\n", arr);\n    \n    // ptr[0] = 'H';  // 위험! Segmentation fault\n    \n    printf("arr 주소: %p\\n", arr);\n    printf("ptr 주소: %p\\n", ptr);\n    \n    return 0;\n}	c	"[{\\"line\\":4,\\"title\\":\\"char 배열\\",\\"explanation\\":\\"char arr[]는 \\\\\\"hello\\\\\\"를 스택에 복사합니다. 수정 가능한 배열입니다.\\",\\"highlight\\":[4],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr\\",\\"type\\":\\"char[6]\\",\\"size\\":6,\\"value\\":\\"\\\\\\"hello\\\\\\\\0\\\\\\"\\",\\"address\\":\\"0x7ffc1000\\",\\"modifiable\\":true}]},{\\"line\\":5,\\"title\\":\\"char 포인터\\",\\"explanation\\":\\"char *ptr은 읽기 전용 메모리(rodata 영역)의 \\\\\\"hello\\\\\\"를 가리킵니다. 수정하면 크래시!\\",\\"highlight\\":[5],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"rodata\\",\\"name\\":\\"\\\\\\"hello\\\\\\"\\",\\"type\\":\\"const char[]\\",\\"value\\":\\"\\\\\\"hello\\\\\\\\0\\\\\\"\\",\\"address\\":\\"0x00401000\\",\\"readonly\\":true},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"ptr\\",\\"type\\":\\"char*\\",\\"value\\":\\"0x00401000\\",\\"pointsTo\\":\\"rodata\\"}]},{\\"line\\":7,\\"title\\":\\"배열 수정 - OK\\",\\"explanation\\":\\"arr는 스택에 있는 복사본이므로 수정 가능합니다.\\",\\"highlight\\":[7],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"arr[0]\\",\\"value\\":\\"'H'\\",\\"previousValue\\":\\"'h'\\"}]},{\\"line\\":10,\\"title\\":\\"포인터 수정 - 위험!\\",\\"explanation\\":\\"ptr이 가리키는 메모리는 읽기 전용입니다. 수정하면 Segmentation fault!\\",\\"highlight\\":[10],\\"danger\\":true,\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.62+00	2026-01-07 07:45:38.62+00
content-c-6-3	c-6-3	#include <stdio.h>\n\nstruct Point {\n    int x;\n    int y;\n};\n\nint main() {\n    struct Point p1;\n    p1.x = 10;\n    p1.y = 20;\n    \n    struct Point p2 = {30, 40};\n    \n    printf("p1: (%d, %d)\\n", p1.x, p1.y);\n    printf("p2: (%d, %d)\\n", p2.x, p2.y);\n    printf("sizeof(Point): %lu\\n", sizeof(struct Point));\n    \n    return 0;\n}	c	"[{\\"line\\":3,\\"title\\":\\"구조체 정의\\",\\"explanation\\":\\"struct Point는 int x와 int y를 포함하는 새로운 타입을 정의합니다.\\",\\"highlight\\":[3,4,5,6],\\"memoryChanges\\":[]},{\\"line\\":9,\\"title\\":\\"구조체 변수 선언\\",\\"explanation\\":\\"p1이 스택에 할당됩니다. x와 y가 연속된 메모리에 배치됩니다.\\",\\"highlight\\":[9,10,11],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p1.x\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":10,\\"address\\":\\"0x7ffc1000\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p1.y\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":20,\\"address\\":\\"0x7ffc1004\\"}]},{\\"line\\":13,\\"title\\":\\"초기화 문법\\",\\"explanation\\":\\"{30, 40}으로 선언과 동시에 초기화할 수 있습니다.\\",\\"highlight\\":[13],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p2.x\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":30,\\"address\\":\\"0x7ffc0ff8\\"},{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p2.y\\",\\"type\\":\\"int\\",\\"size\\":4,\\"value\\":40,\\"address\\":\\"0x7ffc0ffc\\"}]},{\\"line\\":17,\\"title\\":\\"구조체 크기\\",\\"explanation\\":\\"sizeof(struct Point) = 8. int 두 개(4+4)입니다. 패딩이 있을 수도 있습니다.\\",\\"highlight\\":[17],\\"memoryChanges\\":[]}]"	2026-01-07 07:45:38.648+00	2026-01-07 07:45:38.648+00
content-c-6-4	c-6-4	#include <stdio.h>\n#include <stdlib.h>\n\nstruct Point {\n    int x;\n    int y;\n};\n\nint main() {\n    struct Point p = {10, 20};\n    struct Point *ptr = &p;\n    \n    // 점(.) 연산자\n    printf("p.x = %d\\n", p.x);\n    \n    // 역참조 후 점\n    printf("(*ptr).x = %d\\n", (*ptr).x);\n    \n    // 화살표 연산자 (더 편리!)\n    printf("ptr->x = %d\\n", ptr->x);\n    \n    // 값 변경\n    ptr->y = 100;\n    printf("p.y = %d\\n", p.y);\n    \n    return 0;\n}	c	"[{\\"line\\":10,\\"title\\":\\"구조체 생성\\",\\"explanation\\":\\"p는 스택에 생성됩니다. x=10, y=20으로 초기화됩니다.\\",\\"highlight\\":[10],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"p\\",\\"type\\":\\"struct Point\\",\\"size\\":8,\\"value\\":\\"{x:10, y:20}\\",\\"address\\":\\"0x7ffc1000\\"}]},{\\"line\\":11,\\"title\\":\\"구조체 포인터\\",\\"explanation\\":\\"ptr은 p의 주소를 저장합니다. ptr이 p를 가리킵니다.\\",\\"highlight\\":[11],\\"memoryChanges\\":[{\\"action\\":\\"allocate\\",\\"area\\":\\"stack\\",\\"name\\":\\"ptr\\",\\"type\\":\\"struct Point*\\",\\"size\\":8,\\"value\\":\\"0x7ffc1000\\",\\"pointsTo\\":\\"p\\"}]},{\\"line\\":14,\\"title\\":\\"점(.) 연산자\\",\\"explanation\\":\\"구조체 변수에서 멤버에 접근할 때 p.x를 사용합니다.\\",\\"highlight\\":[14],\\"memoryChanges\\":[]},{\\"line\\":17,\\"title\\":\\"역참조 후 점\\",\\"explanation\\":\\"(*ptr).x는 '포인터 따라가서 구조체 얻고, 그 멤버 x 접근'입니다. 괄호가 필수!\\",\\"highlight\\":[17],\\"memoryChanges\\":[]},{\\"line\\":20,\\"title\\":\\"화살표 연산자\\",\\"explanation\\":\\"ptr->x는 (*ptr).x와 동일합니다. 더 읽기 쉽고 편리합니다!\\",\\"highlight\\":[20],\\"memoryChanges\\":[]},{\\"line\\":23,\\"title\\":\\"포인터로 값 변경\\",\\"explanation\\":\\"ptr->y = 100으로 p.y가 변경됩니다. 포인터를 통한 간접 수정!\\",\\"highlight\\":[23,24],\\"memoryChanges\\":[{\\"action\\":\\"update\\",\\"area\\":\\"stack\\",\\"name\\":\\"p.y\\",\\"value\\":100,\\"previousValue\\":20,\\"updatedVia\\":\\"ptr\\"}]}]"	2026-01-07 07:45:38.683+00	2026-01-07 07:45:38.683+00
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.lessons (id, chapter_id, title, description, difficulty, "order", estimated_time, is_active, created_at, updated_at) FROM stdin;
c-1-1	c-1	변수 선언과 메모리 할당	int a;가 실제로 무엇을 하는지 이해합니다.	basic	1	8	t	2026-01-07 07:45:37.686+00	2026-01-07 07:45:37.686+00
c-1-2	c-1	변수 초기화와 값 저장	int a = 10;의 내부 동작을 시각화합니다.	basic	2	8	t	2026-01-07 07:45:37.728+00	2026-01-07 07:45:37.728+00
c-1-3	c-1	메모리 주소와 sizeof	변수의 주소와 크기를 확인하는 방법을 학습합니다.	basic	3	9	t	2026-01-07 07:45:37.765+00	2026-01-07 07:45:37.765+00
c-1-4	c-1	스택 메모리와 변수 생명주기	지역 변수가 생성되고 사라지는 과정을 이해합니다.	basic	4	10	t	2026-01-07 07:45:37.803+00	2026-01-07 07:45:37.803+00
c-2-1	c-2	주소 연산자 &	&a로 변수의 메모리 주소를 얻는 방법을 학습합니다.	basic	1	8	t	2026-01-07 07:45:37.85+00	2026-01-07 07:45:37.85+00
c-2-2	c-2	포인터 선언과 할당	int *p = &a;의 의미를 정확히 이해합니다.	basic	2	9	t	2026-01-07 07:45:37.886+00	2026-01-07 07:45:37.886+00
c-2-3	c-2	역참조로 값 읽기	*p로 포인터가 가리키는 값을 읽습니다.	basic	3	8	t	2026-01-07 07:45:37.918+00	2026-01-07 07:45:37.918+00
c-2-4	c-2	역참조로 값 쓰기	*p = 20;으로 원본 변수를 변경하는 원리를 이해합니다.	basic	4	9	t	2026-01-07 07:45:37.951+00	2026-01-07 07:45:37.951+00
c-2-5	c-2	NULL과 초기화되지 않은 포인터	Dangling pointer와 NULL의 차이를 학습합니다.	intermediate	5	10	t	2026-01-07 07:45:37.979+00	2026-01-07 07:45:37.979+00
c-2-6	c-2	포인터의 크기와 타입	왜 int*와 char*의 크기가 같은지 이해합니다.	intermediate	6	9	t	2026-01-07 07:45:38.011+00	2026-01-07 07:45:38.011+00
c-3-1	c-3	배열의 메모리 배치	int arr[5]가 연속된 메모리에 저장되는 것을 시각화합니다.	basic	1	9	t	2026-01-07 07:45:38.056+00	2026-01-07 07:45:38.056+00
c-3-2	c-3	배열 인덱스와 포인터 산술	arr[2]가 *(arr+2)와 같은 이유를 이해합니다.	intermediate	2	10	t	2026-01-07 07:45:38.086+00	2026-01-07 07:45:38.086+00
c-3-3	c-3	배열과 포인터의 차이	sizeof(arr) vs sizeof(p)의 차이를 학습합니다.	intermediate	3	10	t	2026-01-07 07:45:38.116+00	2026-01-07 07:45:38.116+00
c-3-4	c-3	배열을 함수에 전달	배열이 포인터로 decay되는 원리를 이해합니다.	intermediate	4	11	t	2026-01-07 07:45:38.147+00	2026-01-07 07:45:38.147+00
c-3-5	c-3	포인터로 배열 순회	p++로 배열을 순회하는 방법을 학습합니다.	intermediate	5	10	t	2026-01-07 07:45:38.181+00	2026-01-07 07:45:38.181+00
c-4-1	c-4	함수 호출과 스택 프레임	함수 호출 시 스택에 새 프레임이 생성되는 과정을 시각화합니다.	intermediate	1	11	t	2026-01-07 07:45:38.223+00	2026-01-07 07:45:38.223+00
c-4-2	c-4	Call by Value	인자가 복사본으로 전달되어 원본이 변경되지 않는 원리를 이해합니다.	basic	2	9	t	2026-01-07 07:45:38.252+00	2026-01-07 07:45:38.252+00
c-4-3	c-4	포인터로 원본 수정	포인터를 전달하여 원본을 변경하는 방법을 학습합니다.	intermediate	3	10	t	2026-01-07 07:45:38.281+00	2026-01-07 07:45:38.281+00
c-4-4	c-4	배열 매개변수	배열이 자동으로 포인터로 전달되는 이유를 이해합니다.	intermediate	4	10	t	2026-01-07 07:45:38.311+00	2026-01-07 07:45:38.311+00
c-4-5	c-4	지역 변수 주소 반환의 위험	Dangling pointer가 발생하는 상황을 학습합니다.	advanced	5	11	t	2026-01-07 07:45:38.337+00	2026-01-07 07:45:38.337+00
c-5-1	c-5	Stack vs Heap	두 메모리 영역의 차이와 사용 시기를 학습합니다.	intermediate	1	10	t	2026-01-07 07:45:38.377+00	2026-01-07 07:45:38.377+00
c-5-2	c-5	malloc으로 메모리 할당	malloc(sizeof(int))의 동작 원리를 시각화합니다.	intermediate	2	10	t	2026-01-07 07:45:38.406+00	2026-01-07 07:45:38.406+00
c-5-3	c-5	free로 메모리 해제	할당된 메모리를 반환하는 방법과 중요성을 학습합니다.	intermediate	3	9	t	2026-01-07 07:45:38.438+00	2026-01-07 07:45:38.438+00
c-5-4	c-5	Memory Leak	free를 하지 않으면 생기는 문제를 이해합니다.	intermediate	4	10	t	2026-01-07 07:45:38.467+00	2026-01-07 07:45:38.467+00
c-5-5	c-5	Dangling Pointer	free(p) 후 p를 사용하는 위험성을 학습합니다.	advanced	5	10	t	2026-01-07 07:45:38.501+00	2026-01-07 07:45:38.501+00
c-5-6	c-5	동적 배열	malloc으로 배열을 생성하는 방법을 학습합니다.	intermediate	6	11	t	2026-01-07 07:45:38.535+00	2026-01-07 07:45:38.535+00
c-6-1	c-6	문자열의 메모리 구조	"hello"가 {'h','e','l','l','o','\\0'}로 저장되는 원리를 학습합니다.	basic	1	9	t	2026-01-07 07:45:38.578+00	2026-01-07 07:45:38.578+00
c-6-2	c-6	char 배열 vs char 포인터	char s[]와 char *s의 차이를 이해합니다.	intermediate	2	10	t	2026-01-07 07:45:38.61+00	2026-01-07 07:45:38.61+00
c-6-3	c-6	구조체 기본	struct Point { int x, y; }의 메모리 배치를 시각화합니다.	basic	3	10	t	2026-01-07 07:45:38.638+00	2026-01-07 07:45:38.638+00
c-6-4	c-6	구조체 포인터와 화살표 연산자	p->x와 (*p).x가 같은 이유를 이해합니다.	intermediate	4	10	t	2026-01-07 07:45:38.671+00	2026-01-07 07:45:38.671+00
\.


--
-- Data for Name: oauth_accounts; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.oauth_accounts (id, user_id, provider, provider_id, email, created_at) FROM stdin;
\.


--
-- Data for Name: problems; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.problems (id, number, title, description, difficulty, tags, source, src_url, hints, solution, test_cases, time_limit, memory_limit, created_at) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.quizzes (id, lesson_id, type, question, options, answer, explanation, "order", created_at) FROM stdin;
quiz-c-1-1	c-1-1	multiple_choice	int x; 선언 후 x의 값은?	"[\\"항상 0\\",\\"항상 NULL\\",\\"알 수 없음 (쓰레기 값)\\",\\"컴파일 에러\\"]"	2	변수 선언은 메모리 공간만 예약합니다. 초기화하지 않으면 이전에 그 위치에 있던 임의의 값이 남아있습니다.	1	2026-01-07 07:45:37.716+00
quiz-c-1-2	c-1-2	multiple_choice	int x = 5; x = 10; 실행 후 메모리 상태는?	"[\\"x에 5와 10 두 값이 저장됨\\",\\"x에 10만 저장됨 (5는 덮어써짐)\\",\\"x에 15가 저장됨\\",\\"두 개의 x 변수가 생성됨\\"]"	1	변수에 새 값을 할당하면 같은 메모리 위치에 덮어씁니다. 이전 값은 사라집니다.	1	2026-01-07 07:45:37.753+00
quiz-c-1-3	c-1-3	multiple_choice	sizeof(char)와 sizeof(int)의 값은? (일반적인 64비트 시스템)	"[\\"둘 다 4\\",\\"1과 4\\",\\"4와 8\\",\\"1과 8\\"]"	1	char는 1바이트, int는 보통 4바이트입니다. sizeof는 바이트 단위로 크기를 반환합니다.	1	2026-01-07 07:45:37.791+00
quiz-c-1-4	c-1-4	multiple_choice	foo() 함수가 끝난 후 local 변수는?	"[\\"여전히 메모리에 남아있다\\",\\"0으로 초기화된다\\",\\"메모리에서 해제된다\\",\\"main에서 접근할 수 있다\\"]"	2	지역 변수는 함수가 끝나면 스택에서 자동 해제됩니다. 이것이 '지역' 변수라 불리는 이유입니다.	1	2026-01-07 07:45:37.829+00
quiz-c-2-1	c-2-1	multiple_choice	int x = 5; 일 때 &x는 무엇을 반환하는가?	"[\\"5\\",\\"x라는 문자열\\",\\"x의 메모리 주소\\",\\"5의 주소\\"]"	2	&는 변수의 메모리 주소를 반환합니다. 값 5가 아닌, 5가 저장된 위치입니다.	1	2026-01-07 07:45:37.876+00
quiz-c-2-2	c-2-2	multiple_choice	int *p; 선언 직후 p는 무엇을 가리키는가?	"[\\"NULL\\",\\"0\\",\\"아무것도 가리키지 않음 (쓰레기 주소)\\",\\"자기 자신\\"]"	2	초기화 없이 선언된 포인터는 쓰레기 값(임의의 주소)을 가집니다. 이 상태에서 역참조하면 위험합니다!	1	2026-01-07 07:45:37.909+00
quiz-c-2-3	c-2-3	multiple_choice	int a=5; int *p=&a; 일 때 *p의 값은?	"[\\"a의 주소\\",\\"p의 주소\\",\\"5\\",\\"포인터 p 자체\\"]"	2	*p는 p가 저장한 주소로 가서 그 위치의 값을 읽습니다. p가 a를 가리키므로 *p는 a의 값인 5입니다.	1	2026-01-07 07:45:37.938+00
quiz-c-2-4	c-2-4	multiple_choice	int x=5; int *p=&x; *p=10; 실행 후 x의 값은?	"[\\"5\\",\\"10\\",\\"15\\",\\"에러\\"]"	1	*p = 10;은 p가 가리키는 x의 메모리에 10을 저장합니다. x가 직접 변경됩니다.	1	2026-01-07 07:45:37.97+00
quiz-c-2-5	c-2-5	multiple_choice	int *p; *p = 5; 실행 시 무슨 일이 발생할 수 있는가?	"[\\"정상 동작\\",\\"컴파일 에러\\",\\"프로그램 크래시 (Segmentation fault)\\",\\"5가 출력됨\\"]"	2	초기화되지 않은 포인터는 임의의 주소를 가리킵니다. 그 주소에 접근하면 대부분 크래시합니다.	1	2026-01-07 07:45:38.001+00
quiz-c-2-6	c-2-6	multiple_choice	64비트 시스템에서 char*와 double*의 크기는?	"[\\"1바이트, 8바이트\\",\\"둘 다 4바이트\\",\\"둘 다 8바이트\\",\\"시스템마다 다름\\"]"	2	포인터는 주소를 저장하고, 64비트 시스템의 주소는 8바이트입니다. 가리키는 타입과 무관합니다.	1	2026-01-07 07:45:38.036+00
quiz-c-3-1	c-3-1	multiple_choice	int arr[3];에서 arr[0]의 주소가 1000이면 arr[2]의 주소는?	"[\\"1002\\",\\"1004\\",\\"1008\\",\\"알 수 없음\\"]"	2	int는 4바이트입니다. arr[0]=1000, arr[1]=1004, arr[2]=1008. 인덱스 × sizeof(int) + 시작주소	1	2026-01-07 07:45:38.074+00
quiz-c-3-2	c-3-2	multiple_choice	int arr[3]; 에서 arr[2]와 동일한 표현은?	"[\\"*(arr+2)\\",\\"arr+2\\",\\"&arr[2]\\",\\"*arr+2\\"]"	0	arr[i] == *(arr+i). arr+2는 주소, &arr[2]도 주소. *arr+2는 arr[0]+2 = 첫번째값+2	1	2026-01-07 07:45:38.106+00
quiz-c-3-3	c-3-3	multiple_choice	int arr[10]; int *p = arr; 에서 sizeof(arr)과 sizeof(p)의 차이는?	"[\\"둘 다 8\\",\\"40과 8\\",\\"10과 8\\",\\"둘 다 40\\"]"	1	sizeof(arr)=40 (4×10), sizeof(p)=8 (포인터 크기). 배열과 포인터는 다릅니다!	1	2026-01-07 07:45:38.138+00
quiz-c-3-4	c-3-4	multiple_choice	void foo(int arr[5])에서 sizeof(arr)는?	"[\\"20\\",\\"8\\",\\"5\\",\\"4\\"]"	1	함수 매개변수에서 int arr[5]는 int *arr과 동일합니다. sizeof는 포인터 크기 8을 반환합니다.	1	2026-01-07 07:45:38.172+00
quiz-c-3-5	c-3-5	multiple_choice	int *p가 arr[0]을 가리킬 때, p++; p++; 후 p는?	"[\\"arr[0]\\",\\"arr[1]\\",\\"arr[2]\\",\\"배열 밖\\"]"	2	p++를 두 번 실행하면 두 요소 앞으로 이동합니다. arr[0] → arr[1] → arr[2]	1	2026-01-07 07:45:38.2+00
quiz-c-4-1	c-4-1	multiple_choice	main()에서 foo()를 호출하고, foo()에서 bar()를 호출했을 때 스택 순서는?	"[\\"bar → foo → main (위에서 아래)\\",\\"main → foo → bar (아래서 위)\\",\\"순서 없음\\",\\"main만 스택에 있음\\"]"	1	함수 호출 순서대로 스택에 쌓입니다. 가장 먼저 호출된 main이 바닥, 가장 최근 bar가 위.	1	2026-01-07 07:45:38.242+00
quiz-c-4-2	c-4-2	multiple_choice	void foo(int a) { a = 100; } int x = 5; foo(x); 후 x는?	"[\\"100\\",\\"5\\",\\"105\\",\\"에러\\"]"	1	a는 x의 복사본입니다. a를 변경해도 x는 변하지 않습니다. 이것이 Call by Value입니다.	1	2026-01-07 07:45:38.273+00
quiz-c-4-3	c-4-3	multiple_choice	void swap(int *a, int *b) { int t=*a; *a=*b; *b=t; } 호출 후 x,y가 교환되는가?	"[\\"예, 교환된다\\",\\"아니오, 그대로다\\",\\"컴파일 에러\\",\\"결과를 알 수 없다\\"]"	0	포인터로 원본 주소를 받아 역참조로 수정하면 원본이 변경됩니다.	1	2026-01-07 07:45:38.302+00
quiz-c-4-4	c-4-4	multiple_choice	void foo(int arr[]) { arr[0] = 100; } int x[3]={1,2,3}; foo(x); 후 x[0]은?	"[\\"1\\",\\"100\\",\\"컴파일 에러\\",\\"알 수 없음\\"]"	1	배열은 포인터로 전달되어 원본에 접근합니다. arr[0] 수정 = x[0] 수정	1	2026-01-07 07:45:38.328+00
quiz-c-4-5	c-4-5	multiple_choice	int* foo() { int x=5; return &x; } 이 코드의 문제는?	"[\\"문법 에러\\",\\"x가 복사되어 반환됨\\",\\"x의 주소가 함수 종료 후 무효가 됨\\",\\"문제없이 정상 동작\\"]"	2	지역 변수 x는 함수 종료 시 사라집니다. 그 주소를 반환하면 Dangling Pointer가 됩니다.	1	2026-01-07 07:45:38.36+00
quiz-c-5-1	c-5-1	multiple_choice	Stack과 Heap의 차이는?	"[\\"둘 다 자동 관리\\",\\"Stack은 자동, Heap은 수동 관리\\",\\"Heap이 더 빠르다\\",\\"둘 다 수동 관리\\"]"	1	Stack은 함수 종료 시 자동 해제. Heap은 free()로 명시적 해제 필요.	1	2026-01-07 07:45:38.396+00
quiz-c-5-2	c-5-2	multiple_choice	malloc(10)은 무엇을 반환하는가?	"[\\"10\\",\\"10바이트 메모리의 주소\\",\\"NULL\\",\\"10개의 int\\"]"	1	malloc(size)는 size 바이트의 메모리를 할당하고 그 시작 주소를 반환합니다.	1	2026-01-07 07:45:38.428+00
quiz-c-5-3	c-5-3	multiple_choice	free(p) 후 p의 값은?	"[\\"NULL\\",\\"0\\",\\"변하지 않음 (이전 주소 그대로)\\",\\"쓰레기 값\\"]"	2	free는 메모리만 해제하고 p의 값은 변경하지 않습니다. 그래서 p = NULL;을 권장합니다.	1	2026-01-07 07:45:38.458+00
quiz-c-5-4	c-5-4	multiple_choice	Memory Leak의 정의는?	"[\\"메모리 접근 에러\\",\\"할당 후 free하지 않아 접근 불가능한 메모리가 남는 것\\",\\"NULL 포인터 접근\\",\\"스택 오버플로우\\"]"	1	할당된 메모리의 주소를 잃어버려 free할 수 없게 되는 상황입니다.	1	2026-01-07 07:45:38.49+00
quiz-c-5-5	c-5-5	multiple_choice	Dangling Pointer란?	"[\\"NULL 포인터\\",\\"초기화되지 않은 포인터\\",\\"해제된 메모리를 가리키는 포인터\\",\\"배열 끝을 지나는 포인터\\"]"	2	free 후에도 해제된 주소를 가리키는 포인터를 Dangling Pointer라고 합니다.	1	2026-01-07 07:45:38.522+00
quiz-c-5-6	c-5-6	multiple_choice	int *arr = malloc(10 * sizeof(int)); 이 할당하는 바이트 수는?	"[\\"10\\",\\"14\\",\\"40\\",\\"80\\"]"	2	sizeof(int) = 4바이트. 10 * 4 = 40바이트가 할당됩니다.	1	2026-01-07 07:45:38.557+00
quiz-c-6-1	c-6-1	multiple_choice	char s[] = "abc"; sizeof(s)는?	"[\\"3\\",\\"4\\",\\"8\\",\\"알 수 없음\\"]"	1	"abc"는 {'a','b','c','\\0'}로 저장됩니다. null 문자 포함 4바이트.	1	2026-01-07 07:45:38.599+00
quiz-c-6-2	c-6-2	multiple_choice	char *s = "hello"; s[0] = 'H'; 의 결과는?	"[\\"정상 동작\\",\\"컴파일 에러\\",\\"런타임 에러 (크래시)\\",\\"경고만 출력\\"]"	2	문자열 리터럴은 읽기 전용 메모리에 저장됩니다. 수정하면 Segmentation fault.	1	2026-01-07 07:45:38.629+00
quiz-c-6-3	c-6-3	multiple_choice	struct { int a; char b; }의 크기는? (64비트, 일반적인 경우)	"[\\"5\\",\\"8\\",\\"12\\",\\"컴파일러마다 다름\\"]"	1	int(4) + char(1) = 5이지만, 정렬을 위해 패딩 3바이트가 추가되어 8바이트입니다.	1	2026-01-07 07:45:38.66+00
quiz-c-6-4	c-6-4	multiple_choice	struct S { int a; }; struct S *p; p->a와 동일한 표현은?	"[\\"*p.a\\",\\"(*p).a\\",\\"p.a\\",\\"*p->a\\"]"	1	p->a == (*p).a. 연산자 우선순위 때문에 (*p)를 괄호로 묶어야 합니다.	1	2026-01-07 07:45:38.693+00
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.submissions (id, user_id, problem_id, code, verdict, execution_time, created_at) FROM stdin;
\.


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.user_progress (id, user_id, lesson_id, status, current_step, quiz_score, quiz_total, started_at, completed_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: codeinsight
--

COPY public.users (id, nickname, role, created_at, updated_at) FROM stdin;
\.


--
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);


--
-- Name: drafts drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: lesson_contents lesson_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.lesson_contents
    ADD CONSTRAINT lesson_contents_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: oauth_accounts oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id);


--
-- Name: problems problems_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT problems_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: chapters_language_id_order_idx; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX chapters_language_id_order_idx ON public.chapters USING btree (language_id, "order");


--
-- Name: chapters_language_id_part_idx; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX chapters_language_id_part_idx ON public.chapters USING btree (language_id, part);


--
-- Name: drafts_user_id_problem_id_key; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE UNIQUE INDEX drafts_user_id_problem_id_key ON public.drafts USING btree (user_id, problem_id);


--
-- Name: idx_problems_difficulty; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX idx_problems_difficulty ON public.problems USING btree (difficulty);


--
-- Name: idx_submissions_user_problem; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX idx_submissions_user_problem ON public.submissions USING btree (user_id, problem_id);


--
-- Name: lesson_contents_lesson_id_key; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE UNIQUE INDEX lesson_contents_lesson_id_key ON public.lesson_contents USING btree (lesson_id);


--
-- Name: lessons_chapter_id_order_idx; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX lessons_chapter_id_order_idx ON public.lessons USING btree (chapter_id, "order");


--
-- Name: oauth_accounts_provider_provider_id_key; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE UNIQUE INDEX oauth_accounts_provider_provider_id_key ON public.oauth_accounts USING btree (provider, provider_id);


--
-- Name: oauth_accounts_user_id_idx; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX oauth_accounts_user_id_idx ON public.oauth_accounts USING btree (user_id);


--
-- Name: problems_number_key; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE UNIQUE INDEX problems_number_key ON public.problems USING btree (number);


--
-- Name: quizzes_lesson_id_order_idx; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX quizzes_lesson_id_order_idx ON public.quizzes USING btree (lesson_id, "order");


--
-- Name: user_progress_lesson_id_idx; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX user_progress_lesson_id_idx ON public.user_progress USING btree (lesson_id);


--
-- Name: user_progress_user_id_idx; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE INDEX user_progress_user_id_idx ON public.user_progress USING btree (user_id);


--
-- Name: user_progress_user_id_lesson_id_key; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE UNIQUE INDEX user_progress_user_id_lesson_id_key ON public.user_progress USING btree (user_id, lesson_id);


--
-- Name: users_nickname_key; Type: INDEX; Schema: public; Owner: codeinsight
--

CREATE UNIQUE INDEX users_nickname_key ON public.users USING btree (nickname);


--
-- Name: chapters chapters_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: drafts drafts_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: drafts drafts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lesson_contents lesson_contents_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.lesson_contents
    ADD CONSTRAINT lesson_contents_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lessons lessons_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: oauth_accounts oauth_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quizzes quizzes_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: submissions submissions_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_progress user_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_progress user_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: codeinsight
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict kbIyN7ifAEEhhZs8wTTPl1pbKRlbHoqCkAXhGUPa8mh3oBUCHk7bNFfpktbrPWV

