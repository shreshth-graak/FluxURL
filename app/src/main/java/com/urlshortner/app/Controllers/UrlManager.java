package com.urlshortner.app.Controllers;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.fasterxml.jackson.databind.JsonNode;
import com.urlshortner.app.Models.Dto.UrlCreateDto;
import com.urlshortner.app.Models.Dto.UrlInfoDto;
import com.urlshortner.app.Models.Dto.UrlUpdateDto;
import com.urlshortner.app.Service.UrlService;

@RestController
@RequestMapping("/api/urls")
public class UrlManager {
    
    private final UrlService urlservice;
    private final String baseurl;

    @Autowired
    public UrlManager(UrlService urlservice, @Value("${app.shortener.base-url}") String baseurl) {
        this.urlservice = urlservice;
        this.baseurl = baseurl;
    }

    @PostMapping("/shorten")
    public ResponseEntity<Map<String, String>> shortenUrl(@Valid @RequestBody UrlCreateDto urlCreateDto) {
        String shortUrl = urlservice.createShortUrl(urlCreateDto);
        Map<String, String> response = new HashMap<>();
        response.put("shortUrl", shortUrl);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/{shortUrl}")
    public ResponseEntity<String> getLongUrl(@PathVariable String shortUrl) {
        if (shortUrl == null || shortUrl.length() < 3 || shortUrl.length() > 10) {
            return ResponseEntity.badRequest().build();
        }
        shortUrl = shortUrl.trim();
        UrlInfoDto urlInfoDto = urlservice.getUrlInfoByShortUrl(shortUrl);
        if (urlInfoDto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(urlInfoDto.getLongUrl());
    } 
    

    @DeleteMapping("/{shortUrl}")
    public ResponseEntity<String> deleteUrl(@PathVariable String shortUrl) {
        if (shortUrl == null || shortUrl.length() < 3 || shortUrl.length() > 10) {
            return ResponseEntity.badRequest().build();
        }
        shortUrl = shortUrl.trim();
        String result = urlservice.deleteByShortUrl(shortUrl);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{shortUrl}")
    public ResponseEntity<UrlInfoDto> updateUrl(@Valid @RequestBody UrlUpdateDto urlUpdateDto, @PathVariable String shortUrl) {
        if (shortUrl == null || shortUrl.length() < 3 || shortUrl.length() > 10) {
            return ResponseEntity.badRequest().build();
        }
        shortUrl = shortUrl.trim();
        if(urlUpdateDto.getExpiresAt() ==null && (urlUpdateDto.getLongUrl() ==null || urlUpdateDto.getLongUrl().isBlank() || urlUpdateDto.getLongUrl().startsWith(baseurl))){
            return ResponseEntity.badRequest().build();
        }
        if((urlUpdateDto.getExpiresAt() !=null && !urlUpdateDto.getExpiresAt().isAfter(LocalDate.now()))|| (urlUpdateDto.getLongUrl() !=null && (urlUpdateDto.getLongUrl().isBlank() || urlUpdateDto.getLongUrl().startsWith(baseurl)))){
            return ResponseEntity.badRequest().build();
        }
        UrlInfoDto updatedUrlInfo = urlservice.updateUrlByShorturl(shortUrl, urlUpdateDto);
        if (updatedUrlInfo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedUrlInfo);
    }

    @GetMapping("/info/{Url}")
    public ResponseEntity<UrlInfoDto> getUrlInfo(@PathVariable String Url) {
        if (Url == null || Url.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Url = Url.trim();
        UrlInfoDto urlInfoDto = urlservice.getUrlInfo(Url);
        if (urlInfoDto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(urlInfoDto);
    }
    

}
