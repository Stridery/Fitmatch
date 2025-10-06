package com.fitmatch.courseservice.repository;

import com.fitmatch.courseservice.dto.CourseSearchRequest;
import com.fitmatch.courseservice.entity.CourseSearchView;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.List;
import java.util.UUID;

import static com.fitmatch.courseservice.repository.PgArrayUtils.*;

@Repository
public class CourseSearchRepository {
    
    private final NamedParameterJdbcTemplate jdbcTemplate;
    
    private static Long uuidToLong(String uuid) {
        if (uuid == null) return null;
        return UUID.fromString(uuid).getMostSignificantBits();
    }
    
    private static final RowMapper<CourseSearchView> COURSE_MAPPER = new RowMapper<>() {
        @Override
        public CourseSearchView mapRow(ResultSet rs, int rowNum) throws SQLException {
            CourseSearchView view = new CourseSearchView();
            
            // 基本信息
            view.setCourseId(uuidToLong(rs.getString("course_id")));
            view.setCourseTitle(rs.getString("course_title"));
            view.setCourseDesc(rs.getString("course_desc"));
            
            // 运动相关
            view.setSportId(uuidToLong(rs.getString("sport_id")));
            view.setSportName(rs.getString("sport_name"));
            
            // 教练相关
            view.setCoachId(uuidToLong(rs.getString("coach_id")));
            view.setCoachName(rs.getString("coach_name"));
            view.setCoachGender(rs.getString("coach_gender"));
            view.setCity(rs.getString("city"));
            view.setCountry(rs.getString("country"));
            Object coachAge = rs.getObject("coach_age");
            view.setCoachAge(coachAge == null ? null : ((Number)coachAge).intValue());
            
            // 教练资质
            view.setHasCertificate(rs.getBoolean("has_certificate"));
            view.setCertificateType(rs.getString("certificate_type"));
            view.setCoachExperienceText(rs.getString("coach_experience_text"));
            Object expYears = rs.getObject("experience_years_int");
            view.setExperienceYearsInt(expYears == null ? null : ((Number)expYears).intValue());
            
            // 课程结构化信息
            view.setTrainingModes(pgTextArray(rs, "training_modes"));
            view.setAvailableTimeSlots(pgTextArray(rs, "available_time_slots"));
            view.setPreferredFrequency(rs.getString("preferred_frequency"));
            view.setTrainingGoals(pgTextArray(rs, "training_goals"));
            view.setSkillLevels(pgTextArray(rs, "skill_levels"));
            view.setAgeGroups(pgTextArray(rs, "age_groups"));
            view.setSkillLevel(rs.getString("skill_level"));
            view.setCourseExperienceBucket(rs.getString("course_experience_bucket"));
            
            // 价格信息
            view.setSinglePriceMin(rs.getBigDecimal("single_price_min"));
            view.setPricePerLessonMin(rs.getBigDecimal("price_per_lesson_min"));
            view.setPricePerHourMin(rs.getBigDecimal("price_per_hour_min"));
            view.setLessonOptions(pgIntArray(rs, "lesson_options"));
            view.setDurationOptions(pgIntArray(rs, "duration_options"));
            Object packageCount = rs.getObject("package_count");
            view.setPackageCount(packageCount == null ? null : ((Number)packageCount).intValue());
            
            // 课程属性
            view.setStyles(pgTextArray(rs, "styles"));
            view.setCommStyles(pgTextArray(rs, "comm_styles"));
            view.setPaceIntensities(pgTextArray(rs, "pace_intensities"));
            view.setPreferStudents(pgTextArray(rs, "prefer_students"));
            
            // 时间戳
            Timestamp createdAt = rs.getTimestamp("created_at");
            if (createdAt != null) {
                view.setCreatedAt(createdAt.toLocalDateTime());
            }
            Timestamp updatedAt = rs.getTimestamp("updated_at");
            if (updatedAt != null) {
                view.setUpdatedAt(updatedAt.toLocalDateTime());
            }
            
            // 匹配分数
            view.setMatchScore(rs.getDouble("match_score"));
            
            return view;
        }
    };
    
    public CourseSearchRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    private MapSqlParameterSource createParams(CourseSearchRequest request) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        
        // 基础筛选
        params.addValue("sport", request.getSport(), Types.VARCHAR);
        params.addValue("city", request.getCity(), Types.VARCHAR);
        params.addValue("coachGender", request.getCoachGender(), Types.VARCHAR);
        params.addValue("maxPrice", request.getMaxPrice(), Types.NUMERIC);
        params.addValue("minExp", request.getMinExp(), Types.INTEGER);
        params.addValue("skillLevel", request.getSkillLevel(), Types.VARCHAR);
        params.addValue("preferredFrequency", request.getPreferredFrequency(), Types.VARCHAR);
        
