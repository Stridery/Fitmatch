package com.fitmatch.bookingservice.dto;

import java.time.Instant;

/**
 * Available Slot DTO
 * 用于表示availability的可用时段
 */
public class AvailableSlot {
    
    private Instant slotStart;
    private Instant slotEnd;
    private Long durationMinutes;
    
    // Constructors
    public AvailableSlot() {}
    
    public AvailableSlot(Instant slotStart, Instant slotEnd, Long durationMinutes) {
        this.slotStart = slotStart;
        this.slotEnd = slotEnd;
        this.durationMinutes = durationMinutes;
    }
    
    // Getters and Setters
    public Instant getSlotStart() {
        return slotStart;
    }
    
    public void setSlotStart(Instant slotStart) {
        this.slotStart = slotStart;
    }
    
    public Instant getSlotEnd() {
        return slotEnd;
    }
    
    public void setSlotEnd(Instant slotEnd) {
        this.slotEnd = slotEnd;
    }
    
    public Long getDurationMinutes() {
        return durationMinutes;
    }
    
    public void setDurationMinutes(Long durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
    
    @Override
    public String toString() {
        return "AvailableSlot{" +
                "slotStart=" + slotStart +
                ", slotEnd=" + slotEnd +
                ", durationMinutes=" + durationMinutes +
                '}';
    }
}
