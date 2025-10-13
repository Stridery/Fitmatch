package com.fitmatch.courseservice.repository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import static com.fitmatch.courseservice.repository.PgArrayUtils.toPgIntArray;
import static com.fitmatch.courseservice.repository.PgArrayUtils.toPgTextArray;

public class CourseSearchQueryBuilder {
    private static final Logger log = LoggerFactory.getLogger(CourseSearchQueryBuilder.class);
    
    private static final String BASE_SELECT = """
        SELECT 
            c.*,
            ROUND((
                -- 价格适配 (22分)
                CASE 
                    WHEN CAST(:maxPrice AS numeric) IS NULL OR CAST(:maxPrice AS numeric) <= 0 THEN 11.0
                    ELSE LEAST(22.0, GREATEST(0, 
                        22.0 * (1 - COALESCE(c.price_per_lesson_min, 0) 
                            / NULLIF(CAST(:maxPrice AS numeric), 0))
                    ))
                END +
                
                -- 最近更新 (6分)
                CASE 
                    WHEN c.updated_at IS NULL THEN 3.0
                    ELSE LEAST(6.0, GREATEST(0, 
                        6.0 * (1 - EXTRACT(DAY FROM NOW() - c.updated_at) / 90.0)
                    ))
                END +
                
                -- 经验 (6分)
                CASE 
                    WHEN c.experience_years_int IS NULL THEN 1.8
                    WHEN CAST(:minExp AS int) IS NULL OR CAST(:minExp AS int) <= 0 THEN 3.0
                    ELSE LEAST(6.0, 6.0 * c.experience_years_int / NULLIF(CAST(:minExp AS int), 0))
                END +
                
                -- 证书 (5分)
                CASE 
                    WHEN CAST(:requireCert AS boolean) IS NULL THEN 2.5
                    WHEN CAST(:requireCert AS boolean) = true 
                         AND c.has_certificate = true 
                         AND (CAST(:certTypes AS text[]) IS NULL 
                             OR c.certificate_type = ANY(CAST(:certTypes AS text[]))) 
                    THEN 5.0
                    ELSE 0.0
                END +
                
                -- 性别 (3分)
                CASE 
                    WHEN CAST(:coachGender AS text) IS NULL OR CAST(:coachGender AS text) = 'any' THEN 1.5
                    WHEN c.coach_gender = CAST(:coachGender AS text) THEN 3.0
                    ELSE 0.0
                END +
                
                -- 课程类型/模式 (8分)
                CASE 
                    WHEN CAST(:trainingModes AS text[]) IS NULL THEN 4.0
                    ELSE 8.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.training_modes::text[], ARRAY[]::text[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:trainingModes AS text[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:trainingModes AS text[])))
                END +
                
                -- 时长 (7分)
                CASE 
                    WHEN CAST(:durationOptions AS int[]) IS NULL THEN 3.5
                    ELSE 7.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.duration_options, ARRAY[]::int[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:durationOptions AS int[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:durationOptions AS int[])))
                END +
                
                -- 可用时段 (7分)
                CASE 
                    WHEN CAST(:availableTimeSlots AS text[]) IS NULL THEN 3.5
                    ELSE 7.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.available_time_slots::text[], ARRAY[]::text[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:availableTimeSlots AS text[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:availableTimeSlots AS text[])))
                END +
                
                -- 风格 (7分)
                CASE 
                    WHEN CAST(:styles AS text[]) IS NULL THEN 3.5
                    ELSE 7.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.styles::text[], ARRAY[]::text[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:styles AS text[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:styles AS text[])))
                END +
                
                -- 沟通 (4分)
                CASE 
                    WHEN CAST(:commStyles AS text[]) IS NULL THEN 2.0
                    ELSE 4.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.comm_styles::text[], ARRAY[]::text[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:commStyles AS text[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:commStyles AS text[])))
                END +
                
                -- 强度 (4分)
                CASE 
                    WHEN CAST(:paceIntensities AS text[]) IS NULL THEN 2.0
                    ELSE 4.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.pace_intensities::text[], ARRAY[]::text[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:paceIntensities AS text[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:paceIntensities AS text[])))
                END +
                
                -- 目标 (4分)
                CASE 
                    WHEN CAST(:goals AS text[]) IS NULL THEN 2.0
                    ELSE 4.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.training_goals::text[], ARRAY[]::text[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:goals AS text[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:goals AS text[])))
                END +
                
                -- 年龄 (4分)
                CASE 
                    WHEN CAST(:ageGroups AS text[]) IS NULL THEN 2.0
                    ELSE 4.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.age_groups::text[], ARRAY[]::text[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:ageGroups AS text[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:ageGroups AS text[])))
                END +
                
                -- 偏好学生 (2分)
                CASE 
                    WHEN CAST(:preferStudents AS text[]) IS NULL THEN 1.0
                    ELSE 2.0 * COALESCE(
                        cardinality(ARRAY(
                            SELECT UNNEST(COALESCE(c.prefer_students::text[], ARRAY[]::text[]))
                            INTERSECT
                            SELECT UNNEST(CAST(:preferStudents AS text[]))
                        )), 0
                    )::float / GREATEST(1, cardinality(CAST(:preferStudents AS text[])))
                END +
                
                -- 等级 (7分)
                CASE 
                    WHEN CAST(:skillLevel AS text) IS NULL THEN 3.5
                    WHEN LOWER(CAST(:skillLevel AS text)) = ANY(LOWER(c.skill_levels::text)::text[]) OR 
                         LOWER(c.skill_level) = LOWER(CAST(:skillLevel AS text)) THEN 7.0
                    ELSE 0.0
                END +
                
                -- 频率 (4分)
                CASE 
                    WHEN CAST(:preferredFrequency AS text) IS NULL THEN 2.0
                    WHEN c.preferred_frequency = CAST(:preferredFrequency AS text) THEN 4.0
                    ELSE 0.0
                END
            )::numeric, 1)::double precision AS match_score
        FROM public.v_course_search c
        WHERE 1=1
        """;

