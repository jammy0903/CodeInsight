package com.vis;

import com.sun.jdi.*;
import java.util.*;

public class SnapshotMaker {

    // 힙 객체를 추적하기 위한 Set (중복 방지)
    private Set<Long> collectedObjectIds;
    private List<Map<String, Object>> heapObjects;

    public Map<String, Object> capture(ThreadReference thread, int lineNumber) throws IncompatibleThreadStateException {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("line", lineNumber);
        snapshot.put("event", "STEP");

        // 힙 객체 추적 초기화
        collectedObjectIds = new HashSet<>();
        heapObjects = new ArrayList<>();

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
                    variables.put(entry.getKey().name(), parseValue(entry.getValue(), true));
                }
                frameData.put("variables", variables);
            } catch (AbsentInformationException e) {
                frameData.put("variables", Collections.emptyMap());
            }

            stackFrames.add(frameData);
        }
        snapshot.put("stack", stackFrames);

        // 2. Heap 객체들 추가
        snapshot.put("heap", heapObjects);

        return snapshot;
    }

    /**
     * 값을 파싱하고, 참조 타입이면 힙에 추가
     * @param value JDI Value
     * @param collectHeap true면 힙 객체도 수집
     */
    private Object parseValue(Value value, boolean collectHeap) {
        if (value == null) return null;

        if (value instanceof PrimitiveValue) {
            // int, boolean, double 등 - 주소 없이 값만
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
            // String은 힙 객체로 추가
            StringReference strRef = (StringReference) value;
            String address = toHexAddress(strRef.uniqueID());

            if (collectHeap && !collectedObjectIds.contains(strRef.uniqueID())) {
                collectedObjectIds.add(strRef.uniqueID());
                Map<String, Object> heapObj = new HashMap<>();
                heapObj.put("address", address);
                heapObj.put("type", "String");
                heapObj.put("content", "\"" + strRef.value() + "\"");
                heapObjects.add(heapObj);
            }

            // 스택에는 참조 표시
            Map<String, Object> refData = new HashMap<>();
            refData.put("type", "Reference");
            refData.put("id", address);
            refData.put("class", "String");
            refData.put("displayValue", strRef.value()); // 표시용 값
            return refData;
        } else if (value instanceof ArrayReference) {
            ArrayReference arrayRef = (ArrayReference) value;
            String address = toHexAddress(arrayRef.uniqueID());

            if (collectHeap && !collectedObjectIds.contains(arrayRef.uniqueID())) {
                collectedObjectIds.add(arrayRef.uniqueID());
                Map<String, Object> heapObj = new HashMap<>();
                heapObj.put("address", address);
                heapObj.put("type", arrayRef.referenceType().name());
                heapObj.put("content", formatArrayContent(arrayRef));
                heapObj.put("length", arrayRef.length());
                heapObjects.add(heapObj);
            }

            Map<String, Object> arrayData = new HashMap<>();
            arrayData.put("type", "Array");
            arrayData.put("id", address);
            arrayData.put("class", arrayRef.referenceType().name());
            arrayData.put("length", arrayRef.length());
            return arrayData;
        } else if (value instanceof ObjectReference) {
            ObjectReference ref = (ObjectReference) value;
            String address = toHexAddress(ref.uniqueID());

            if (collectHeap && !collectedObjectIds.contains(ref.uniqueID())) {
                collectedObjectIds.add(ref.uniqueID());
                Map<String, Object> heapObj = new HashMap<>();
                heapObj.put("address", address);
                heapObj.put("type", ref.referenceType().name());
                heapObj.put("content", formatObjectContent(ref));
                heapObjects.add(heapObj);
            }

            Map<String, Object> refData = new HashMap<>();
            refData.put("type", "Reference");
            refData.put("id", address);
            refData.put("class", ref.referenceType().name());
            return refData;
        }
        return value.toString();
    }

    /**
     * 객체 ID를 16진수 주소로 변환
     */
    private String toHexAddress(long id) {
        return String.format("0x%03X", id);
    }

    /**
     * 배열 내용을 문자열로 포맷
     */
    private String formatArrayContent(ArrayReference arrayRef) {
        try {
            List<Value> values = arrayRef.getValues();
            if (values.isEmpty()) return "[]";

            StringBuilder sb = new StringBuilder("[");
            int limit = Math.min(values.size(), 5); // 최대 5개만 표시
            for (int i = 0; i < limit; i++) {
                if (i > 0) sb.append(", ");
                Value v = values.get(i);
                if (v == null) {
                    sb.append("null");
                } else if (v instanceof StringReference) {
                    sb.append("\"").append(((StringReference) v).value()).append("\"");
                } else if (v instanceof PrimitiveValue) {
                    sb.append(v.toString());
                } else {
                    sb.append("@").append(toHexAddress(((ObjectReference) v).uniqueID()));
                }
            }
            if (values.size() > limit) {
                sb.append(", ...");
            }
            sb.append("]");
            return sb.toString();
        } catch (Exception e) {
            return "[...]";
        }
    }

    /**
     * 객체 필드를 문자열로 포맷
     */
    private String formatObjectContent(ObjectReference ref) {
        try {
            ReferenceType type = ref.referenceType();
            List<Field> fields = type.visibleFields();

            if (fields.isEmpty()) {
                return type.name() + "{}";
            }

            StringBuilder sb = new StringBuilder(type.name());
            sb.append("{");

            int count = 0;
            int limit = 3; // 최대 3개 필드만 표시
            for (Field field : fields) {
                if (field.isStatic()) continue; // static 필드 제외
                if (count > 0) sb.append(", ");
                if (count >= limit) {
                    sb.append("...");
                    break;
                }

                Value fieldValue = ref.getValue(field);
                sb.append(field.name()).append("=");

                if (fieldValue == null) {
                    sb.append("null");
                } else if (fieldValue instanceof StringReference) {
                    String str = ((StringReference) fieldValue).value();
                    if (str.length() > 10) str = str.substring(0, 10) + "...";
                    sb.append("\"").append(str).append("\"");
                } else if (fieldValue instanceof PrimitiveValue) {
                    sb.append(fieldValue.toString());
                } else {
                    sb.append("@").append(toHexAddress(((ObjectReference) fieldValue).uniqueID()));
                }
                count++;
            }
            sb.append("}");
            return sb.toString();
        } catch (Exception e) {
            return ref.referenceType().name() + "{...}";
        }
    }
}
