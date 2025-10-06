package com.fitmatch.courseservice.repository;

import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.jdbc.core.SqlTypeValue;
import java.sql.Array;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public final class PgArrayUtils {
    private PgArrayUtils() {}

    public static SqlParameterValue toPgTextArray(List<String> v) {
        return (v == null || v.isEmpty()) ? 
            new SqlParameterValue(Types.OTHER, null) : 
            new SqlParameterValue(Types.OTHER, (SqlTypeValue) (ps, i, sqlType, typeName) -> {
                Array array = ps.getConnection().createArrayOf("text", v.toArray(String[]::new));
                ps.setArray(i, array);
            });
    }

    public static SqlParameterValue toPgIntArray(List<Integer> v) {
        return (v == null || v.isEmpty()) ? 
            new SqlParameterValue(Types.OTHER, null) : 
            new SqlParameterValue(Types.OTHER, (SqlTypeValue) (ps, i, sqlType, typeName) -> {
                Array array = ps.getConnection().createArrayOf("int4", v.toArray(Integer[]::new));
                ps.setArray(i, array);
            });
    }

    public static List<String> pgTextArray(ResultSet rs, String col) throws SQLException {
        Array arr = rs.getArray(col);
        if (arr == null) return List.of();
        Object[] data = (Object[]) arr.getArray();
        List<String> out = new ArrayList<>(data.length);
        for (Object o : data) out.add((String) o);
        return out;
    }

    public static List<Integer> pgIntArray(ResultSet rs, String col) throws SQLException {
        Array arr = rs.getArray(col);
        if (arr == null) return List.of();
        Object[] data = (Object[]) arr.getArray();
        List<Integer> out = new ArrayList<>(data.length);
        for (Object o : data) out.add(((Number) o).intValue());
        return out;
    }
}