    private final MapSqlParameterSource params;
    private final List<String> conditions;
    private String orderByClause = " ORDER BY match_score DESC, updated_at DESC NULLS LAST";
    private String limitOffsetClause = "";

    public CourseSearchQueryBuilder(MapSqlParameterSource params) {
        this.params = params;
        this.conditions = new ArrayList<>();
        
        // 初始化标量参数的默认值和类型
        params.addValue("maxPrice", null, Types.NUMERIC);
        params.addValue("minExp", null, Types.INTEGER);
        params.addValue("requireCert", null, Types.BOOLEAN);
        params.addValue("coachGender", null, Types.VARCHAR);
        params.addValue("skillLevel", null, Types.VARCHAR);
        params.addValue("preferredFrequency", null, Types.VARCHAR);
        params.addValue("sport", null, Types.VARCHAR);
        params.addValue("city", null, Types.VARCHAR);
        params.addValue("excludeCoachId", null, Types.VARCHAR);
        params.addValue("isTest", false, Types.BOOLEAN);
        
        // 初始化数组参数的默认值
        params.addValue("trainingModes", toPgTextArray(null));
        params.addValue("durationOptions", toPgIntArray(null));
        params.addValue("availableTimeSlots", toPgTextArray(null));
        params.addValue("styles", toPgTextArray(null));
        params.addValue("commStyles", toPgTextArray(null));
        params.addValue("paceIntensities", toPgTextArray(null));
        params.addValue("goals", toPgTextArray(null));
        params.addValue("ageGroups", toPgTextArray(null));
        params.addValue("preferStudents", toPgTextArray(null));
        params.addValue("certTypes", toPgTextArray(null));
    }


    public CourseSearchQueryBuilder withExcludeCoachId(String coachId) {
        if (StringUtils.hasText(coachId)) {
            conditions.add("c.coach_id::text != CAST(:excludeCoachId AS text)");
            params.addValue("excludeCoachId", coachId, Types.VARCHAR);
        }
        return this;
    }

    public CourseSearchQueryBuilder withSport(String sport) {
        if (StringUtils.hasText(sport)) {
            conditions.add("LOWER(c.sport_name) LIKE LOWER(:sport)");
            params.addValue("sport", "%" + sport + "%", Types.VARCHAR);
        }
        return this;
    }

    public CourseSearchQueryBuilder withCity(String city) {
        if (StringUtils.hasText(city)) {
            conditions.add("LOWER(c.city) LIKE LOWER(:city)");
            params.addValue("city", "%" + city + "%", Types.VARCHAR);
        }
        return this;
    }

    public CourseSearchQueryBuilder withCoachGender(String gender) {
        if (StringUtils.hasText(gender) && !"any".equals(gender)) {
            conditions.add("c.coach_gender = CAST(:coachGender AS text)");
            params.addValue("coachGender", gender, Types.VARCHAR);
        }
        return this;
    }

