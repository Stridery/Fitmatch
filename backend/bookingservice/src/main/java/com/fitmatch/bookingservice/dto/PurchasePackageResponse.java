package com.fitmatch.bookingservice.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class PurchasePackageResponse {
    private boolean success;
    private UUID userPackageId;
    private String message;
    
    public static PurchasePackageResponse success(UUID userPackageId) {
        PurchasePackageResponse response = new PurchasePackageResponse();
        response.setSuccess(true);
        response.setUserPackageId(userPackageId);
        response.setMessage("Package purchased successfully");
        return response;
    }
    
    public static PurchasePackageResponse failure(String message) {
        PurchasePackageResponse response = new PurchasePackageResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}