        // 证书相关
        params.addValue("requireCert", request.getHasCertificate(), Types.BOOLEAN);
        params.addValue("certTypes", toPgTextArray(request.getCertType()));
        
        // 数组参数
        params.addValue("trainingModes", toPgTextArray(request.getTrainingModes()));
        params.addValue("durationOptions", toPgIntArray(request.getDuration() != null ? 
            request.getDuration().stream()
                .map(d -> Integer.parseInt(d.replaceAll("[^0-9]", "")))
                .toList() : null));
        params.addValue("availableTimeSlots", toPgTextArray(request.getAvailableTimeSlots()));
        params.addValue("styles", toPgTextArray(request.getStyles()));
        params.addValue("commStyles", toPgTextArray(request.getCommStyles()));
        params.addValue("paceIntensities", toPgTextArray(request.getPaceIntensities()));
        params.addValue("goals", toPgTextArray(request.getGoals()));
        params.addValue("ageGroups", toPgTextArray(request.getAgeGroups()));
        params.addValue("preferStudents", toPgTextArray(request.getPreferStudents()));
        
        return params;
    }
    
    public List<CourseSearchView> search(CourseSearchRequest request) {
        MapSqlParameterSource params = createParams(request);
        
        CourseSearchQueryBuilder queryBuilder = new CourseSearchQueryBuilder(params)
            .withSport(request.getSport())
            .withCity(request.getCity())
            .withCoachGender(request.getCoachGender())
            .withMaxPrice(request.getMaxPrice())
            .withCertificate(request.getHasCertificate(), request.getCertType())
            .withLessons(request.getLessons())
            .withDuration(request.getDuration())
            .withTextArrayOverlap("styles", "styles", request.getStyles())
            .withTextArrayOverlap("comm_styles", "commStyles", request.getCommStyles())
            .withTextArrayOverlap("pace_intensities", "paceIntensities", request.getPaceIntensities())
            .withTextArrayOverlap("prefer_students", "preferStudents", request.getPreferStudents())
            .withTextArrayOverlap("training_modes", "trainingModes", request.getTrainingModes())
            .withTextArrayOverlap("available_time_slots", "availableTimeSlots", request.getAvailableTimeSlots())
            .withTextArrayOverlap("training_goals", "goals", request.getGoals())
            .withTextArrayOverlap("skill_levels", "skillLevels", request.getSkillLevels())
            .withTextArrayOverlap("age_groups", "ageGroups", request.getAgeGroups())
            .withPreferredFrequency(request.getPreferredFrequency())
            .withSkillLevel(request.getSkillLevel())
            .withMinExp(request.getMinExp())
            .withSort(request.getValidSort())
            .withPagination(
                (long)request.getValidPage() * request.getValidSize(),
                (long)request.getValidSize()
            );
        
        return jdbcTemplate.query(
            queryBuilder.getSql(),
            params,
            COURSE_MAPPER
        );
    }
    
    public long count(CourseSearchRequest request) {
        MapSqlParameterSource params = createParams(request);
        
        CourseSearchQueryBuilder queryBuilder = new CourseSearchQueryBuilder(params)
            .withSport(request.getSport())
            .withCity(request.getCity())
            .withCoachGender(request.getCoachGender())
            .withMaxPrice(request.getMaxPrice())
            .withCertificate(request.getHasCertificate(), request.getCertType())
            .withLessons(request.getLessons())
            .withDuration(request.getDuration())
            .withTextArrayOverlap("styles", "styles", request.getStyles())
            .withTextArrayOverlap("comm_styles", "commStyles", request.getCommStyles())
            .withTextArrayOverlap("pace_intensities", "paceIntensities", request.getPaceIntensities())
            .withTextArrayOverlap("prefer_students", "preferStudents", request.getPreferStudents())
            .withTextArrayOverlap("training_modes", "trainingModes", request.getTrainingModes())
            .withTextArrayOverlap("available_time_slots", "availableTimeSlots", request.getAvailableTimeSlots())
            .withTextArrayOverlap("training_goals", "goals", request.getGoals())
            .withTextArrayOverlap("skill_levels", "skillLevels", request.getSkillLevels())
            .withTextArrayOverlap("age_groups", "ageGroups", request.getAgeGroups())
            .withPreferredFrequency(request.getPreferredFrequency())
            .withSkillLevel(request.getSkillLevel())
            .withMinExp(request.getMinExp());
        
        return jdbcTemplate.queryForObject(
            queryBuilder.getCountSql(),
            params,
            Long.class
        );
    }
}