    public CourseSearchQueryBuilder withMaxPrice(BigDecimal maxPrice) {
        if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0) {
            conditions.add("c.price_per_lesson_min <= CAST(:maxPrice AS numeric)");
            params.addValue("maxPrice", maxPrice, Types.NUMERIC);
        }
        return this;
    }

    public CourseSearchQueryBuilder withCertificate(Boolean hasCertificate, List<String> certTypes) {
        if (Boolean.TRUE.equals(hasCertificate)) {
            conditions.add("c.has_certificate = CAST(:requireCert AS boolean)");
            params.addValue("requireCert", true, Types.BOOLEAN);
            if (certTypes != null && !certTypes.isEmpty()) {
                conditions.add("c.certificate_type = ANY(CAST(:certTypes AS text[]))");
                params.addValue("certTypes", toPgTextArray(certTypes));
            }
        }
        return this;
    }

    public CourseSearchQueryBuilder withTextArrayOverlap(String field, String paramName, List<String> values) {
        if (values != null && !values.isEmpty()) {
            conditions.add("COALESCE(c." + field + "::text[], ARRAY[]::text[]) && CAST(:" + paramName + " AS text[])");
            params.addValue(paramName, toPgTextArray(values));
        }
        return this;
    }

    public CourseSearchQueryBuilder withIntArrayOverlap(String field, String paramName, List<Integer> values) {
        if (values != null && !values.isEmpty()) {
            conditions.add("c." + field + " && CAST(:" + paramName + " AS int[])");
            params.addValue(paramName, toPgIntArray(values));
        }
        return this;
    }

    public CourseSearchQueryBuilder withLessons(List<String> lessons) {
        if (lessons != null && !lessons.isEmpty()) {
            List<String> mappedLessons = lessons.stream()
                .map(lesson -> switch (lesson) {
                    case "1-on-1" -> "1v1";
                    case "Small Group" -> "Group";
                    default -> lesson;
                })
                .toList();
            return withTextArrayOverlap("training_modes", "trainingModes", mappedLessons);
        }
        return this;
    }

    public CourseSearchQueryBuilder withDuration(List<String> durations) {
        if (durations != null && !durations.isEmpty()) {
            List<Integer> minutes = durations.stream()
                .map(d -> Integer.parseInt(d.replaceAll("[^0-9]", "")))
                .toList();
            return withIntArrayOverlap("duration_options", "durationOptions", minutes);
        }
        return this;
    }

    public CourseSearchQueryBuilder withPreferredFrequency(String frequency) {
        if (StringUtils.hasText(frequency)) {
            String mappedFrequency = switch (frequency) {
                case "daily" -> "3+ per week";
                case "weekly" -> "1–2 per week";
                case "monthly" -> "Flexible";
                default -> frequency;
            };
            conditions.add("c.preferred_frequency = CAST(:preferredFrequency AS text)");
            params.addValue("preferredFrequency", mappedFrequency, Types.VARCHAR);
        }
        return this;
    }

    public CourseSearchQueryBuilder withSkillLevel(String skillLevel) {
        if (StringUtils.hasText(skillLevel)) {
            conditions.add("(LOWER(CAST(:skillLevel AS text)) = ANY(LOWER(c.skill_levels::text)::text[]) OR LOWER(c.skill_level) = LOWER(CAST(:skillLevel AS text)))");
            params.addValue("skillLevel", skillLevel, Types.VARCHAR);
        }
        return this;
    }

    public CourseSearchQueryBuilder withMinExp(Integer minExp) {
        if (minExp != null && minExp > 0) {
            conditions.add("c.experience_years_int >= CAST(:minExp AS int)");
            params.addValue("minExp", minExp, Types.INTEGER);
        }
        return this;
    }

    public CourseSearchQueryBuilder withSort(String sort) {
        this.orderByClause = switch (sort) {
            case "price_asc" -> " ORDER BY c.price_per_lesson_min ASC NULLS LAST";
            case "price_desc" -> " ORDER BY c.price_per_lesson_min DESC NULLS LAST";
            case "updated_desc" -> " ORDER BY c.updated_at DESC NULLS LAST";
            default -> " ORDER BY match_score DESC, c.updated_at DESC NULLS LAST";
        };
        return this;
    }

    public CourseSearchQueryBuilder withPagination(long offset, long limit) {
        this.limitOffsetClause = " LIMIT :limit OFFSET :offset";
        params.addValue("limit", limit, Types.BIGINT);
        params.addValue("offset", offset, Types.BIGINT);
        return this;
    }

    public String getSql() {
        StringBuilder finalSql = new StringBuilder(BASE_SELECT);
        if (!conditions.isEmpty()) {
            finalSql.append(" AND ").append(String.join(" AND ", conditions));
        }
        finalSql.append(orderByClause).append(limitOffsetClause);
        
        log.debug("Generated SQL: {}", finalSql);
        log.debug("Parameters: {}", params.getValues());
        
        return finalSql.toString();
    }

    public MapSqlParameterSource getParams() {
        return params;
    }

    public String getCountSql() {
        StringBuilder countSql = new StringBuilder("SELECT COUNT(*) FROM public.v_course_search c WHERE 1=1");
        if (!conditions.isEmpty()) {
            countSql.append(" AND ").append(String.join(" AND ", conditions));
        }
        return countSql.toString();
    }
}