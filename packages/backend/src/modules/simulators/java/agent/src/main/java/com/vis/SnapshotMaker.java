package com.vis;

import com.sun.jdi.*;
import java.util.*;

public class SnapshotMaker {

    public Map<String, Object> capture(ThreadReference thread, int lineNumber) throws IncompatibleThreadStateException {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("line", lineNumber);
        snapshot.put("event", "STEP");

        // 1. Call Stack 추출
        List<Map<String, Object>> stackFrames = new ArrayList<>();
        for (StackFrame frame : thread.frames()) {
            Map<String, Object> frameData = new HashMap<>();
            frameData.put("methodName", frame.location().method().name());
            frameData.put("className", frame.location().declaringType().name());
            
            try {
                // 현재 스코프에서 보이는 변수들 추출
                Map<String, Object> variables = new HashMap<>();
                Map<LocalVariable, Value> visibleVariables = frame.getValues(frame.visibleVariables());
                
                for (Map.Entry<LocalVariable, Value> entry : visibleVariables.entrySet()) {
                    variables.put(entry.getKey().name(), parseValue(entry.getValue()));
                }
                frameData.put("variables", variables);
            } catch (AbsentInformationException e) {
                frameData.put("variables", Collections.emptyMap());
            }

            stackFrames.add(frameData);
        }
        snapshot.put("stack", stackFrames);

        // 2. Heap (간단히 구현, 추후 참조 추적 로직 강화 가능)
        // 현재는 변수 값 자체에 참조 ID를 포함시키는 방식으로 처리
        return snapshot;
    }

    private Object parseValue(Value value) {
        if (value == null) return null;

        if (value instanceof PrimitiveValue) {
            // int, boolean, double 등
            if (value instanceof IntegerValue) return ((IntegerValue) value).value();
            if (value instanceof BooleanValue) return ((BooleanValue) value).value();
            if (value instanceof DoubleValue) return ((DoubleValue) value).value();
            if (value instanceof FloatValue) return ((FloatValue) value).value();
            if (value instanceof LongValue) return ((LongValue) value).value();
            if (value instanceof ShortValue) return ((ShortValue) value).value();
            if (value instanceof ByteValue) return ((ByteValue) value).value();
            if (value instanceof CharValue) return ((CharValue) value).value();
            return value.toString();
        } else if (value instanceof StringReference) {
            // String은 특별하게 값 바로 표시
            return ((StringReference) value).value();
        } else if (value instanceof ObjectReference) {
            // 객체는 참조 ID와 타입 반환 (Heap 시각화의 핵심)
            ObjectReference ref = (ObjectReference) value;
            Map<String, Object> refData = new HashMap<>();
            refData.put("type", "Reference");
            refData.put("id", ref.uniqueID());
            refData.put("class", ref.referenceType().name());
            return refData;
        } else if (value instanceof ArrayReference) {
            ArrayReference arrayRef = (ArrayReference) value;
            Map<String, Object> arrayData = new HashMap<>();
            arrayData.put("type", "Array");
            arrayData.put("id", arrayRef.uniqueID());
            arrayData.put("class", arrayRef.referenceType().name());
            arrayData.put("length", arrayRef.length());
            // Optionally, fetch array elements here, but for a high-level snapshot, ID might be enough
            return arrayData;
        }
        return value.toString();
    }
}
