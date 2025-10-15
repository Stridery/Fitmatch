package com.fitmatch.bookingservice.dto;

import lombok.Data;

@Data
public class CancelBookingResponse {
    
    private String result; // "CANCELLED" | "PROMOTED:<student_id>" | "NOOP"
    private String message;
    private String promotedStudentId;
    
    public static CancelBookingResponse cancelled() {
        CancelBookingResponse response = new CancelBookingResponse();
        response.setResult("CANCELLED");
        response.setMessage("Booking cancelled successfully");
        return response;
    }
    
    public static CancelBookingResponse promoted(String studentId) {
        CancelBookingResponse response = new CancelBookingResponse();
        response.setResult("PROMOTED:" + studentId);
        response.setMessage("Booking cancelled and student promoted from waitlist");
        response.setPromotedStudentId(studentId);
        return response;
    }
    
    public static CancelBookingResponse noop() {
        CancelBookingResponse response = new CancelBookingResponse();
        response.setResult("NOOP");
        response.setMessage("No confirmed booking found to cancel");
        return response;
    }
}
