package com.fitmatch.bookingservice.dto;

import lombok.Data;

@Data
public class BookingResponse {
    
    private String status; // "CONFIRMED" | "WAITLISTED"
    private String message;
    private String bookingId;
    
    public static BookingResponse confirmed(String bookingId) {
        BookingResponse response = new BookingResponse();
        response.setStatus("CONFIRMED");
        response.setMessage("Booking confirmed successfully");
        response.setBookingId(bookingId);
        return response;
    }
    
    public static BookingResponse waitlisted() {
        BookingResponse response = new BookingResponse();
        response.setStatus("WAITLISTED");
        response.setMessage("Session is full, you have been added to the waitlist");
        return response;
    }
}
