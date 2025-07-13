package com.fitmatch.userservice.converter;



import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.postgresql.util.PGobject;

import java.util.HashMap;
import java.util.Map;

@Converter(autoApply = false)
public class JsonConverter implements AttributeConverter<Map<String, Object>, PGobject> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public PGobject convertToDatabaseColumn(Map<String, Object> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }

        try {
            PGobject pgObject = new PGobject();
            pgObject.setType("jsonb"); // 👈 告诉 Postgres 这是 jsonb
            pgObject.setValue(objectMapper.writeValueAsString(attribute));
            return pgObject;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to convert Map to PGobject", e);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(PGobject dbData) {
        if (dbData == null || dbData.getValue() == null) {
            return new HashMap<>();
        }

        try {
            return objectMapper.readValue(dbData.getValue(), Map.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to convert PGobject to Map", e);
        }
    }
}