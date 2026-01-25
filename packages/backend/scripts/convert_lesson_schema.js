/**
 * 레슨 스키마 변환 스크립트 v2
 * 구버전 Flow 스키마 → 현재 pythonMemoryState 스키마
 * + print() 출력 자동 생성
 * 
 * 사용법: node convert_lesson_schema.js
 */

const fs = require('fs');
const path = require('path');

const LESSONS_DIR = path.join(__dirname, '../prisma/content/python-practical/lessons');

// 코드에서 각 라인까지의 누적 변수 상태와 출력을 분석
function analyzePythonCode(code) {
    const lines = code.split('\n');
    const lineStates = [];
    const variables = new Map();
    let pyIdCounter = 5001;
    let cumulativeOutput = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        let lineOutput = null;
        let newVarName = null;

        // import 문 건너뛰기
        if (line.startsWith('import ') || line.startsWith('from ')) {
            lineStates.push({
                lineNum,
                variables: new Map(variables),
                output: null,
                cumulativeOutput: [...cumulativeOutput],
                newVarName: null
            });
            continue;
        }

        // 변수 할당 파싱
        const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (assignMatch) {
            const [, varName, valueStr] = assignMatch;
            const parsed = parseValue(valueStr.trim(), pyIdCounter++);
            if (parsed) {
                variables.set(varName, parsed);
                newVarName = varName;
            }
        }

        // print() 감지 및 출력 생성
        const printMatch = line.match(/^print\s*\((.+)\)$/);
        if (printMatch) {
            lineOutput = evaluatePrintArg(printMatch[1].trim(), variables);
            if (lineOutput !== null) {
                cumulativeOutput.push(lineOutput);
            }
        }

        lineStates.push({
            lineNum,
            variables: new Map(variables),
            output: lineOutput,
            cumulativeOutput: [...cumulativeOutput],
            newVarName
        });
    }

    return lineStates;
}

