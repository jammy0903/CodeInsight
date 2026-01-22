package com.vis;

import java.util.*;

public class JsonWriter {
    // 라이브러리 없이 직접 Map을 JSON 문자열로 변환합니다.
    public void print(Map<String, Object> snapshot) {
        System.out.println(toJson(snapshot));
    }

    private String toJson(Object value) {
        if (value == null) return "null";
        if (value instanceof String) return "\"" + escape((String)value) + "\"";
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        
        if (value instanceof Map) {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            Map<?, ?> map = (Map<?, ?>) value;
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) sb.append(",");
                sb.append(toJson(entry.getKey())).append(":").append(toJson(entry.getValue()));
                first = false;
            }
            sb.append("}");
            return sb.toString();
        }
        
        if (value instanceof List) {
            StringBuilder sb = new StringBuilder();
            sb.append("[");
            List<?> list = (List<?>) value;
            boolean first = true;
            for (Object o : list) {
                if (!first) sb.append(",");
                sb.append(toJson(o));
                first = false;
            }
            sb.append("]");
            return sb.toString();
        }
        
        return "\"" + escape(value.toString()) + "\"";
    }

    // 문자열 내의 특수문자 처리
    private String escape(String s) {
        // Replace single backslash with double backslash for JSON
        s = s.replace("\\", "\\\\");
        // Replace double quote with escaped double quote for JSON
        s = s.replace("\"", "\\\"");
        // Replace newlines, carriage returns, and tabs with their escaped versions
        s = s.replace("\n", "\\n");
        s = s.replace("\r", "\\r");
        s = s.replace("\t", "\\t");
        return s;
    }
}
