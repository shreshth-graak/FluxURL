package com.urlshortner.app.Models.Dto;

import java.time.LocalDate;

import org.hibernate.validator.constraints.URL;

import jakarta.validation.constraints.Future;



public class UrlUpdateDto {
    @URL
    private String longUrl;
    @Future(message = "Expiration date must be in the future")
    private LocalDate expiresAt;

    // Getters and Setters
    public String getLongUrl() {
        return longUrl;
    }

    public void setLongUrl(String longUrl) {
        this.longUrl = longUrl;
    }

    public LocalDate getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDate expiresAt) {
        this.expiresAt = expiresAt;
    }   
}