// print() 인자를 평가하여 출력 문자열 생성
function evaluatePrintArg(arg, variables) {
    // f-string 처리 (간단한 경우)
    if (arg.startsWith('f"') || arg.startsWith("f'")) {
        // 복잡한 f-string은 그대로 반환
        return arg.slice(2, -1);
    }

    // 문자열 리터럴
    if ((arg.startsWith('"') && arg.endsWith('"')) ||
        (arg.startsWith("'") && arg.endsWith("'"))) {
        return arg.slice(1, -1);
    }

    // 단순 변수
    if (variables.has(arg)) {
        const varData = variables.get(arg);
        return varData.displayValue || String(varData.value);
    }

    // 딕셔너리/리스트 접근 person["name"] 또는 person['name']
    const accessMatch = arg.match(/(\w+)\[["'](\w+)["']\]/);
    if (accessMatch) {
        const [, objName, key] = accessMatch;
        if (variables.has(objName)) {
            const obj = variables.get(objName);
            if (obj.type === 'dict' && obj.rawValue && obj.rawValue[key]) {
                return obj.rawValue[key];
            }
        }
    }

    // 리스트 인덱스 접근 scores[0]
    const listAccessMatch = arg.match(/(\w+)\[(\d+)\]/);
    if (listAccessMatch) {
        const [, listName, indexStr] = listAccessMatch;
        if (variables.has(listName)) {
            const list = variables.get(listName);
            if (list.type === 'list' && list.elements) {
                const index = parseInt(indexStr);
                if (index < list.elements.length) {
                    return String(list.elements[index]);
                }
            }
        }
    }

    // 연결된 문자열 "Hello " + name
    if (arg.includes('+')) {
        const parts = arg.split('+').map(p => p.trim());
        let result = '';
        for (const part of parts) {
            if ((part.startsWith('"') && part.endsWith('"')) ||
                (part.startsWith("'") && part.endsWith("'"))) {
                result += part.slice(1, -1);
            } else if (variables.has(part)) {
                const varData = variables.get(part);
                result += varData.displayValue || String(varData.value);
            }
        }
        return result || null;
    }

    // 평가할 수 없는 경우
    return null;
}

function parseValue(valueStr, pyId) {
    // 문자열
    if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
        (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
        const strVal = valueStr.slice(1, -1);
        return {
            type: 'str',
            value: `'${strVal}'`,
            displayValue: strVal,
            pyId: String(pyId)
        };
    }

    // 숫자
    if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
        const numVal = parseFloat(valueStr);
        return {
            type: Number.isInteger(numVal) ? 'int' : 'float',
            value: String(numVal),
            displayValue: String(numVal),
            pyId: String(pyId)
        };
    }

    // 리스트
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
        try {
            const listContent = valueStr.slice(1, -1);
            const elements = listContent.split(',').map(e => {
                const trimmed = e.trim();
                if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
                    return parseFloat(trimmed);
                }
                return trimmed;
            });
            return {
                type: 'list',
                value: valueStr,
                displayValue: valueStr,
                elements,
                pyId: String(pyId),
                isContainer: true
            };
        } catch (e) {
            return {
                type: 'list',
                value: valueStr,
                displayValue: valueStr,
                pyId: String(pyId),
                isContainer: true
            };
        }
    }

    // 딕셔너리
    if (valueStr.startsWith('{') && valueStr.endsWith('}')) {
        try {
            const jsonStr = valueStr.replace(/'/g, '"');
            const parsed = JSON.parse(jsonStr);
            return {
                type: 'dict',
                value: valueStr,
                displayValue: valueStr,
                rawValue: parsed,
                pyId: String(pyId),
                isContainer: true
            };
        } catch (e) {
            return {
                type: 'dict',
                value: valueStr,
                displayValue: valueStr,
                pyId: String(pyId),
                isContainer: true
            };
        }
    }

    // 함수 호출 등 기타
    return {
        type: 'object',
        value: valueStr,
        displayValue: valueStr,
        pyId: String(pyId)
    };
}

function buildPythonMemoryState(lineState, highlightVarName = null) {
    const names = [];
    const objects = [];

    for (const [varName, varData] of lineState.variables) {
        const objId = `obj_${varName}`;

        names.push({
            name: varName,
            pointsTo: objId
        });

        const objEntry = {
            id: objId,
            type: varData.type,
            value: varData.value,
            pyId: varData.pyId
        };

        if (varName === highlightVarName) {
            objEntry.highlight = true;
        }

        objects.push(objEntry);
    }

    return { names, objects };
}

function convertStep(step, lineStates, code) {
    const newStep = {
        line: step.line,
        title: step.title,
        explanation: step.explanation,
        highlight: step.highlight,
        visualizationType: 'python'
    };

    // 해당 라인까지의 상태 찾기
    const lineIndex = step.line - 1;
    if (lineIndex >= 0 && lineIndex < lineStates.length) {
        const lineState = lineStates[lineIndex];
        const memState = buildPythonMemoryState(lineState, lineState.newVarName);

        // 누적 출력이 있으면 추가
        if (lineState.cumulativeOutput && lineState.cumulativeOutput.length > 0) {
            memState.output = lineState.cumulativeOutput;
        }
        // 또는 원본에 stdout이 있었으면 사용
        else if (step.stdout) {
            memState.output = [step.stdout];
        }

        newStep.pythonMemoryState = memState;
    } else {
        newStep.pythonMemoryState = {
            names: [],
            objects: []
        };
    }

    return newStep;
}

function convertLesson(lessonData) {
    const code = lessonData.content.code;
    const lineStates = analyzePythonCode(code);

    const newSteps = lessonData.content.steps.map(step =>
        convertStep(step, lineStates, code)
    );

    return {
        lessonId: lessonData.lessonId,
        title: lessonData.title,
        concept: lessonData.concept,
        content: {
            code: lessonData.content.code,
            steps: newSteps
        },
        quiz: lessonData.quiz,
        misconceptions: lessonData.misconceptions,
        keyTakeaway: lessonData.keyTakeaway
    };
}

async function main() {
    const files = fs.readdirSync(LESSONS_DIR)
        .filter(f => f.startsWith('py-practical-') && f.endsWith('.json'));

    console.log(`📂 변환할 파일: ${files.length}개\n`);

    for (const file of files) {
        const filePath = path.join(LESSONS_DIR, file);
        console.log(`🔄 변환 중: ${file}`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lessonData = JSON.parse(content);

            const converted = convertLesson(lessonData);

            // 출력 통계
            const outputSteps = converted.content.steps.filter(s =>
                s.pythonMemoryState?.output?.length > 0
            ).length;

            fs.writeFileSync(filePath, JSON.stringify(converted, null, 2) + '\n');
            console.log(`   ✅ 변환 완료 (output이 있는 스텝: ${outputSteps}개)\n`);
        } catch (error) {
            console.error(`   ❌ 오류: ${error.message}\n`);
        }
    }

    console.log('🎉 모든 파일 변환 완료!');
}

main().catch(console.error);
