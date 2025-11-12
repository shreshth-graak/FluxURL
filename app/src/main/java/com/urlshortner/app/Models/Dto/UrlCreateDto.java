package com.urlshortner.app.Models.Dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

import org.hibernate.validator.constraints.URL;

public class UrlCreateDto {
    @URL
    @NotBlank(message = "Long URL cannot be blank")
    @NotNull(message = "Long URL cannot be null")
    private String longUrl;
    @Future(message = "Expiration date must be in the future")
    private LocalDate expiresAt;
    @Size(min = 3, max = 10, message = "Custom alias must be between 3 and 10 characters")
    private String customAlias;

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
    public String getCustomAlias() {
        return customAlias;
    }
    public void setCustomAlias(String customAlias) {
        this.customAlias = customAlias;
    }
}
