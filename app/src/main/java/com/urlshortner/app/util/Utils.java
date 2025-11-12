package com.urlshortner.app.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class Utils {
    
    public static String generateShortUrl(String longUrl) {
       try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(longUrl.getBytes(StandardCharsets.UTF_8));

            String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);

            return encoded.substring(0, encoded.length());

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }
}
