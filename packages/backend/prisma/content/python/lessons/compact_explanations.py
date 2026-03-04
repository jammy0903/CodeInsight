#!/usr/bin/env python3
"""
Compact explanation fields in Python lesson JSON files.
Only modifies the explanation field in each step.
"""

import json
import sys

# Map of lessonId -> list of compact explanations (in step order)
COMPACT_EXPLANATIONS = {
    "py-3-1": [
        # step 0: 리스트 생성
        "**`fruits = [\"Apple\", \"Banana\"]`**\n\n대괄호 `[]`로 리스트 객체를 만들고 `fruits` 이름표를 붙입니다. 리스트는 순서가 있고(인덱스 0, 1...), 내용을 추가·수정·삭제할 수 있는(Mutable) 자료구조입니다. 중복 값도 허용합니다.",

        # step 1: 항목 추가 (append)
        "**`fruits.append(\"Orange\")`**\n\n리스트 **맨 끝**에 `\"Orange\"`를 추가합니다. 리스트는 Mutable이므로 **새 객체를 만들지 않고** 기존 객체 내부를 직접 수정합니다. `fruits`는 여전히 같은 객체를 가리킵니다. `append()`의 반환값은 `None`이므로 `fruits = fruits.append(...)`로 쓰면 안 됩니다.",

        # step 2: 항목 수정 (인덱스)
        "**`fruits[0] = \"Grape\"`**\n\n인덱스 0(첫 번째 항목)의 값을 `\"Apple\"`에서 `\"Grape\"`로 교체합니다. `append()`와 달리 길이는 그대로(3→3)이며, 기존 위치의 값만 덮어씁니다. 존재하지 않는 인덱스에 할당하면 `IndexError`가 발생합니다.",

        # step 3: 항목 삭제 (del)
        "**`del fruits[1]`**\n\n`del` 키워드로 인덱스 1의 `\"Banana\"`를 제거합니다. 삭제 후 뒤의 항목들이 자동으로 앞으로 당겨져 `\"Orange\"`의 인덱스가 2→1로 바뀝니다. 값으로 삭제하려면 `remove()`, 삭제하면서 반환받으려면 `pop()`을 사용합니다.",

        # step 4: 최종 리스트 출력
        "**`print(fruits)`**\n\n모든 수정을 거친 최종 리스트 `['Grape', 'Orange']`를 출력합니다. 생성부터 삭제까지 모든 변경이 **같은 객체** 위에서 이루어졌습니다. `b = fruits`처럼 단순 할당은 복사가 아닌 주소 공유이므로, 독립 복사본이 필요하면 `fruits[:]`나 `list(fruits)`를 사용하세요.",
    ],

    "py-3-2": [
        # step 0: 튜플 생성
        "**`point = (10, 20)`**\n\n소괄호 `()`로 튜플 객체를 만들고 `point` 이름표를 붙입니다. 튜플은 리스트와 달리 **Immutable(수정 불가)**으로, 한 번 만들면 내용을 바꿀 수 없습니다. 원소가 하나인 튜플은 `(10,)`처럼 쉼표가 필수입니다.",

        # step 1: 항목 읽기 (인덱싱)
        "**`print(point[0])`**\n\n튜플의 인덱스 0 값 `10`을 읽어 출력합니다. 튜플은 Immutable이지만 **읽기(`[]` 인덱싱, `len()`, `in`, 순회)는 모두 허용**됩니다. 수정(`point[0] = 99`)만 TypeError가 발생합니다.",

        # step 2: 수정 시도 (에러 발생)
        "**`# point[0] = 99  # TypeError!`**\n\n주석 처리된 코드입니다. 주석을 제거하면 `TypeError: 'tuple' object does not support item assignment`가 발생합니다. 튜플은 `__setitem__` 메서드 자체가 없어 수정이 불가능합니다. 좌표·색상값처럼 변하면 안 되는 데이터에 튜플을 사용합니다.",

        # step 3: 튜플 언패킹(Unpacking)
        "**`x, y = point`**\n\n튜플의 각 항목을 순서대로 개별 변수에 할당합니다. 이것이 **언패킹(Unpacking)**입니다. `x = point[0]; y = point[1]`을 한 줄로 줄인 것과 같으며, 함수에서 여러 값을 반환할 때 특히 유용합니다.",

        # step 4: 언패킹 결과 출력
        "**`print(f\"x={x}, y={y}\")`**\n\n언패킹으로 분리된 `x`(10)와 `y`(20)를 f-string으로 출력합니다. 결과: `x=10, y=20`. 언패킹 덕분에 `point[0]`, `point[1]`보다 직관적인 이름으로 값을 사용할 수 있습니다.",
    ],

    "py-3-3": [
        # step 0: 딕셔너리 첫 번째 항목
        "**`\"name\": \"Alice\"`**\n\n딕셔너리의 첫 번째 키-값 쌍입니다. 키 `\"name\"`으로 값 `\"Alice\"`를 찾을 수 있습니다. 딕셔너리는 내부적으로 해시 테이블로 구현되어 O(1) 조회 속도를 제공합니다. 키는 Immutable 타입(문자열, 숫자, 튜플)만 사용 가능합니다.",

        # step 1: 딕셔너리 두 번째 항목
        "**`\"age\": 25`**\n\n두 번째 키-값 쌍을 추가합니다. 딕셔너리의 값(Value)은 문자열·정수·리스트·딕셔너리 등 어떤 타입이든 가능합니다. Python 3.7+부터 삽입 순서가 보장됩니다.",

        # step 2: 딕셔너리 생성 완료
        "**`user = {...}`**\n\n딕셔너리 객체 생성이 완료되어 `user` 변수에 할당됩니다. 딕셔너리는 Mutable이므로 이후 항목을 추가·수정·삭제할 수 있으며, 해시 테이블 덕분에 데이터가 많아도 O(1)로 빠르게 조회합니다.",

        # step 3: 값 접근
        "**`print(user[\"name\"])`**\n\n대괄호 `[]`에 키를 넣어 값 `\"Alice\"`를 조회합니다. 없는 키를 조회하면 `KeyError`가 발생합니다. 키가 있는지 확실하지 않을 때는 `user.get(\"name\")` 또는 `user.get(\"name\", 기본값)`을 사용하세요.",

        # step 4: 값 수정
        "**`user[\"age\"] = 26`**\n\n이미 존재하는 키 `\"age\"`의 값을 25에서 26으로 수정합니다. 딕셔너리는 Mutable이므로 새 객체를 만들지 않고 기존 객체 내부를 직접 변경합니다.",

        # step 5: 새 항목 추가
        "**`user[\"city\"] = \"Seoul\"`**\n\n존재하지 않는 키 `\"city\"`에 할당하면 새 키-값 쌍이 **자동으로 추가**됩니다. 리스트에서 없는 인덱스에 할당하면 `IndexError`가 나는 것과 달리, 딕셔너리는 자동으로 확장됩니다.",

        # step 6: 키 존재 여부 확인
        "**`if \"job\" in user:`**\n\n`in` 연산자로 키 존재 여부를 O(1)로 확인합니다. `\"job\"` 키가 없으므로 `False`가 되어 `print` 블록이 실행되지 않습니다. 없는 키 조회 시 `KeyError`를 방지하는 기본 패턴입니다.",
    ],

    "py-3-4": [
        # step 0: 세트 생성
        "**`nums = {1, 2, 2, 3, 3, 3}`**\n\n중괄호 `{}`로 세트를 만듭니다. 세트는 **중복을 허용하지 않으므로** 6개를 넣어도 `{1, 2, 3}`(3개)만 남습니다. 빈 세트는 `{}` 대신 반드시 `set()`으로 만들어야 합니다(`{}`는 빈 딕셔너리).",

        # step 1: 중복 제거 확인
        "**`print(nums)`**\n\n중복 제거된 세트 `{1, 2, 3}`을 출력합니다. 세트는 순서가 없으므로 출력 순서는 보장되지 않습니다. 순서가 중요하다면 리스트를 사용하고, 중복 제거나 빠른 포함 여부 확인(`in`이 O(1))이 필요하면 세트를 사용합니다.",

        # step 2: 항목 추가 (add)
        "**`nums.add(4)`**\n\n세트에 `4`를 추가합니다. 이미 있는 값을 `add()`해도 에러 없이 무시됩니다. `append()`는 리스트 전용이고, 세트는 `add()`를 사용합니다. 기존 객체를 제자리에서 수정(Mutable)합니다.",

        # step 3: 항목 삭제 (remove)
        "**`nums.remove(1)`**\n\n세트에서 `1`을 제거합니다. 없는 값을 `remove()`하면 `KeyError`가 발생합니다. 값이 없어도 에러를 내지 않으려면 `discard()`를 사용하세요.",

        # step 4: 집합 연산을 위한 세트 'a' 생성
        "**`a = {1, 2, 3}`**\n\n교집합·합집합 등 집합 연산 시연을 위한 첫 번째 세트를 생성합니다. 세트는 수학의 집합론 연산(`&`, `|`, `-`, `^`)을 코드로 간결하게 표현할 수 있습니다.",

        # step 5: 집합 연산을 위한 세트 'b' 생성
        "**`b = {3, 4, 5}`**\n\n집합 연산용 두 번째 세트를 생성합니다. `a`와 `b`의 공통 원소는 `3`뿐이고, 전체 원소는 `{1, 2, 3, 4, 5}`입니다.",

        # step 6: 교집합 연산 (&)
        "**`print(a & b)`**\n\n두 세트에 **모두 포함된** 원소만 모으는 교집합(Intersection)입니다. 결과: `{3}`. `&` 연산은 원본 `a`, `b`를 변경하지 않고 새 세트를 반환합니다.",

        # step 7: 합집합 연산 (|)
        "**`print(a | b)`**\n\n두 세트의 **모든 원소를 합치는** 합집합(Union)입니다. 중복은 자동 제거됩니다. 결과: `{1, 2, 3, 4, 5}`. 원본을 변경하려면 `a |= b`와 같은 복합 할당을 사용합니다.",
    ],

    "py-3-5": [
        # step 0: 딕셔너리 생성
        "**`person = {\"name\": \"Alice\", \"age\": 25}`**\n\n두 개의 키-값 쌍을 가진 딕셔너리 객체를 생성합니다. 이 레슨에서는 수정 후에도 `id()`가 변하지 않음을 확인하여 딕셔너리의 **Mutable** 특성을 증명합니다.",

        # step 1: 객체 ID 확인
        "**`print(f\"id = {id(person)}\")`**\n\n`id()`로 딕셔너리 객체의 고유 식별자(메모리 주소)를 출력합니다. 이 값을 수정 후와 비교하여 **같은 객체임을 증명**합니다. Mutable 객체는 수정해도 `id()`가 불변합니다.",

        # step 2: 기존 키 값 수정
        "**`person[\"age\"] = 26`**\n\n기존 키 `\"age\"`의 값을 25에서 26으로 수정합니다. 딕셔너리는 Mutable이므로 새 객체를 만들지 않고 기존 객체 내부만 변경합니다. 객체의 `id()`는 변하지 않습니다.",

        # step 3: 새로운 키-값 추가
        "**`person[\"city\"] = \"Seoul\"`**\n\n없는 키에 할당하면 새 키-값 쌍이 자동으로 추가됩니다. 이 작업 역시 기존 객체(같은 `id()`)를 직접 변경합니다.",

        # step 4: 변경 후 내용 확인
        "**`print(f\"After changes: {person}\")`**\n\n수정·추가가 반영된 현재 딕셔너리 내용을 출력합니다. 결과: `{'name': 'Alice', 'age': 26, 'city': 'Seoul'}`. 다음 줄에서 `id()`를 다시 확인하여 같은 객체임을 증명합니다.",

        # step 5: ID 불변 확인
        "**`print(f\"id = {id(person)}\")`**\n\n수정 후 다시 확인한 `id()`가 처음과 **동일합니다**. 이것이 Mutable의 핵심 증거입니다. Immutable 객체(정수, 문자열)는 값 변경 시 새 객체가 생겨 `id()`가 바뀝니다.",

        # step 6: 참조(별명) 생성
        "**`ref = person`**\n\n`ref`는 복사본이 아닌 **같은 객체의 별명(Alias)**입니다. `id(ref) == id(person)`이 `True`입니다. 한쪽을 통해 수정하면 다른 쪽에도 즉시 반영됩니다.",

        # step 7: 참조를 통해 수정
        "**`ref[\"name\"] = \"Bob\"`**\n\n`ref`를 통해 `\"name\"`을 수정합니다. `ref`와 `person`이 같은 객체를 공유하므로 `person`으로 접근해도 변경된 값이 보입니다. 독립 복사본이 필요하면 `person.copy()` 또는 `copy.deepcopy(person)`을 사용하세요.",

        # step 8: 원본도 변경되었는지 확인
        "**`print(f\"person: {person}\")`**\n\n`ref`를 수정했지만 `person`을 출력해도 `'name': 'Bob'`으로 바뀌어 있습니다. 이것이 Aliasing의 핵심입니다. `=` 할당은 복사가 아니라 같은 객체에 이름표를 하나 더 붙이는 것입니다.",
    ],

    "py-3-6": [
        # step 0: 세트 생성
        "**`fruits = {\"apple\", \"banana\"}`**\n\n중괄호로 세트 객체를 만듭니다. 세트는 중복 불허·순서 없음·Mutable의 특성을 가집니다. 빈 세트는 `{}` 대신 `set()`으로 만들어야 합니다(`{}`는 딕셔너리).",

        # step 1: 객체 ID 확인
        "**`print(f\"id = {id(fruits)}\")`**\n\n세트 객체의 고유 ID를 출력합니다. Mutable 객체는 내용을 변경해도 `id()`가 그대로입니다. 이 값을 수정 후와 비교하여 같은 객체임을 확인합니다.",

        # step 2: 요소 추가 (add)
        "**`fruits.add(\"cherry\")`**\n\n세트에 `\"cherry\"`를 추가합니다. 이미 있는 값을 `add()`해도 에러 없이 무시됩니다. 세트는 중복을 허용하지 않기 때문입니다. 기존 객체를 제자리에서 수정합니다.",

        # step 3: 요소 삭제 (discard)
        "**`fruits.discard(\"banana\")`**\n\n`\"banana\"`를 삭제합니다. `discard()`는 없는 값을 삭제해도 에러 없이 무시합니다. `remove()`는 없는 값 삭제 시 `KeyError`를 발생시키므로, 값이 있는지 확실하지 않을 때는 `discard()`가 더 안전합니다.",

        # step 4: 변경 후 내용 확인
        "**`print(f\"After changes: {fruits}\")`**\n\n`add(\"cherry\")`와 `discard(\"banana\")` 이후 세트의 현재 내용을 출력합니다. 세트는 순서가 없으므로 출력 순서는 매번 다를 수 있습니다. 이것은 버그가 아닌 정상 동작입니다.",

        # step 5: ID 불변 확인
        "**`print(f\"id = {id(fruits)}\")`**\n\n수정 후 `id()`가 처음과 동일합니다. add/remove/discard가 모두 **기존 객체를 제자리에서 수정**하는 Mutable 연산임을 증명합니다.",

        # step 6: frozenset: 수정 불가능한 세트
        "**`frozen = frozenset([1, 2, 3])`**\n\n`frozenset`은 세트의 **Immutable 버전**입니다. 읽기 기능(포함 확인, 교집합 등)은 사용 가능하지만 `add`·`remove` 등 수정 메서드가 없습니다. Immutable이므로 딕셔너리 키로 사용할 수 있습니다.",

        # step 7: frozenset 수정 시도 (에러)
        "**`# frozen.add(4)  # AttributeError!`**\n\n주석을 해제하면 `AttributeError`가 발생합니다. `frozenset`은 수정 메서드 자체가 없기 때문입니다. 변경 불가가 보장되므로 딕셔너리 키나 세트의 원소로 사용할 수 있습니다.",
    ],

    "py-4-1": [
        # step 0: 함수 정의 (greet)
        "**`def greet(name):`**\n\n`def` 키워드로 `greet` 함수 객체를 메모리에 생성하고 전역 네임스페이스에 등록합니다. 내부 코드는 아직 실행되지 않습니다. `def`는 **정의(등록)**이고, 실제 실행은 `greet(\"Alice\")`처럼 괄호로 호출할 때입니다.",

        # step 1: 첫 번째 함수 호출
        "**`greet(\"Alice\")`**\n\n`greet` 함수를 인자 `\"Alice\"`와 함께 호출합니다. 호출 시 새 로컬 프레임이 생성되고 매개변수 `name`에 `\"Alice\"`가 바인딩됩니다. 매개변수(Parameter)는 함수 정의 시의 `name`, 인자(Argument)는 호출 시 전달하는 `\"Alice\"`입니다.",

        # step 2: greet 함수 실행 (Alice)
        "**`print(f\"Hello, {name}!\")`**\n\n`name = \"Alice\"`가 바인딩된 상태에서 f-string이 `\"Hello, Alice!\"`로 평가되어 출력됩니다. `name`은 함수 내부에서만 존재하는 지역 변수로, 함수 종료 시 자동으로 사라집니다. 이 함수에 `return`이 없으므로 `None`을 반환합니다.",

        # step 3: 두 번째 함수 호출
        "**`greet(\"Bob\")`**\n\n같은 함수를 다른 인자 `\"Bob\"`으로 재호출합니다. 이전 호출의 로컬 프레임은 이미 삭제되었고, 새 프레임이 생성되어 `name = \"Bob\"`이 바인딩됩니다. 함수의 핵심 장점인 **코드 재사용**입니다.",

        # step 4: greet 함수 실행 (Bob)
        "**`print(f\"Hello, {name}!\")`**\n\n이번엔 `name = \"Bob\"`이 바인딩되어 `\"Hello, Bob!\"`이 출력됩니다. 같은 코드가 다른 데이터로 재실행됩니다. 함수 종료 후 로컬 프레임이 삭제됩니다.",

        # step 5: 함수 정의 (square)
        "**`def square(n):`**\n\n`return`으로 값을 돌려주는 `square` 함수를 정의합니다. 함수 본문 첫 줄의 `\"\"\"...\"\"\"` Docstring은 `help(square)` 또는 `square.__doc__`으로 확인할 수 있는 공식 설명 문서입니다. `greet`과 달리 `return`이 있어 결과를 다른 표현식에 활용할 수 있습니다.",

        # step 6: square 함수 호출
        "**`print(square(5))`**\n\n중첩 호출입니다. **안쪽 `square(5)`가 먼저** 실행되어 `25`를 반환하고, 그 값이 `print()`에 전달되어 출력됩니다. `greet`과 달리 반환값이 있으므로 이처럼 다른 함수의 인자로 전달할 수 있습니다.",

        # step 7: square 함수 실행
        "**`return n * n`**\n\n`n = 5`이므로 `5 * 5 = 25`를 계산하고 반환합니다. `return`은 값을 호출자에게 돌려주고 함수를 즉시 종료합니다. `return` 이후 코드는 실행되지 않으며, `return`이 없으면 자동으로 `None`을 반환합니다.",
    ],

    "py-4-2": [
        # step 0: 매개변수와 디폴트 값
        "**`def add(a, b=10):`**\n\n`b=10`처럼 매개변수에 기본값을 설정하면 **디폴트 매개변수(Default Parameter)**입니다. 호출 시 `b`를 생략하면 자동으로 10이 사용됩니다. 디폴트 매개변수는 반드시 일반 매개변수 뒤에 와야 합니다(`def func(a=5, b):`는 SyntaxError).",

        # step 1: 위치 인자로 함수 호출
        "**`res1 = add(5, 3)`**\n\n**위치 인자(Positional Argument)**: 값을 왼쪽부터 순서대로 매개변수에 대응시킵니다. `5 → a`, `3 → b`. `b`에 3이 명시적으로 전달되었으므로 디폴트 값 10은 사용되지 않습니다.",

        # step 2: add 함수 실행 (5+3)
        "**`return a + b`**\n\n`a=5`, `b=3`으로 `5 + 3 = 8`을 계산하고 반환합니다. 반환된 `8`이 `res1`에 할당됩니다. `return`이 없으면 `None`이 반환되어 `res1 = None`이 됩니다.",

        # step 3: 키워드 인자로 함수 호출
        "**`res2 = add(b=5, a=3)`**\n\n**키워드 인자(Keyword Argument)**: 매개변수 이름을 명시하여 전달 순서와 무관하게 올바른 매개변수에 할당됩니다. `a=3`, `b=5`. 위치 인자와 섞을 때는 위치 인자가 반드시 먼저 와야 합니다.",

        # step 4: add 함수 실행 (3+5)
        "**`return a + b`**\n\n`a=3`, `b=5`로 `3 + 5 = 8`을 반환합니다. 이름으로 매칭했기 때문에 호출 시 순서를 바꿔도 결과가 동일합니다. 덧셈이 아닌 뺄셈(`a - b`)이었다면 결과가 달라집니다.",

        # step 5: 디폴트 인자 사용
        "**`res3 = add(7)`**\n\n`a=7`만 전달하고 `b`를 생략했습니다. Python이 `b`에 인자가 없음을 감지하여 **디폴트 값 10**을 자동으로 사용합니다. 디폴트 값은 함수 **정의 시 한 번만** 평가됩니다. 리스트 같은 가변 객체를 디폴트로 쓰면 모든 호출이 같은 객체를 공유하는 버그가 생깁니다.",

        # step 6: add 함수 실행 (7+10)
        "**`return a + b`**\n\n`a=7`, `b=10`(디폴트)으로 `7 + 10 = 17`을 반환합니다. 세 가지 호출 결과: 위치 인자 `add(5, 3)` → 8, 키워드 인자 `add(b=5, a=3)` → 8, 디폴트 활용 `add(7)` → 17.",

        # step 7: 최종 결과 출력
        "**`print(res1, res2, res3)`**\n\n세 결과를 한 번에 출력합니다: `8 8 17`. `print()`는 콤마로 구분된 여러 값을 기본적으로 공백으로 구분하여 출력하며, `sep` 매개변수로 구분자를 바꿀 수 있습니다.",
    ],

    "py-4-3": [
        # step 0: 일반 함수 정의
        "**`def add(x, y):`**\n\n두 수를 더하는 일반 함수 `add`를 정의합니다. 이후 등장할 람다 함수와 비교하기 위한 기준입니다. `def`로 만든 함수는 이름이 있고, 여러 줄의 복잡한 로직을 담을 수 있습니다.",

        # step 1: 람다(Lambda) 함수
        "**`add_lambda = lambda x, y: x + y`**\n\n`lambda` 키워드로 **이름 없는 익명 함수**를 만듭니다. 문법: `lambda 매개변수: 표현식`. 콜론 오른쪽 표현식의 결과가 **자동으로 반환**됩니다(`return` 불필요, 불가). 단일 표현식만 허용하며 `if-for-while` 같은 문장은 사용 불가합니다.",

        # step 2: 일반 함수 호출
        "**`print(add(2, 3))`**\n\n일반 함수를 호출합니다. `add(2, 3)` → 함수 내부 실행 → `return 5` → `print(5)`. 다음 줄의 람다 호출과 결과가 같다는 것을 확인합니다.",

        # step 3: add 함수 실행
        "**`return x + y`**\n\n`x=2`, `y=3`으로 `2 + 3 = 5`를 반환합니다. 일반 함수에서는 `return` 키워드가 필요합니다. 이것이 람다(자동 반환)와의 차이점입니다.",

        # step 4: 람다 함수 호출
        "**`print(add_lambda(2, 3))`**\n\n람다 함수 호출 방법은 일반 함수와 동일합니다. `add_lambda(2, 3)` → 람다 표현식 실행 → `5` 자동 반환. Python 입장에서 `add`든 `add_lambda`든 함수 객체를 호출하는 것입니다.",

        # step 5: 람다 함수 실행
        "**`lambda x, y: x + y`**\n\n`x=2`, `y=3`으로 `2 + 3 = 5`가 **자동 반환**됩니다. 람다의 콜론 뒤 표현식 결과는 `return` 없이 자동으로 반환됩니다. 변수에 할당하는 용도라면 PEP 8은 `def`를 권장하며, 람다의 진가는 `sort(key=lambda ...)` 같은 고차 함수 인자로 쓸 때입니다.",

        # step 6: 정렬할 리스트 준비
        "**`pairs = [(1, 'one'), (3, 'three'), (2, 'two')]`**\n\n(숫자, 문자열) 튜플을 원소로 가지는 리스트를 생성합니다. 이 데이터로 `sort(key=lambda p: p[1])`처럼 정렬 기준을 람다로 지정하는 패턴을 보여줍니다.",

        # step 7: 람다를 활용한 정렬
        "**`pairs.sort(key=lambda p: p[1])`**\n\n`key=lambda p: p[1]`은 각 원소 `p`에서 두 번째 항목(`p[1]`, 문자열)을 기준으로 정렬합니다. 별도의 `def` 없이 정렬 기준을 한 줄로 표현할 수 있습니다. 기준 로직이 복잡해지면 `def`가 가독성에 유리합니다.",

        # step 8: 정렬 결과 출력
        "**`print(pairs)`**\n\n알파벳 순(one < three < two)으로 정렬된 결과를 출력합니다. 람다는 `sort()`, `filter()`, `map()`, `max()`, `min()` 등의 `key` 인자에 활용하기 적합합니다. 여러 번 재사용하거나 복잡한 로직이 필요하면 `def`를 사용하세요.",
    ],

    "py-4-4": [
        # step 0: 모듈 가져오기 (import)
        "**`import math`**\n\n`import` 키워드로 `math` 모듈 전체를 가져옵니다. 모듈은 다른 `.py` 파일에 정의된 함수·클래스·변수의 모음입니다. 이후 `math.함수명` 형식으로 접근합니다. `import`는 관례상 파일 맨 위에 모아서 작성합니다.",

        # step 1: 모듈의 상수 사용
        "**`print(math.pi)`**\n\n`math` 모듈의 상수 `pi`(원주율)를 접근하여 출력합니다. `math.` 접두사는 이 이름이 `math` 모듈 네임스페이스에 속함을 나타냅니다. 내 코드에 `pi = 3.14`가 있어도 `math.pi`와 충돌하지 않습니다.",

        # step 2: 모듈의 함수 사용
        "**`print(math.sqrt(16))`**\n\n`math.sqrt()`로 16의 제곱근을 계산합니다. 결과가 `4.0`인 이유는 `sqrt()`가 항상 **float**를 반환하기 때문입니다. `math.sqrt(-1)`은 `ValueError`가 발생하며, 음수 제곱근에는 `cmath` 모듈을 사용합니다.",

        # step 3: 특정 함수만 가져오기 (from)
        "**`from random import randint`**\n\n`random` 모듈에서 `randint` 함수**만** 현재 네임스페이스로 직접 가져옵니다. 이후 `random.randint()` 대신 `randint()`로 바로 호출할 수 있습니다. `from random import *`처럼 `*`를 쓰면 이름 충돌 위험이 있어 권장하지 않습니다.",

        # step 4: 가져온 함수 바로 사용
        "**`print(randint(1, 10))`**\n\n접두사 없이 바로 `randint(1, 10)`을 호출합니다. 1 이상 10 **이하**의 임의 정수를 반환합니다. `range(1, 10)`이 10을 포함하지 않는 것과 달리, `randint`는 양 끝을 모두 포함합니다.",

        # step 5: 별명 붙여 가져오기 (as)
        "**`import datetime as dt`**\n\n`as` 키워드로 `datetime` 모듈에 짧은 별명 `dt`를 붙입니다. 이후 `datetime.` 대신 `dt.`를 사용합니다. 별명을 붙이면 원래 이름(`datetime`)은 사용 불가합니다. `import numpy as np`, `import pandas as pd` 등 업계 관례를 따를 때도 활용합니다.",

        # step 6: 별명으로 모듈 사용
        "**`now = dt.datetime.now()`**\n\n별명 `dt`로 `datetime` 모듈의 `datetime` 클래스의 `now()` 메서드를 호출합니다. `dt`는 모듈, `dt.datetime`은 그 안의 클래스입니다. 현재 로컬 시각을 반환합니다.",

        # step 7: 결과 출력
        "**`print(now)`**\n\n`now` 객체를 출력합니다. `datetime` 객체의 `__str__` 메서드 덕분에 `YYYY-MM-DD HH:MM:SS` 형식으로 자동 변환됩니다. 세 가지 import 방식 요약: `import math`, `from random import randint`, `import datetime as dt`.",
    ],

    "py-4-5": [
        # step 0: 리스트를 반환하는 함수 정의
        "**`def get_list():`**\n\n리스트를 생성하여 반환하는 함수를 정의합니다. 이 레슨의 핵심 질문은 \"함수의 `return`은 값의 복사본인가, 객체의 참조인가?\"입니다. `def`는 함수 객체를 등록할 뿐, 내부 코드는 호출 시 실행됩니다.",

        # step 1: 첫 번째 함수 호출
        "**`a = get_list()`**\n\n함수를 호출합니다. 실행 흐름이 함수 내부로 이동하고, 반환된 값이 `a`에 할당됩니다. `()`가 없으면 함수 객체 자체를 할당하므로 반드시 `()`를 붙여야 합니다.",

        # step 2: 리스트 생성 (첫 번째)
        "**`data = [1, 2, 3]`**\n\n함수 내부에서 새로운 리스트 객체가 생성됩니다. `data`는 함수 내부에서만 존재하는 지역 변수입니다. 리스트 리터럴 `[1, 2, 3]`은 평가될 때마다 새 객체를 생성합니다.",

        # step 3: 리스트 반환 (첫 번째)
        "**`return data`**\n\n리스트의 내용을 복사하는 것이 아니라 **객체의 참조(메모리 주소)**를 반환합니다. `data` 이름은 함수 종료 후 사라지지만, `a`가 같은 객체를 참조하므로 객체는 메모리에 유지됩니다.",

        # step 4: 두 번째 함수 호출
        "**`b = get_list()`**\n\n같은 함수를 두 번째로 호출합니다. 이 호출은 첫 번째 호출과 완전히 독립적이며, 새로운 로컬 프레임이 생성됩니다.",

        # step 5: 리스트 생성 (두 번째)
        "**`data = [1, 2, 3]`**\n\n**또 다른 새로운** 리스트 객체가 생성됩니다. 내용(`[1, 2, 3]`)은 첫 번째와 같지만 메모리 주소가 다른 **별개의 객체**입니다. 리스트 리터럴은 평가마다 새 객체를 만듭니다.",

        # step 6: 리스트 반환 (두 번째)
        "**`return data`**\n\n두 번째로 생성된 리스트의 참조를 반환합니다. 이제 `a`와 `b`는 **서로 다른 객체**를 가리킵니다. `a.append(4)`를 해도 `b`에는 영향이 없습니다.",

        # step 7: 변수 a의 내용 출력
        "**`print(f\"a: {a}\")`**\n\n`a`가 가리키는 리스트의 내용 `[1, 2, 3]`을 출력합니다. `a`와 `b`의 출력이 같아 보이지만, 이는 **값(내용)이 같은 것**이지 같은 객체가 아닙니다.",

        # step 8: 변수 b의 내용 출력
        "**`print(f\"b: {b}\")`**\n\n`b`가 가리키는 리스트의 내용 `[1, 2, 3]`을 출력합니다. `a == b`는 `True`(값이 같음)이지만, `a is b`는 `False`(다른 객체)입니다. 이 차이가 다음 단계에서 확인됩니다.",

        # step 9: 객체 동일성 검사 (is)
        "**`print(f\"a is b: {a is b}\")`**\n\n`is` 연산자는 두 변수가 **완전히 같은 객체**(같은 메모리 주소)인지 확인합니다. `a is b → False`. `is`는 동일성(identity), `==`는 동등성(equality)을 비교합니다. 같은 함수를 두 번 호출하면 리스트 리터럴이 매번 새 객체를 만들기 때문에 `False`입니다.",
    ],
}


def compact_file(filepath: str, lesson_id: str, explanations: list) -> bool:
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    steps = data.get("content", {}).get("steps", [])

    if len(steps) != len(explanations):
        print(f"WARNING: {lesson_id} has {len(steps)} steps but {len(explanations)} explanations provided!", file=sys.stderr)
        return False

    for i, (step, new_exp) in enumerate(zip(steps, explanations)):
        step["explanation"] = new_exp

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"OK: {lesson_id} ({len(steps)} steps)")
    return True


def main():
    base = "/home/jammy/projects/C-OSINE/packages/backend/prisma/content/python/lessons"

    results = []
    for lesson_id, explanations in COMPACT_EXPLANATIONS.items():
        filepath = f"{base}/{lesson_id}.json"
        ok = compact_file(filepath, lesson_id, explanations)
        results.append((lesson_id, ok))

    print("\nSummary:")
    for lesson_id, ok in results:
        status = "OK" if ok else "FAILED"
        print(f"  {lesson_id}: {status}")


if __name__ == "__main__":
    main()
