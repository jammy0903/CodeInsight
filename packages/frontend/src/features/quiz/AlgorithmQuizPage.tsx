/**
 * AlgorithmQuizPage - 알고리즘 퀴즈 페이지
 *
 * DESIGN: 혼합 문제 타입 (객관식/빈칸/주관식) 지원
 * URL: /quiz/algorithm/:lang
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Brain, Check, X, RotateCcw, BookOpen, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { codeViewerColors } from '@/config/themes';
import { Timer } from './components/Timer';
import { useStore } from '@/stores/store';
import type { SupportedLanguage } from '@/types';

interface AlgoQuiz {
  id: string;
  type: 'mc' | 'blank' | 'short';
  question: string;
  options?: string[];
  answer: number | string;
  code?: string;
  acceptedAnswers?: string[];
  explanation: string;
}

interface Chapter {
  id: string;
  title: string;
  quizzes: AlgoQuiz[];
}

const LANGUAGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  python: { name: 'Python', icon: '\uD83D\uDC0D', color: '#3776AB' },
};

const QUIZ_DATA: Record<string, Chapter[]> = {
  python: [
    // ── 챕터 1: 그리디 ──
    {
      id: 'greedy',
      title: '그리디 알고리즘',
      quizzes: [
        { id: '1', type: 'mc', question: '그리디 알고리즘의 핵심 전략은?', options: ['모든 경우를 탐색한다', '매 순간 최적의 선택을 한다', '문제를 작은 부분으로 나눈다', '이전 결과를 저장하여 재사용한다'], answer: 1, explanation: '그리디(Greedy)는 "욕심쟁이"라는 뜻이에요. 미래를 생각하지 않고 지금 당장 가장 좋아 보이는 것만 고르는 전략입니다. 예: 거스름돈 줄 때 가장 큰 동전부터 주는 것처럼요. 단순하지만, 문제에 따라 최적해를 보장할 수도 있고 못 할 수도 있습니다.' },
        { id: '2', type: 'blank', question: '동전 개수를 계산하는 코드의 빈칸을 채우세요.', code: 'count += target ____ coin', answer: '//', acceptedAnswers: ['//', '/ /'], explanation: '// 는 Python의 "정수 나눗셈" 연산자입니다. 예를 들어 1260 // 500 = 2 (소수점 버림). 즉, 1260원을 500원 동전으로 최대 몇 개 쓸 수 있는지를 구하는 거예요. 일반 나눗셈 / 와 다르게 소수점 없이 딱 떨어지는 몫만 반환합니다.' },
        { id: '3', type: 'blank', question: '동전을 사용한 후 남은 금액을 계산하세요.', code: 'target ____ coin', answer: '%=', acceptedAnswers: ['%='], explanation: '%= 는 나머지를 구해서 다시 변수에 저장하는 연산자예요. target %= coin 은 target = target % coin 과 같습니다. 예: 1260 % 500 = 260 (500원 2개 쓰고 남은 금액). 이렇게 큰 동전부터 쓰고 남은 금액으로 다음 동전을 계산합니다.' },
        { id: '4', type: 'short', question: 'coins = [500, 100, 50, 10], target = 1260일 때 최소 동전 개수는?', answer: '6', acceptedAnswers: ['6', '6개'], explanation: '큰 동전부터 차례로 계산합니다: 500원 \u2192 1260//500=2개 (남은 돈: 260원) \u2192 100원 \u2192 260//100=2개 (남은 돈: 60원) \u2192 50원 \u2192 60//50=1개 (남은 돈: 10원) \u2192 10원 \u2192 10//10=1개 (남은 돈: 0원). 총 2+2+1+1 = 6개입니다.' },
        { id: '5', type: 'mc', question: '그리디가 동전 문제에서 최적해를 보장하려면?', options: ['동전이 오름차순 정렬되어야 한다', '동전이 배수 관계여야 한다', '동전이 3개 이상이어야 한다', '목표 금액이 짝수여야 한다'], answer: 1, explanation: '한국 동전(10, 50, 100, 500)은 서로 배수 관계예요. 500=100\u00D75, 100=50\u00D72, 50=10\u00D75. 이런 경우 큰 동전부터 쓰면 항상 최소 개수가 보장됩니다. 하지만 동전이 [1, 7, 10]처럼 배수가 아니면 그리디가 실패할 수 있어요.' },
        { id: '6', type: 'short', question: 'coins = [1, 7, 10], target = 14일 때 그리디 결과는? (동전 개수)', answer: '5', acceptedAnswers: ['5', '5개'], explanation: '그리디는 큰 동전부터 씁니다: 10원 1개 (남은 돈: 4원) \u2192 7원은 4원보다 크니 스킵 \u2192 1원 4개 (남은 돈: 0원). 총 1+4 = 5개. 하지만 이게 최소일까요? 아닙니다! 7원 2개 = 14원 (2개)이 더 적죠. 이것이 그리디의 한계입니다.' },
        { id: '7', type: 'short', question: 'coins = [1, 7, 10], target = 14의 실제 최적해는? (동전 개수)', answer: '2', acceptedAnswers: ['2', '2개'], explanation: '7원 \u00D7 2개 = 14원, 총 2개면 됩니다! 그리디는 10원부터 골랐지만, 실제로는 7원 2개가 최소예요. 동전이 배수 관계가 아니면(10은 7의 배수가 아님) 그리디가 최적해를 못 찾을 수 있습니다. 이런 경우에는 DP(다이나믹 프로그래밍)를 써야 합니다.' },
        { id: '8', type: 'mc', question: '그리디가 최적해를 보장하지 못할 때 사용할 수 있는 알고리즘은?', options: ['버블 정렬', '이진 탐색', '다이나믹 프로그래밍 (DP)', '선택 정렬'], answer: 2, explanation: 'DP는 "가능한 모든 경우를 체계적으로 따져보는" 방법이에요. 그리디가 "지금 당장 최고"를 고르다 실패할 수 있는 문제에서, DP는 모든 선택지를 다 계산하되, 이미 계산한 결과를 저장(메모)해서 중복 계산을 없앱니다. 느리지만 항상 정확한 답을 찾아줍니다.' },
        { id: '9', type: 'blank', question: 'for 문으로 동전 리스트를 순회하세요.', code: 'for coin ____ coins:', answer: 'in', acceptedAnswers: ['in'], explanation: 'Python에서 리스트를 하나씩 꺼내려면 for ... in 문법을 씁니다. for coin in coins: 는 "coins 리스트에서 동전을 하나씩 꺼내서 coin 변수에 넣어라"는 뜻이에요. coins = [500, 100, 50, 10]이면 coin이 차례로 500, 100, 50, 10이 됩니다.' },
        { id: '10', type: 'mc', question: '동전 N개를 순회하는 그리디 알고리즘의 시간 복잡도는?', options: ['O(1)', 'O(N)', 'O(N log N)', 'O(N\u00B2)'], answer: 1, explanation: '시간 복잡도란 "입력 크기에 따라 연산이 얼마나 늘어나는지"를 나타내요. 동전이 4종류면 for문이 4번, 10종류면 10번 돕니다. 동전 개수(N)에 비례해서 딱 한 번씩만 순회하니까 O(N)입니다. O(1)은 입력과 무관하게 일정, O(N\u00B2)은 이중 for문 수준이에요.' },
      ],
    },
    // ── 챕터 2: 정렬 ──
    {
      id: 'sorting',
      title: '정렬 알고리즘',
      quizzes: [
        { id: '1', type: 'mc', question: '버블 정렬의 시간 복잡도(최악)는?', options: ['O(N)', 'O(N log N)', 'O(N\u00B2)', 'O(log N)'], answer: 2, explanation: '버블 정렬은 옆에 있는 두 수를 비교해서 순서가 틀리면 바꾸는 걸 반복합니다. N개 원소에 대해 N번 패스를 돌아야 하니 N\u00D7N = O(N\u00B2)이에요. 배열이 10개면 약 100번, 1000개면 약 1,000,000번 비교하게 되어 매우 느립니다. 코딩테스트에서는 거의 쓰지 않아요.' },
        { id: '2', type: 'mc', question: '다음 중 안정(stable) 정렬이 아닌 것은?', options: ['버블 정렬', '병합 정렬', '삽입 정렬', '선택 정렬'], answer: 3, explanation: '"안정 정렬"이란 같은 값을 가진 원소들의 원래 순서가 정렬 후에도 유지되는 걸 말해요. 예: [(김, 90), (박, 90)]을 점수로 정렬할 때 김이 박보다 앞에 있었으면 정렬 후에도 그 순서가 유지돼야 안정 정렬입니다. 선택 정렬은 원소를 교환할 때 이 순서가 깨질 수 있어요.' },
        { id: '3', type: 'blank', question: 'Python 리스트를 내림차순으로 정렬하세요.', code: 'nums.sort(reverse=____)', answer: 'True', acceptedAnswers: ['True', 'true'], explanation: 'sort()는 기본적으로 오름차순(1,2,3...) 정렬입니다. reverse=True를 넣으면 반대로 내림차순(3,2,1...)으로 정렬돼요. 코딩테스트에서 "큰 것부터 처리"할 때 자주 씁니다. 예: [3,1,2].sort(reverse=True) \u2192 [3,2,1]' },
        { id: '4', type: 'short', question: '[3, 1, 4, 1, 5]를 버블 정렬할 때 첫 번째 패스 후 결과는?', answer: '[1, 3, 1, 4, 5]', acceptedAnswers: ['[1, 3, 1, 4, 5]', '[1,3,1,4,5]', '1,3,1,4,5'], explanation: '버블 정렬의 첫 패스를 따라가 봅시다: (3,1)\u2192교환\u2192[1,3,4,1,5], (3,4)\u2192그대로, (4,1)\u2192교환\u2192[1,3,1,4,5], (4,5)\u2192그대로. 한 번의 패스가 끝나면 가장 큰 값(5)이 맨 뒤로 "떠오릅니다". 이래서 "버블(거품)" 정렬이라고 불러요.' },
        { id: '5', type: 'mc', question: '퀵 정렬의 평균 시간 복잡도는?', options: ['O(N)', 'O(N log N)', 'O(N\u00B2)', 'O(log N)'], answer: 1, explanation: '퀵 정렬은 "기준값(피벗)"을 하나 고르고, 작은 것은 왼쪽, 큰 것은 오른쪽으로 나눈 뒤 각각 또 정렬하는 방식이에요. 매번 반으로 나누니(log N단계) 각 단계에서 N개를 비교 \u2192 평균 O(N log N). 실제로 가장 빠른 정렬 중 하나라 코테에서도 많이 쓰입니다.' },
        { id: '6', type: 'blank', question: 'key 함수로 문자열 길이 기준 정렬을 하세요.', code: 'words.sort(key=____)', answer: 'len', acceptedAnswers: ['len'], explanation: 'sort()의 key 파라미터에 함수를 넣으면 "그 함수의 결과값"을 기준으로 정렬해요. key=len이면 각 문자열의 길이(len)를 기준으로 정렬합니다. 예: ["cat", "a", "elephant"].sort(key=len) \u2192 ["a", "cat", "elephant"]. 코테에서 정렬 기준을 바꿀 때 필수로 쓰이는 테크닉이에요.' },
        { id: '7', type: 'mc', question: '병합 정렬의 공간 복잡도는?', options: ['O(1)', 'O(log N)', 'O(N)', 'O(N\u00B2)'], answer: 2, explanation: '병합 정렬은 배열을 반으로 쪼개고, 정렬된 두 조각을 합치는(merge) 방식이에요. 합칠 때 임시 배열에 복사해야 하므로 원래 배열 크기만큼 O(N)의 추가 메모리가 필요합니다. 반면 퀵 정렬은 제자리(in-place)에서 하므로 추가 메모리가 거의 안 들어요.' },
        { id: '8', type: 'short', question: 'Python의 sorted() 함수가 내부적으로 사용하는 정렬 알고리즘 이름은?', answer: 'Timsort', acceptedAnswers: ['timsort', 'Timsort', 'tim sort', 'Tim Sort', '팀소트', '팀정렬'], explanation: 'Python의 sorted()와 .sort()는 Timsort라는 특별한 알고리즘을 씁니다. Tim Peters라는 개발자가 만들었어요. 삽입 정렬과 병합 정렬의 장점을 합친 하이브리드 방식으로, 이미 어느 정도 정렬된 데이터에서 특히 빠릅니다. 그래서 Python 정렬은 믿고 쓸 수 있어요!' },
        { id: '9', type: 'blank', question: '삽입 정렬에서 현재 값을 올바른 위치에 삽입하세요.', code: 'while j > 0 and arr[j-1] ____ key:', answer: '>', acceptedAnswers: ['>', '> '], explanation: '삽입 정렬은 카드 게임에서 손에 들린 카드를 정리하는 것과 같아요. 새 카드(key)를 받으면 이미 정렬된 카드 중 알맞은 자리를 찾아 끼워 넣습니다. arr[j-1] > key는 "앞의 카드가 새 카드보다 크면 한 칸 뒤로 밀어라"는 뜻이에요. 크지 않으면 그 자리에 넣으면 됩니다.' },
        { id: '10', type: 'mc', question: '이미 정렬된 배열에서 가장 빠른 정렬은?', options: ['퀵 정렬', '버블 정렬', '삽입 정렬', '선택 정렬'], answer: 2, explanation: '삽입 정렬은 이미 정렬된 배열이면 각 원소를 한 번만 확인하고 넘어가서 O(N)이에요. 반면 퀵 정렬은 피벗 선택이 나쁘면 O(N\u00B2)까지 느려질 수 있고, 선택 정렬은 항상 O(N\u00B2)입니다. 그래서 "거의 정렬된" 데이터에는 삽입 정렬이 최고입니다.' },
      ],
    },
    // ── 챕터 3: 다이나믹 프로그래밍 ──
    {
      id: 'dp',
      title: '다이나믹 프로그래밍',
      quizzes: [
        { id: '1', type: 'mc', question: 'DP의 핵심 개념 두 가지는?', options: ['분할과 병합', '최적 부분 구조와 중복 부분 문제', '탐색과 정렬', '재귀와 반복'], answer: 1, explanation: 'DP가 작동하려면 두 조건이 필요해요. (1) 최적 부분 구조: 큰 문제의 최적해가 작은 문제의 최적해로 구성됨. (2) 중복 부분 문제: 같은 작은 문제가 여러 번 반복됨. 예: 피보나치에서 F(5) 구하려면 F(3)이 여러 번 필요한데, 한 번 계산해서 저장하면 반복을 줄일 수 있어요.' },
        { id: '2', type: 'blank', question: '피보나치 DP 테이블 초기화를 완성하세요.', code: 'dp[0] = 0\ndp[____] = 1', answer: '1', acceptedAnswers: ['1'], explanation: '피보나치 수열은 0, 1, 1, 2, 3, 5, 8... 입니다. 맨 처음 두 값(dp[0]=0, dp[1]=1)을 미리 정해놓는 것을 "base case(기저 조건)"라고 해요. 이 시작값이 없으면 점화식을 계산할 수 없습니다. 마치 도미노의 첫 번째 블록을 세우는 것과 같아요.' },
        { id: '3', type: 'blank', question: '피보나치 DP 점화식의 빈칸을 채우세요.', code: 'dp[i] = dp[i-1] ____ dp[i-2]', answer: '+', acceptedAnswers: ['+'], explanation: '피보나치 수열의 규칙은 "앞의 두 수를 더한 것이 다음 수"예요. F(n) = F(n-1) + F(n-2). 이걸 코드로 쓰면 dp[i] = dp[i-1] + dp[i-2]. 이런 규칙을 "점화식(recurrence)"이라 하고, DP 문제의 핵심은 이 점화식을 찾는 거예요.' },
        { id: '4', type: 'short', question: '피보나치 수열에서 F(6)의 값은? (F(0)=0, F(1)=1)', answer: '8', acceptedAnswers: ['8'], explanation: '직접 따라가 볼게요: F(0)=0, F(1)=1, F(2)=0+1=1, F(3)=1+1=2, F(4)=2+1=3, F(5)=3+2=5, F(6)=5+3=8. 코테에서 이런 식으로 작은 값부터 차례로 채워나가는 게 DP의 기본 패턴입니다.' },
        { id: '5', type: 'mc', question: '메모이제이션(Memoization)은 어떤 방식의 DP인가?', options: ['Bottom-up', 'Top-down', 'Left-right', 'Brute-force'], answer: 1, explanation: 'Top-down은 "위에서 아래로" 내려가는 방식이에요. F(6)을 구하려면 F(5)와 F(4)가 필요하고, F(5)는 또 F(4)와 F(3)이 필요하고... 이렇게 재귀로 위에서부터 내려가되, 한 번 계산한 값은 메모장(딕셔너리나 배열)에 저장해서 같은 계산을 반복하지 않는 겁니다.' },
        { id: '6', type: 'mc', question: '타뷸레이션(Tabulation)은 어떤 방식의 DP인가?', options: ['Top-down', 'Bottom-up', '그리디', '분할정복'], answer: 1, explanation: 'Bottom-up은 "아래에서 위로" 올라가는 방식이에요. F(0), F(1)부터 시작해서 for문으로 F(2), F(3)... 순서대로 테이블을 채워나갑니다. 재귀 없이 반복문만 쓰니까 코드가 직관적이고 스택 오버플로 걱정도 없어요. 코테에서 가장 많이 쓰는 DP 방식입니다.' },
        { id: '7', type: 'blank', question: '0-1 배낭 문제의 점화식을 완성하세요.', code: 'dp[i][w] = ____(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])', answer: 'max', acceptedAnswers: ['max'], explanation: '배낭 문제는 "무게 제한이 있는 가방에 물건을 넣어 가치를 최대화"하는 문제예요. 각 물건마다 두 가지 선택지가 있습니다: (1) 안 넣기 \u2192 dp[i-1][w], (2) 넣기 \u2192 dp[i-1][w-무게] + 가치. 이 중 더 큰(max) 쪽을 고르면 됩니다. 코테 단골 문제예요!' },
        { id: '8', type: 'short', question: 'DP로 동전 교환 문제를 풀 때, coins=[1,7,10], target=14의 최소 동전 수는?', answer: '2', acceptedAnswers: ['2', '2개'], explanation: 'DP는 0원부터 14원까지 모든 금액에 대해 최소 동전 수를 계산합니다. dp[7]=1(7원 1개), dp[14]=dp[7]+1=2(7원 2개). 그리디는 10+1+1+1+1=5개라고 답했지만, DP는 모든 경우를 다 따져서 7\u00D72=2개라는 최적해를 찾아냅니다. 이게 DP의 힘이에요!' },
        { id: '9', type: 'mc', question: 'DP의 시간 복잡도가 그리디보다 보통 높은 이유는?', options: ['알고리즘이 복잡해서', '모든 부분 문제를 계산하므로', '정렬이 필요해서', '재귀를 사용해서'], answer: 1, explanation: '그리디는 매 단계에서 한 가지 선택만 하지만, DP는 가능한 모든 부분 문제의 답을 테이블에 저장합니다. 동전 문제라면 0원~target원까지 전부 계산해요. 그래서 시간이 더 걸리지만, 그만큼 빠뜨리는 경우 없이 정확한 최적해를 보장합니다. "느리지만 확실한 방법"이에요.' },
        { id: '10', type: 'blank', question: '메모이제이션 데코레이터를 적용하세요.', code: '____\ndef fib(n):', answer: '@lru_cache', acceptedAnswers: ['@lru_cache', '@lru_cache()', '@lru_cache(maxsize=None)', '@cache'], explanation: '@lru_cache는 Python이 제공하는 "자동 메모이제이션" 장치예요. 함수 위에 이 한 줄만 붙이면, 같은 인자로 호출될 때 이전 결과를 자동으로 캐시해서 돌려줍니다. fib(5)를 처음 계산하면 저장해두고, 다음에 또 fib(5)가 필요하면 계산 없이 바로 꺼내줘요. from functools import lru_cache를 먼저 import해야 합니다.' },
      ],
    },
    // ── 챕터 4: BFS/DFS ──
    {
      id: 'bfs-dfs',
      title: 'BFS / DFS 탐색',
      quizzes: [
        { id: '1', type: 'mc', question: 'BFS에서 사용하는 자료구조는?', options: ['스택 (Stack)', '큐 (Queue)', '힙 (Heap)', '트리 (Tree)'], answer: 1, explanation: 'BFS(너비 우선 탐색)는 큐(Queue)를 사용해요. 큐는 "먼저 넣은 것이 먼저 나오는" 줄서기 구조(FIFO)입니다. 시작점에서 가까운 노드부터 차례로 방문하려면, 발견한 순서대로 줄을 세워야 하니까 큐가 딱 맞아요. 마치 물결이 퍼져나가듯 탐색합니다.' },
        { id: '2', type: 'mc', question: 'DFS에서 사용하는 자료구조는?', options: ['큐 (Queue)', '스택 (Stack)', '배열 (Array)', '해시맵 (HashMap)'], answer: 1, explanation: 'DFS(깊이 우선 탐색)는 스택(Stack) 또는 재귀를 사용해요. 스택은 "나중에 넣은 것이 먼저 나오는" 구조(LIFO)입니다. 한 방향으로 끝까지 파고들다가 막히면 되돌아오는데, 재귀 함수 호출 자체가 내부적으로 스택을 사용하기 때문에 재귀로 구현하면 자연스럽게 DFS가 됩니다.' },
        { id: '3', type: 'blank', question: 'BFS에서 큐에 노드를 추가하세요.', code: 'from collections import deque\nqueue = deque([start])\nqueue.____(next_node)', answer: 'append', acceptedAnswers: ['append'], explanation: 'deque의 append()는 큐 뒤쪽에 데이터를 넣는 함수예요. BFS에서 "이웃 노드를 발견하면 큐 뒤에 줄 세우기"를 하는 겁니다. 앞에서는 popleft()로 꺼내고, 뒤에서는 append()로 넣으면 자연스럽게 FIFO(선입선출) 큐가 됩니다.' },
        { id: '4', type: 'blank', question: 'BFS에서 큐 앞의 노드를 꺼내세요.', code: 'node = queue.____()', answer: 'popleft', acceptedAnswers: ['popleft'], explanation: 'popleft()는 큐의 맨 앞(가장 먼저 넣은 것)을 꺼내는 함수예요. 일반 리스트의 pop(0)도 같은 역할이지만 O(N)으로 느립니다. deque의 popleft()는 O(1)으로 훨씬 빨라요. 코테에서 BFS를 쓸 때는 반드시 deque를 사용하세요!' },
        { id: '5', type: 'mc', question: '최단 경로를 보장하는 탐색은? (가중치 없는 그래프)', options: ['DFS', 'BFS', '둘 다', '둘 다 아님'], answer: 1, explanation: 'BFS는 시작점에서 1칸 거리 \u2192 2칸 거리 \u2192 3칸 거리... 순서로 탐색하기 때문에, 목표를 처음 발견한 순간이 바로 최단 거리입니다. DFS는 한쪽으로 깊이 파고들기 때문에, 먼 길을 먼저 찾을 수도 있어요. 그래서 "최단 거리" 문제는 BFS가 정석입니다.' },
        { id: '6', type: 'short', question: '노드 V개, 간선 E개 그래프에서 BFS의 시간 복잡도는?', answer: 'O(V+E)', acceptedAnswers: ['O(V+E)', 'O(V + E)', 'O(v+e)'], explanation: 'BFS는 모든 노드를 한 번씩 방문(V번)하고, 각 노드에서 연결된 간선을 확인(총 E번)합니다. 그래서 V+E번의 작업 \u2192 O(V+E). 예: 노드 5개, 간선 7개면 약 12번의 작업. 그래프 탐색의 시간 복잡도는 거의 항상 O(V+E)라고 외워두세요!' },
        { id: '7', type: 'blank', question: 'DFS 재귀에서 방문 체크를 하세요.', code: 'visited.____(node)', answer: 'add', acceptedAnswers: ['add'], explanation: 'visited는 set(집합) 자료구조예요. set.add(node)로 "이 노드는 이미 방문했다"고 기록합니다. 왜 set을 쓸까요? set은 값이 있는지 확인하는 게 O(1)로 매우 빠르기 때문이에요. 리스트로 하면 O(N)이라 느립니다. 방문 체크 안 하면 무한 루프에 빠져요!' },
        { id: '8', type: 'mc', question: '미로 찾기에서 최단 거리를 구할 때 적합한 알고리즘은?', options: ['DFS', 'BFS', '그리디', '버블 정렬'], answer: 1, explanation: '미로를 격자(2D 배열)로 표현하면, 각 칸이 노드이고 상하좌우가 간선인 그래프예요. BFS로 시작점에서 한 칸씩 퍼져나가면 목적지에 도달한 순간이 최단 거리입니다. 코테에서 "미로 최단거리", "0과 1로 된 격자에서 최단경로" 문제가 나오면 BFS를 떠올리세요!' },
        { id: '9', type: 'blank', question: 'DFS에서 이웃 노드를 순회하세요.', code: 'for neighbor ____ graph[node]:', answer: 'in', acceptedAnswers: ['in'], explanation: 'graph[node]는 node에 연결된 이웃 노드들의 리스트예요. 예를 들어 graph = {1: [2, 3]}이면 노드 1은 노드 2, 3과 연결된 거예요. for neighbor in graph[node]:로 이웃들을 하나씩 꺼내서, 방문하지 않은 이웃이면 재귀로 더 깊이 들어갑니다.' },
        { id: '10', type: 'mc', question: 'DFS로 해결하기 적합한 문제는?', options: ['최단 거리', '연결 요소 찾기', '위상 정렬', '연결 요소와 위상 정렬 모두'], answer: 3, explanation: 'DFS는 다양한 그래프 문제에 쓰여요. (1) 연결 요소: 그래프에서 서로 이어진 덩어리가 몇 개인지 세기. (2) 위상 정렬: 선수과목처럼 순서가 있는 일들의 실행 순서 정하기. (3) 사이클 탐지: 그래프에 순환이 있는지 확인. 최단 거리만 BFS고, 나머지는 대부분 DFS가 적합합니다.' },
      ],
    },
    // ── 챕터 5: 이진 탐색 ──
    {
      id: 'binary-search',
      title: '이진 탐색',
      quizzes: [
        { id: '1', type: 'mc', question: '이진 탐색의 전제 조건은?', options: ['배열이 정렬되어 있어야 한다', '배열 크기가 짝수여야 한다', '값이 양수여야 한다', '중복이 없어야 한다'], answer: 0, explanation: '이진 탐색은 "정렬된" 배열에서만 쓸 수 있어요. 사전에서 단어를 찾을 때 가운데를 펼쳐서 앞쪽/뒤쪽을 판단하는 것과 같은 원리예요. 정렬이 안 되어 있으면 중간값을 봐도 어느 쪽에 답이 있는지 알 수 없습니다. 그래서 이진 탐색 전에 반드시 정렬이 필요합니다.' },
        { id: '2', type: 'blank', question: '이진 탐색의 중간 인덱스를 구하세요.', code: 'mid = (left + right) ____ 2', answer: '//', acceptedAnswers: ['//', '/ /'], explanation: 'left와 right 사이의 중간 지점을 구해요. 예: left=0, right=9이면 mid=(0+9)//2=4. //를 쓰는 이유는 인덱스는 정수여야 하니까요. /를 쓰면 4.5가 되어 인덱스로 못 씁니다. 이 mid 위치의 값을 확인해서 찾는 값보다 크면 왼쪽, 작으면 오른쪽을 탐색합니다.' },
        { id: '3', type: 'mc', question: '이진 탐색의 시간 복잡도는?', options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'], answer: 2, explanation: '이진 탐색은 매번 탐색 범위를 절반으로 줄여요. 1000개 \u2192 500 \u2192 250 \u2192 125 \u2192 ... \u2192 1. 1000을 계속 2로 나누면 약 10번이면 1이 됩니다(log\u2082 1000 \u2248 10). 그래서 O(log N)이에요. 100만 개여도 20번이면 찾을 수 있어서 엄청 빠릅니다!' },
        { id: '4', type: 'short', question: '크기 1000인 정렬 배열에서 이진 탐색 시 최대 비교 횟수는?', answer: '10', acceptedAnswers: ['10', '10번', '10회'], explanation: '매번 반으로 줄이니까: 1000 \u2192 500 \u2192 250 \u2192 125 \u2192 63 \u2192 32 \u2192 16 \u2192 8 \u2192 4 \u2192 2 \u2192 1, 총 10번이면 답을 찾거나 없다고 판단할 수 있어요. 공식으로는 log\u2082(1000) \u2248 9.97, 올림하면 10. 앞에서부터 하나씩 확인하면 최대 1000번인데, 이진 탐색은 10번이면 끝!' },
        { id: '5', type: 'blank', question: '목표값이 중간값보다 클 때 왼쪽 경계를 이동하세요.', code: 'if arr[mid] < target:\n    left = mid ____ 1', answer: '+', acceptedAnswers: ['+'], explanation: 'arr[mid]가 target보다 작다면, mid와 mid 왼쪽에는 답이 없어요 (정렬되어 있으니까). 그래서 left를 mid+1로 옮겨서 "mid 오른쪽만 탐색"하겠다는 뜻입니다. 이렇게 탐색 범위를 절반으로 줄이는 게 이진 탐색의 핵심이에요.' },
        { id: '6', type: 'blank', question: '목표값이 중간값보다 작을 때 오른쪽 경계를 이동하세요.', code: 'if arr[mid] > target:\n    right = mid ____ 1', answer: '-', acceptedAnswers: ['-'], explanation: 'arr[mid]가 target보다 크다면, mid와 mid 오른쪽에는 답이 없어요. 그래서 right를 mid-1로 옮겨서 "mid 왼쪽만 탐색"합니다. left = mid + 1 (오른쪽으로), right = mid - 1 (왼쪽으로) 이 두 줄이 이진 탐색의 뼈대예요.' },
        { id: '7', type: 'mc', question: 'Python의 bisect 모듈에서 bisect_left가 반환하는 것은?', options: ['값 자체', '삽입할 왼쪽 인덱스', '삽입할 오른쪽 인덱스', '배열 길이'], answer: 1, explanation: 'bisect_left(arr, x)는 "정렬된 arr에서 x를 넣을 수 있는 가장 왼쪽 위치"를 알려줘요. 예: arr=[1,3,5,7]에서 bisect_left(arr, 5) = 2 (인덱스 2에 넣으면 정렬 유지). 직접 이진 탐색을 짜지 않아도 되니 코테에서 매우 편리합니다. from bisect import bisect_left로 사용하세요.' },
        { id: '8', type: 'short', question: '[1, 3, 5, 7, 9]에서 target=5일 때, 이진 탐색의 첫 mid 값은? (인덱스)', answer: '2', acceptedAnswers: ['2'], explanation: '처음 left=0, right=4(마지막 인덱스). mid = (0+4)//2 = 2. arr[2] = 5이고, 찾는 값이 5이니까 바로 찾았습니다! 운이 좋으면 한 번에 찾을 수도 있어요. 못 찾았다면 5보다 큰지 작은지에 따라 left 또는 right를 옮겨서 계속 탐색합니다.' },
        { id: '9', type: 'mc', question: '이진 탐색의 while 조건으로 올바른 것은?', options: ['left < right', 'left <= right', 'left != right', 'left > right'], answer: 1, explanation: 'left <= right를 써야 탐색 범위에 원소가 하나만 남았을 때(left == right)도 검사합니다. left < right만 쓰면 마지막 하나를 놓칠 수 있어요. 예: arr=[5]에서 5를 찾을 때 left=0, right=0인데, < 조건이면 while문을 아예 안 돌아서 못 찾게 됩니다.' },
        { id: '10', type: 'blank', question: 'bisect 모듈을 임포트하세요.', code: 'from ____ import bisect_left', answer: 'bisect', acceptedAnswers: ['bisect'], explanation: 'bisect는 Python 내장 모듈로, 정렬된 리스트에서 이진 탐색을 해주는 도구예요. bisect_left(삽입할 왼쪽 위치), bisect_right(삽입할 오른쪽 위치), insort(삽입까지 한 번에) 등의 함수가 있어요. 코테에서 직접 이진 탐색을 짜는 것보다 이 모듈을 쓰면 실수를 줄일 수 있습니다.' },
      ],
    },
    // ── 챕터 6: 스택과 큐 ──
    {
      id: 'stack-queue',
      title: '스택과 큐',
      quizzes: [
        { id: '1', type: 'mc', question: '스택의 동작 원리는?', options: ['FIFO (선입선출)', 'LIFO (후입선출)', 'FILO (선입후출)', 'LIFO와 FILO 모두'], answer: 3, explanation: '스택은 접시 쌓기와 같아요. 가장 마지막에 올린 접시를 가장 먼저 꺼내죠. LIFO(Last In First Out, 마지막에 넣은 게 먼저 나옴) = FILO(First In Last Out, 처음 넣은 게 마지막에 나옴). 같은 말을 반대 방향에서 표현한 거라 둘 다 맞습니다.' },
        { id: '2', type: 'mc', question: '큐의 동작 원리는?', options: ['LIFO', 'FIFO', 'FILO', 'Random'], answer: 1, explanation: '큐(Queue)는 줄서기와 같아요. 먼저 줄 선 사람이 먼저 서비스 받죠. FIFO(First In First Out, 먼저 넣은 게 먼저 나옴). 놀이공원 줄, 프린터 인쇄 대기열 등이 큐의 예시입니다. BFS에서 "가까운 노드부터 처리"할 때 큐를 쓰는 이유도 이 순서 때문이에요.' },
        { id: '3', type: 'blank', question: '스택에 요소를 추가하세요.', code: 'stack = []\nstack.____(10)', answer: 'append', acceptedAnswers: ['append'], explanation: 'Python에서 스택은 별도 클래스 없이 리스트로 구현해요. append()로 뒤에 넣고 pop()으로 뒤에서 꺼내면 LIFO 스택이 됩니다. 다른 언어에서는 push라고 하지만 Python에서는 append가 같은 역할이에요. 간단하죠!' },
        { id: '4', type: 'blank', question: '스택에서 요소를 꺼내세요.', code: 'top = stack.____()', answer: 'pop', acceptedAnswers: ['pop'], explanation: 'pop()은 리스트의 맨 마지막 요소를 제거하고 그 값을 반환해요. stack = [1, 2, 3]에서 pop()하면 3이 나오고 stack은 [1, 2]가 됩니다. 스택에서는 항상 가장 최근에 넣은 것(맨 위)을 꺼내니까 pop()이 딱 맞는 거예요.' },
        { id: '5', type: 'short', question: '괄호 검증 문제에서 "({[]})" 은 유효한가? (O/X)', answer: 'O', acceptedAnswers: ['O', 'o', '유효', '예', 'yes', 'true'], explanation: '스택으로 풀어볼게요: ( \u2192 스택에 push, { \u2192 push, [ \u2192 push. 이제 ] \u2192 스택 top은 [, 매칭! pop. } \u2192 top은 {, 매칭! pop. ) \u2192 top은 (, 매칭! pop. 스택이 비었으므로 유효(O)! 이 "괄호 검증"은 스택 대표 문제로 코테에 자주 나와요.' },
        { id: '6', type: 'short', question: '괄호 검증 문제에서 "([)]" 은 유효한가? (O/X)', answer: 'X', acceptedAnswers: ['X', 'x', '무효', '아니오', 'no', 'false'], explanation: '따라가 봅시다: ( \u2192 push, [ \u2192 push. 이제 ) \u2192 스택 top은 [ 인데 )와 매칭 안 됨! ([는 ])와 매칭되어야 하는데 )가 먼저 왔으니 실패(X). 괄호는 "가장 최근에 연 괄호"를 먼저 닫아야 해요. 이 순서가 바로 스택(LIFO)의 원리입니다.' },
        { id: '7', type: 'blank', question: 'deque로 큐를 만들고, 앞에서 꺼내세요.', code: 'from collections import deque\nq = deque()\nq.append(1)\nval = q.____()', answer: 'popleft', acceptedAnswers: ['popleft'], explanation: 'Python에서 큐를 쓸 때는 collections.deque(덱)를 사용해요. 뒤에서 넣고(append) 앞에서 빼면(popleft) FIFO 큐! 일반 리스트의 pop(0)도 앞에서 빼지만 O(N)이라 느려요. deque의 popleft()는 O(1)이라 코테에서 반드시 deque를 써야 합니다.' },
        { id: '8', type: 'mc', question: '우선순위 큐를 구현하는 데 적합한 자료구조는?', options: ['배열', '연결 리스트', '힙 (Heap)', '스택'], answer: 2, explanation: '우선순위 큐는 "가장 작은(또는 큰) 값을 빠르게 꺼내는" 큐예요. 일반 배열에서 최솟값을 찾으면 O(N)이지만, 힙(Heap)을 쓰면 넣기/빼기가 모두 O(log N)으로 빨라요. Python에서는 heapq 모듈이 최소 힙을 제공합니다. 다익스트라 알고리즘 등에서 필수로 쓰여요.' },
        { id: '9', type: 'blank', question: 'Python에서 최소 힙에 요소를 추가하세요.', code: 'import heapq\nheapq.____(heap, 5)', answer: 'heappush', acceptedAnswers: ['heappush'], explanation: 'heapq.heappush(heap, 값)는 힙에 값을 넣으면서 자동으로 정렬 상태를 유지해줘요. heap = []에 heappush(heap, 5), heappush(heap, 3), heappush(heap, 7) 하면 heap[0]은 항상 가장 작은 값(3)입니다. heappop()으로 꺼내면 가장 작은 값이 나와요.' },
        { id: '10', type: 'mc', question: '스택 두 개로 구현할 수 있는 자료구조는?', options: ['힙', '큐', '트리', '해시맵'], answer: 1, explanation: '면접 단골 질문이에요! 스택A에 push하고, pop할 때 스택B가 비어있으면 A의 모든 원소를 B로 옮깁니다(순서가 뒤집힘). 그 후 B에서 pop하면 처음 넣은 게 나와요. 예: A에 1,2,3 push \u2192 B로 옮기면 3,2,1 \u2192 B.pop()=1 (FIFO!). 이렇게 LIFO 두 개로 FIFO를 만들 수 있습니다.' },
      ],
    },
    // ── 챕터 7: 해시와 딕셔너리 ──
    {
      id: 'hash',
      title: '해시와 딕셔너리',
      quizzes: [
        { id: '1', type: 'mc', question: '해시 테이블의 평균 탐색 시간 복잡도는?', options: ['O(1)', 'O(N)', 'O(log N)', 'O(N\u00B2)'], answer: 0, explanation: '해시 테이블(Python의 dict, set)은 마법처럼 O(1), 즉 데이터가 얼마나 많든 "한 번에" 찾을 수 있어요! 비결은 해시 함수: 키를 넣으면 저장 위치(인덱스)를 바로 계산해줍니다. 사물함 번호를 아는 것처럼 바로 찾아가는 거예요. 코테에서 "빠른 탐색"이 필요하면 dict나 set을 먼저 떠올리세요.' },
        { id: '2', type: 'blank', question: '딕셔너리에서 값을 안전하게 조회하세요.', code: 'count = d.____(key, 0)', answer: 'get', acceptedAnswers: ['get'], explanation: 'd[key]로 접근하면 키가 없을 때 KeyError가 발생해요. 하지만 d.get(key, 0)은 키가 없으면 에러 대신 기본값 0을 반환합니다. 코테에서 "각 원소의 개수 세기" 같은 문제에서 d[x] = d.get(x, 0) + 1 패턴을 정말 많이 써요. 안전하고 간결합니다!' },
        { id: '3', type: 'mc', question: '해시 충돌(collision) 해결법이 아닌 것은?', options: ['체이닝', '개방 주소법', '이진 탐색', '이중 해싱'], answer: 2, explanation: '해시 충돌은 서로 다른 키가 같은 위치에 저장되려 할 때 발생해요. 해결법: (1) 체이닝: 같은 위치에 연결 리스트로 여러 개 저장, (2) 개방 주소법: 빈 다른 자리를 찾아감, (3) 이중 해싱: 두 번째 해시 함수로 다른 위치 계산. 이진 탐색은 정렬된 배열 탐색법이지 충돌 해결법이 아니에요.' },
        { id: '4', type: 'blank', question: '리스트에서 각 요소의 등장 횟수를 세세요.', code: 'from collections import ____\ncounts = Counter(nums)', answer: 'Counter', acceptedAnswers: ['Counter'], explanation: 'Counter는 코테 필수 도구예요! 리스트를 넣으면 각 원소가 몇 번 나왔는지 자동으로 세어 딕셔너리를 만들어줍니다. Counter([1,2,2,3,3,3]) \u2192 {3:3, 2:2, 1:1}. most_common(1)으로 가장 많은 것도 바로 구할 수 있어요. 직접 for문으로 세는 것보다 훨씬 편합니다.' },
        { id: '5', type: 'short', question: '"banana"에서 가장 많이 등장하는 문자와 횟수는? (문자, 숫자)', answer: 'a, 3', acceptedAnswers: ['a, 3', 'a,3', 'a 3', 'a3'], explanation: '"banana"를 한 글자씩 세봅시다: b=1번, a=3번(2,4,6번째), n=2번(3,5번째). Counter("banana") \u2192 {"a":3, "n":2, "b":1}. a가 3번으로 가장 많아요. Counter("banana").most_common(1) \u2192 [("a", 3)]으로 바로 구할 수 있습니다.' },
        { id: '6', type: 'blank', question: '기본값이 0인 딕셔너리를 만드세요.', code: 'from collections import defaultdict\nd = defaultdict(____)', answer: 'int', acceptedAnswers: ['int'], explanation: '일반 dict는 없는 키에 접근하면 에러가 나지만, defaultdict(int)는 없는 키에 접근하면 자동으로 0을 만들어줘요. int()의 기본값이 0이니까요. d["apple"] += 1 이렇게 바로 쓸 수 있어서 편합니다. defaultdict(list)면 빈 리스트[], defaultdict(set)면 빈 집합이 기본값이에요.' },
        { id: '7', type: 'mc', question: '두 리스트의 공통 요소를 O(N)에 찾으려면?', options: ['이중 for문', '정렬 후 이진 탐색', 'set으로 변환 후 교집합', '재귀 탐색'], answer: 2, explanation: '이중 for문은 O(N\u00D7M)으로 느려요. set으로 변환하면 O(N), 교집합(&)은 O(min(N,M))이라 전체 O(N)입니다. 예: set([1,2,3]) & set([2,3,4]) = {2,3}. 코테에서 "두 리스트의 공통 원소", "중복 확인" 문제는 set 변환이 정석이에요.' },
        { id: '8', type: 'blank', question: '두 집합의 교집합을 구하세요.', code: 'common = set_a ____ set_b', answer: '&', acceptedAnswers: ['&'], explanation: 'Python set의 & 연산자는 교집합(둘 다에 있는 원소)을 구해요. {1,2,3} & {2,3,4} = {2,3}. 비슷하게 | 는 합집합, - 는 차집합, ^ 는 대칭차집합(한쪽에만 있는 것)이에요. set_a.intersection(set_b)와 같지만 &가 더 짧고 읽기 쉽습니다.' },
        { id: '9', type: 'short', question: 'nums = [2, 7, 11, 15], target = 9일 때 두 수의 인덱스는? (Two Sum)', answer: '[0, 1]', acceptedAnswers: ['[0, 1]', '[0,1]', '0, 1', '0,1', '(0, 1)', '(0,1)'], explanation: 'LeetCode 1번 문제이자 코테 입문 필수 문제! nums[0]=2, nums[1]=7이고 2+7=9=target이므로 답은 [0,1]. 해시맵으로 풀면 O(N): 각 숫자를 보면서 "target-현재값"이 해시맵에 있는지 확인. 2를 볼 때 9-2=7이 맵에 없으니 저장, 7을 볼 때 9-7=2가 맵에 있으니 정답!' },
        { id: '10', type: 'mc', question: 'Python dict가 순서를 보장하기 시작한 버전은?', options: ['Python 2.7', 'Python 3.5', 'Python 3.7', 'Python 3.10'], answer: 2, explanation: 'Python 3.7부터 dict는 "넣은 순서대로" 저장됩니다. 이전 버전에서는 순서가 뒤죽박죽이었어요. 그래서 옛날 코드에서는 OrderedDict를 썼지만, 이제는 그냥 dict도 순서를 보장해요. 코테에서는 보통 Python 3.7 이상을 쓰니까 dict 순서를 믿어도 됩니다.' },
      ],
    },
    // ── 챕터 8: 재귀와 백트래킹 ──
    {
      id: 'recursion',
      title: '재귀와 백트래킹',
      quizzes: [
        { id: '1', type: 'mc', question: '재귀 함수에 반드시 필요한 것은?', options: ['반복문', '종료 조건 (base case)', '전역 변수', '클래스'], answer: 1, explanation: '재귀 함수는 "자기 자신을 호출하는 함수"예요. 그런데 멈추는 조건(base case)이 없으면 자기를 무한히 호출해서 프로그램이 터져요(RecursionError). 예: factorial(n)에서 n이 1이 되면 더 이상 호출하지 않고 1을 반환 \u2192 이게 base case. 재귀를 짤 때는 항상 "언제 멈추지?"를 먼저 정하세요.' },
        { id: '2', type: 'blank', question: '팩토리얼 재귀의 종료 조건을 작성하세요.', code: 'def factorial(n):\n    if n ____ 1:\n        return 1\n    return n * factorial(n - 1)', answer: '<=', acceptedAnswers: ['<=', '==', '< 2'], explanation: '팩토리얼: 5! = 5\u00D74\u00D73\u00D72\u00D71 = 120. 재귀로 풀면 factorial(5) = 5 \u00D7 factorial(4) = 5 \u00D7 4 \u00D7 factorial(3) ... 이렇게 계속 내려가다가 n이 1 이하가 되면 멈춥니다. n <= 1이면 1을 반환해서 곱하기 체인이 끝나요. ==도 되지만 <=가 n=0인 경우도 안전하게 처리합니다.' },
        { id: '3', type: 'short', question: 'Python의 기본 재귀 깊이 제한은?', answer: '1000', acceptedAnswers: ['1000', '1,000'], explanation: 'Python은 재귀를 최대 1000번까지만 허용해요. 이유는 재귀 한 번마다 메모리(스택 프레임)를 쌓는데, 너무 깊어지면 프로그램이 뻗으니까 미리 제한을 건 거예요. 1000번 넘게 재귀하면 RecursionError: maximum recursion depth exceeded 에러가 납니다. 코테에서 재귀가 깊어질 수 있으면 제한을 늘려야 해요.' },
        { id: '4', type: 'blank', question: '재귀 깊이 제한을 변경하세요.', code: 'import sys\nsys.____(10000)', answer: 'setrecursionlimit', acceptedAnswers: ['setrecursionlimit'], explanation: 'sys.setrecursionlimit(10000)으로 제한을 10000으로 늘릴 수 있어요. 코테에서 DFS를 재귀로 구현할 때 노드가 많으면 반드시 이 줄을 추가해야 해요. 보통 코드 맨 위에 import sys; sys.setrecursionlimit(10**6) 이렇게 넉넉하게 설정합니다. 안 하면 정답인데 런타임 에러로 틀릴 수 있어요!' },
        { id: '5', type: 'mc', question: '백트래킹의 핵심 개념은?', options: ['모든 경우를 무조건 탐색', '유망하지 않으면 되돌아감 (가지치기)', '항상 최적 선택', '분할 정복'], answer: 1, explanation: '백트래킹은 "가능한 선택지를 하나씩 시도하되, 이 길이 아니다 싶으면 바로 되돌아오는" 방법이에요. 미로에서 길을 가다가 막다른 골목이면 돌아오는 것과 같아요. "가지치기(pruning)"로 불필요한 탐색을 건너뛰기 때문에, 모든 경우를 다 보는 브루트포스보다 훨씬 빠릅니다.' },
        { id: '6', type: 'mc', question: 'N-Queens 문제에서 백트래킹이 확인하는 조건이 아닌 것은?', options: ['같은 행', '같은 열', '같은 대각선', '같은 색'], answer: 3, explanation: 'N-Queens는 N\u00D7N 체스판에 N개의 퀸을 서로 공격 못 하게 놓는 문제예요. 퀸은 같은 행/열/대각선 방향으로 공격할 수 있어서, 새 퀸을 놓을 때마다 이 세 가지를 확인합니다. "같은 색"은 체스에서 비숍의 제약이지 퀸과는 무관해요. 대표적인 백트래킹 문제로 코테에도 변형이 자주 나옵니다.' },
        { id: '7', type: 'blank', question: '순열을 생성하는 라이브러리 함수를 완성하세요.', code: 'from itertools import ____\nperms = list(permutations([1, 2, 3]))', answer: 'permutations', acceptedAnswers: ['permutations'], explanation: 'permutations는 "모든 순서의 나열"을 만들어줘요. [1,2,3]의 순열은 (1,2,3), (1,3,2), (2,1,3), (2,3,1), (3,1,2), (3,2,1) 총 6가지. 직접 백트래킹으로 짜도 되지만 itertools.permutations를 쓰면 한 줄이면 끝! 코테에서 "모든 경우의 수"를 빠르게 구할 때 매우 유용합니다.' },
        { id: '8', type: 'short', question: '[1, 2, 3]의 순열 개수는?', answer: '6', acceptedAnswers: ['6', '6개'], explanation: '순열은 "순서가 다르면 다른 경우"예요. 3개를 나열하는 방법: 첫 번째 자리에 3가지 \u00D7 두 번째 자리에 2가지 \u00D7 세 번째 자리에 1가지 = 3! = 3\u00D72\u00D71 = 6가지. N개의 순열은 N!(팩토리얼)개입니다. 10개면 10! = 3,628,800... 매우 빠르게 커지니 N이 크면 브루트포스가 불가능해져요.' },
        { id: '9', type: 'blank', question: '조합을 생성하는 라이브러리 함수를 완성하세요.', code: 'from itertools import ____\ncombs = list(combinations([1,2,3,4], 2))', answer: 'combinations', acceptedAnswers: ['combinations'], explanation: 'combinations(리스트, r)은 리스트에서 r개를 뽑는 모든 조합을 만들어줘요. 순열과 다르게 순서를 신경 쓰지 않습니다. (1,2)와 (2,1)은 같은 조합! [1,2,3,4]에서 2개 뽑기: (1,2), (1,3), (1,4), (2,3), (2,4), (3,4) = 6가지. 코테에서 "N개 중 M개 고르기" 문제에 바로 쓸 수 있어요.' },
        { id: '10', type: 'short', question: '4개 중 2개를 뽑는 조합의 수는?', answer: '6', acceptedAnswers: ['6', '6개', '6가지'], explanation: '조합 공식: C(n, r) = n! / (r! \u00D7 (n-r)!). C(4,2) = 4! / (2! \u00D7 2!) = 24 / (2 \u00D7 2) = 6가지. 쉽게 생각하면: 4명 중 2명을 뽑는 방법이에요. AB, AC, AD, BC, BD, CD = 6가지. 순열(4\u00D73=12)의 절반인 이유는, 순서를 무시하니까 AB=BA로 2!로 나누기 때문이에요.' },
      ],
    },
  ],
};

type ViewState = 'chapters' | 'quiz' | 'result';
type QuizState = 'question' | 'correct' | 'incorrect';

export function AlgorithmQuizPage() {
  const { lang } = useParams<{ lang: string }>();
  const langInfo = LANGUAGE_INFO[lang || 'python'] || LANGUAGE_INFO.python;
  const chapters = QUIZ_DATA[lang || 'python'] || [];

  const currentTheme = useThemeStore((s) => s.theme);
  const colors = codeViewerColors[currentTheme];

  const [viewState, setViewState] = useState<ViewState>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('question');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const setPageTitle = useStore((s) => s.setPageTitle);

  useEffect(() => {
    setPageTitle(
      `${langInfo.name} \uC54C\uACE0\uB9AC\uC998 \uD035\uC988`,
      '\uC54C\uACE0\uB9AC\uC998 \uBB38\uC81C\uB97C \uD480\uC5B4\uBCF4\uC138\uC694',
      lang as SupportedLanguage
    );
  }, [setPageTitle, langInfo.name, lang]);

  const currentQuiz = selectedChapter?.quizzes[currentIndex];
  const totalQuizzes = selectedChapter?.quizzes.length || 0;
  const progress = totalQuizzes > 0 ? ((currentIndex + 1) / totalQuizzes) * 100 : 0;

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setViewState('quiz');
    setCurrentIndex(0);
    setQuizState('question');
    setSelectedOption(null);
    setUserInput('');
    setScore(0);
    setWrongCount(0);
  };

  const normalize = (str: string) =>
    str.replace(/\s+/g, '').normalize('NFKC').toLowerCase();

  const handleMCAnswer = (optionIndex: number) => {
    if (!currentQuiz || quizState !== 'question' || currentQuiz.type !== 'mc') return;
    setSelectedOption(optionIndex);
    if (optionIndex === currentQuiz.answer) {
      setScore((s) => s + 1);
      setQuizState('correct');
    } else {
      setWrongCount((w) => w + 1);
      setQuizState('incorrect');
    }
  };

  const handleTextSubmit = () => {
    if (!userInput.trim() || !currentQuiz) return;
    const accepted = currentQuiz.acceptedAnswers || [String(currentQuiz.answer)];
    const isCorrect = accepted.some((a) => normalize(a) === normalize(userInput));
    if (isCorrect) {
      setScore((s) => s + 1);
      setQuizState('correct');
    } else {
      setWrongCount((w) => w + 1);
      setQuizState('incorrect');
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuizzes - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuizState('question');
      setSelectedOption(null);
      setUserInput('');
    } else {
      setViewState('result');
    }
  };

  const handleTimeout = () => {
    if (!currentQuiz) return;
    setWrongCount((w) => w + 1);
    setQuizState('incorrect');
    if (currentQuiz.type === 'mc') setSelectedOption(-1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setQuizState('question');
    setSelectedOption(null);
    setUserInput('');
    setScore(0);
    setWrongCount(0);
    setViewState('quiz');
  };

  const handleBackToChapters = () => {
    setViewState('chapters');
    setSelectedChapter(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quizState === 'question') {
      handleTextSubmit();
    }
  };

  const getOptionStyle = (index: number) => {
    if (quizState === 'question') {
      return 'border-[var(--theme-quiz-card-border)] bg-[var(--theme-quiz-card-bg)] hover:border-orange-400 hover:bg-orange-50';
    }
    if (currentQuiz && index === currentQuiz.answer) {
      return 'border-green-400 bg-green-50';
    }
    if (index === selectedOption && quizState === 'incorrect') {
      return 'border-red-400 bg-red-50';
    }
    return 'border-[var(--theme-quiz-card-border)] bg-[var(--theme-quiz-card-bg)] opacity-50';
  };

  const renderCode = () => {
    if (!currentQuiz?.code) return null;
    const parts = currentQuiz.code.split('____');

    const blankColors = {
      soft: { bg: '#fff7ed', text: '#c2410c' },
      minimal: { bg: '#fef3c7', text: '#92400e' },
      dark: { bg: '#431407', text: '#fb923c' },
    };

    return (
      <div
        className={`p-4 rounded-xl border-2 mb-4 ${
          quizState === 'correct'
            ? 'bg-green-50 border-green-300'
            : quizState === 'incorrect'
            ? 'bg-red-50 border-red-300'
            : ''
        }`}
        style={
          quizState === 'question'
            ? { backgroundColor: colors.bg, borderColor: colors.lineNumberBorder }
            : undefined
        }
      >
        <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
          {parts.map((part, index) => (
            <span key={index}>
              <span style={{ color: quizState === 'question' ? colors.text : undefined }}>{part}</span>
              {index < parts.length - 1 && (
                <span
                  className={`px-2 py-0.5 rounded ${
                    quizState === 'correct'
                      ? 'bg-green-200 text-green-700'
                      : quizState === 'incorrect'
                      ? 'bg-red-200 text-red-700'
                      : ''
                  }`}
                  style={
                    quizState === 'question'
                      ? { backgroundColor: blankColors[currentTheme].bg, color: blankColors[currentTheme].text }
                      : undefined
                  }
                >
                  {quizState === 'question' ? '____' : String(currentQuiz.answer)}
                </span>
              )}
            </span>
          ))}
        </pre>
      </div>
    );
  };

  // --- Chapters view ---
  if (viewState === 'chapters') {
    return (
      <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen px-3 py-6">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link
              to="/quiz"
              className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
            </Link>
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">
                {'\uC54C\uACE0\uB9AC\uC998 \uD035\uC988'}
              </h1>
              <p className="text-sm" style={{ color: langInfo.color }}>
                {langInfo.icon} {langInfo.name}
              </p>
            </div>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-12 text-[var(--theme-quiz-text-muted)]">
              {'\uC544\uC9C1 \uC900\uBE44\uB41C \uBB38\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.'}
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <motion.button
                  key={chapter.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChapterSelect(chapter)}
                  className="w-full p-4 bg-[var(--theme-quiz-card-bg)] rounded-xl border border-[var(--theme-quiz-card-border)] hover:border-[var(--theme-quiz-card-border-hover)] hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${langInfo.color}20` }}
                      >
                        <BookOpen className="w-5 h-5" style={{ color: langInfo.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--theme-quiz-title)]">{chapter.title}</h3>
                        <p className="text-sm text-[var(--theme-quiz-text-muted)]">{chapter.quizzes.length}{'\uBB38\uC81C'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Result view ---
  if (viewState === 'result') {
    const percentage = Math.round((score / totalQuizzes) * 100);
    return (
      <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen p-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBackToChapters}
              className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
            </button>
            <h1 className="text-xl font-bold text-[var(--theme-quiz-title)]">{'\uD035\uC988 \uACB0\uACFC'}</h1>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-quiz-card-bg)] rounded-2xl border border-[var(--theme-quiz-card-border)] p-8 text-center shadow-lg"
          >
            <div
              className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                percentage >= 80 ? 'bg-green-100' : percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}
            >
              <span
                className={`text-3xl font-bold ${
                  percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}
              >
                {percentage}%
              </span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--theme-quiz-title)] mb-2">
              {percentage >= 80 ? '\uD6CC\uB96D\uD574\uC694!' : percentage >= 60 ? '\uC798\uD588\uC5B4\uC694!' : '\uB2E4\uC2DC \uB3C4\uC804\uD574\uBCF4\uC138\uC694!'}
            </h2>
            <p className="text-[var(--theme-quiz-text-muted)] mb-2">{selectedChapter?.title}</p>
            <p className="text-[var(--theme-quiz-text-muted)] mb-6">
              {totalQuizzes}{'\uBB38\uC81C \uC911 '}
              <span className="text-green-600 font-bold">{score}{'\uBB38\uC81C \uC815\uB2F5'}</span>
              {', '}
              <span className="text-red-500 font-bold">{wrongCount}{'\uBB38\uC81C \uC624\uB2F5'}</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--theme-quiz-card-border)] text-[var(--theme-quiz-title)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                {'\uB2E4\uC2DC \uD480\uAE30'}
              </button>
              <button
                onClick={handleBackToChapters}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
              >
                {'\uCC55\uD130 \uC120\uD0DD'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- Quiz view ---
  return (
    <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen px-3 py-6">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleBackToChapters}
            className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
          </button>
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">{selectedChapter?.title}</h1>
            <p className="text-sm" style={{ color: langInfo.color }}>
              {langInfo.icon} {langInfo.name} {'\uC54C\uACE0\uB9AC\uC998'}
            </p>
          </div>
        </div>

        {/* Progress + Score */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-600">
                {'\uB9DE\uCDA4 '}<span className="font-bold">{score}</span>
              </span>
            </div>
            <div className="text-[var(--theme-quiz-text-muted)] font-mono text-sm">
              {currentIndex + 1} / {totalQuizzes}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-500">
                {'\uD2C0\uB9BC '}<span className="font-bold">{wrongCount}</span>
              </span>
            </div>
          </div>

          {/* Timer */}
          <div className="mb-4 flex justify-center">
            <Timer
              key={currentIndex}
              duration={15}
              onTimeout={handleTimeout}
              isPaused={quizState !== 'question'}
            />
          </div>

          <div className="h-2 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Quiz Card */}
        <AnimatePresence mode="wait">
          {currentQuiz && (
            <motion.div
              key={currentIndex}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Question */}
              <div className="bg-[var(--theme-quiz-card-bg)] rounded-2xl border-2 border-[var(--theme-quiz-card-border)] p-6 mb-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      currentQuiz.type === 'mc'
                        ? 'bg-blue-100 text-blue-700'
                        : currentQuiz.type === 'blank'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {currentQuiz.type === 'mc'
                      ? '\uAC1D\uAD00\uC2DD'
                      : currentQuiz.type === 'blank'
                      ? '\uBE48\uCE78 \uCC44\uC6B0\uAE30'
                      : '\uC8FC\uAD00\uC2DD'}
                  </span>
                </div>
                <p className="text-lg text-[var(--theme-quiz-title)] font-medium leading-relaxed">
                  {currentQuiz.question}
                </p>
              </div>

              {/* Code block for blank type */}
              {currentQuiz.type === 'blank' && renderCode()}

              {/* MC options */}
              {currentQuiz.type === 'mc' && currentQuiz.options && (
                <div className="space-y-3">
                  {currentQuiz.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={quizState === 'question' ? { scale: 1.01 } : {}}
                      whileTap={quizState === 'question' ? { scale: 0.98 } : {}}
                      onClick={() => handleMCAnswer(index)}
                      disabled={quizState !== 'question'}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${getOptionStyle(index)}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                            quizState !== 'question' && index === currentQuiz.answer
                              ? 'bg-green-500 text-white'
                              : quizState === 'incorrect' && index === selectedOption
                              ? 'bg-red-500 text-white'
                              : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-quiz-text)]'
                          }`}
                        >
                          {quizState !== 'question' && index === currentQuiz.answer ? (
                            <Check className="w-4 h-4" />
                          ) : quizState === 'incorrect' && index === selectedOption ? (
                            <X className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className="text-[var(--theme-quiz-title)] font-medium">{option}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Text input for blank/short types */}
              {(currentQuiz.type === 'blank' || currentQuiz.type === 'short') && quizState === 'question' && (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentQuiz.type === 'blank' ? '\uBE48\uCE78\uC5D0 \uB4E4\uC5B4\uAC08 \uCF54\uB4DC' : '\uB2F5\uC744 \uC785\uB825\uD558\uC138\uC694'}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--theme-quiz-card-border)] focus:border-orange-400 focus:outline-none font-mono text-lg"
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTextSubmit}
                    disabled={!userInput.trim()}
                    className="px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold shadow-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {'\uD655\uC778'}
                  </motion.button>
                </div>
              )}

              {/* Answer feedback for blank/short */}
              {(currentQuiz.type === 'blank' || currentQuiz.type === 'short') && quizState !== 'question' && (
                <div
                  className={`p-4 rounded-xl border-2 mb-4 ${
                    quizState === 'correct' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[var(--theme-quiz-text-muted)]">{'\uB0B4 \uB2F5\uBCC0:'}</span>
                    <code
                      className={`px-2 py-1 rounded font-mono text-sm ${
                        quizState === 'correct' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                      }`}
                    >
                      {userInput || '(\uBBF8\uC785\uB825)'}
                    </code>
                  </div>
                  {quizState === 'incorrect' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--theme-quiz-text-muted)]">{'\uC815\uB2F5:'}</span>
                      <code className="px-2 py-1 rounded font-mono text-sm bg-green-200 text-green-700">
                        {String(currentQuiz.answer)}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {quizState !== 'question' && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`mt-4 p-4 rounded-xl ${quizState === 'correct' ? 'bg-green-100' : 'bg-red-100'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {quizState === 'correct' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${quizState === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                      {quizState === 'correct' ? '\uC815\uB2F5!' : '\uC624\uB2F5!'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--theme-quiz-title)]">{currentQuiz.explanation}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next button */}
        {quizState !== 'question' && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="w-full mt-6 py-4 rounded-2xl bg-[var(--theme-dashboard-accent)] text-white font-semibold shadow-lg hover:bg-[var(--theme-dashboard-accent-hover)] transition-colors"
          >
            {currentIndex < totalQuizzes - 1 ? '\uB2E4\uC74C \uBB38\uC81C' : '\uACB0\uACFC \uBCF4\uAE30'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
