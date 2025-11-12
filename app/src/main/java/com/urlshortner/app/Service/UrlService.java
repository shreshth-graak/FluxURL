package com.urlshortner.app.Service;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.urlshortner.app.Models.Dto.UrlCreateDto;
import com.urlshortner.app.Models.Dto.UrlInfoDto;
import com.urlshortner.app.Models.Dto.UrlUpdateDto;
import com.urlshortner.app.Repository.UrlInfoRepository;
import com.urlshortner.app.Models.UrlInfo;
import com.urlshortner.app.util.Utils;



@Service
public class UrlService {
    private final UrlInfoRepository urlInfoRepository;
    private final String baseurl;

    @Autowired
    public UrlService(UrlInfoRepository urlInfoRepository, @Value("${app.shortener.base-url}") String baseUrl) {
        this.urlInfoRepository = urlInfoRepository;
        this.baseurl = baseUrl;
    }

    private UrlInfoDto mapToDto(UrlInfo entity) {
        UrlInfoDto dto = new UrlInfoDto();
        dto.setLongUrl(entity.getLongUrl());
        dto.setShortUrl(baseurl +entity.getShortUrl());
        dto.setExpiresAt(entity.getExpiredAt());
        dto.setClickCount(entity.getClickCount());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        String status = (entity.getExpiredAt() != null && !entity.getExpiredAt().isAfter(LocalDate.now()))
                ? "expired" : "active";
        dto.setStatus(status);

        return dto;
    }


    public String createShortUrl(UrlCreateDto urlCreateDto){
        try {
            if (urlCreateDto.getLongUrl().startsWith(baseurl)) {
                throw new RuntimeException("Long URL cannot be a shortened URL, please change the domain");
            }
            String customAlias = urlCreateDto.getCustomAlias();
            String shortUrl ="";
            if (customAlias != null && !customAlias.trim().isEmpty()) {
                if(urlInfoRepository.findByShortUrl(customAlias) != null) {
                    throw new RuntimeException("Custom alias already in use");
                }
                shortUrl = customAlias.trim();
            }else{
                shortUrl = Utils.generateShortUrl(urlCreateDto.getLongUrl());
            }
            LocalDate expiresAt = urlCreateDto.getExpiresAt();
            if (expiresAt == null || !expiresAt.isAfter(LocalDate.now())) {
                expiresAt = LocalDate.now().plusDays(15);
            }

            UrlInfo urlInfo = new UrlInfo();
            urlInfo.setLongUrl(urlCreateDto.getLongUrl());
            urlInfo.setExpiredAt(expiresAt);
            urlInfo.setClickCount(0L);
            urlInfo.setShortUrl(shortUrl);
            
            urlInfoRepository.save(urlInfo);
            return baseurl + shortUrl;
        } catch (Exception e) {
            throw new RuntimeException("Error creating short URL", e);
        }
    }

    public UrlInfoDto getUrlInfo(String Url) {
        try{
            if(Url == null || Url.isEmpty()) {
                throw new RuntimeException("Short URL is Invalid");
            }
            UrlInfo urlInfo;
            if (Url.startsWith(baseurl)) {
                Url = Url.substring(baseurl.length());
                urlInfo = urlInfoRepository.findByShortUrl(Url);
            }else{
                urlInfo = urlInfoRepository.findByLongUrl(Url);
            }
            
            if(urlInfo == null) {
                return null;
            }
            UrlInfoDto urlInfoDto = mapToDto(urlInfo);
            return urlInfoDto;
        } catch(Exception e) {
            throw new RuntimeException("Error retrieving URL info", e);
        }
    }
    
    public UrlInfoDto getUrlInfoByShortUrl(String shortUrl) {
        try{
            if(shortUrl == null || shortUrl.isEmpty()) {
                throw new RuntimeException("Short URL is Invalid");
            }
            UrlInfo urlInfo;
            if (shortUrl.startsWith(baseurl)) {
                shortUrl = shortUrl.substring(baseurl.length());
                urlInfo = urlInfoRepository.findByShortUrl(shortUrl);
            }else{
                urlInfo = urlInfoRepository.findByShortUrl(shortUrl);
            }
            if(urlInfo == null) {
                return null;
            }
            UrlInfoDto urlInfoDto = mapToDto(urlInfo);
            return urlInfoDto;
        } catch(Exception e) {
            throw new RuntimeException("Error retrieving URL info", e);
        }
    }
    public UrlInfoDto redirectByShortUrl(String shortUrlCode) {
        try{
            if(shortUrlCode == null || shortUrlCode.isEmpty()) {
                throw new RuntimeException("Short URL is Invalid");
            }
            UrlInfo urlInfo = urlInfoRepository.findByShortUrl(shortUrlCode);
            if(urlInfo == null) {
                return null;
            }
            LocalDate today = LocalDate.now();
            if(!urlInfo.getExpiredAt().isAfter(today)) {
                throw new RuntimeException("Short URL has expired");
            }
            urlInfo.setClickCount(urlInfo.getClickCount() + 1);
            urlInfoRepository.save(urlInfo);

            UrlInfoDto urlInfoDto = mapToDto(urlInfo);
            return urlInfoDto;
        } catch(Exception e) {
            throw new RuntimeException("Error retrieving URL info", e);
        }
    }   

    public String deleteByShortUrl(String shortUrl) {
        try{
            if(shortUrl == null || shortUrl.isEmpty()) {
                throw new RuntimeException("Short URL is Invalid");
            }
            UrlInfo urlInfo;
            if (shortUrl.startsWith(baseurl)) {
                shortUrl = shortUrl.substring(baseurl.length());
                urlInfo = urlInfoRepository.findByShortUrl(shortUrl);
            }else{
                urlInfo = urlInfoRepository.findByShortUrl(shortUrl);
            }
            if(urlInfo == null) {
                return "not-found";
            }
            urlInfoRepository.delete(urlInfo);
            return "deleted";
        } catch(Exception e) {
            throw new RuntimeException("Error deleting URL", e);
        }
    }
    public UrlInfoDto updateUrlByShorturl(String shortUrl, UrlUpdateDto urlUpdateDto){
        try{
            if(shortUrl == null || shortUrl.isEmpty()) {
                throw new RuntimeException("Short URL is Invalid");
            }
            shortUrl = shortUrl.trim();
            UrlInfo urlInfo;
            if (shortUrl.startsWith(baseurl)) {
                shortUrl = shortUrl.substring(baseurl.length());
                urlInfo = urlInfoRepository.findByShortUrl(shortUrl);
            }else{
                urlInfo = urlInfoRepository.findByShortUrl(shortUrl);
            }
            if(urlInfo == null) {
                return null;
            }
            if(urlUpdateDto.getLongUrl() != null) {
                if(urlUpdateDto.getLongUrl().startsWith(baseurl)) {
                    throw new RuntimeException("Long URL cannot be a shortened URL, please change the domain");
                }
                urlInfo.setLongUrl(urlUpdateDto.getLongUrl());
            }
            if(urlUpdateDto.getExpiresAt() != null){
                if(!urlUpdateDto.getExpiresAt().isAfter(LocalDate.now())) {
                    throw new RuntimeException("Expiration date must be in the future");
                }
                urlInfo.setExpiredAt(urlUpdateDto.getExpiresAt());
            }
            urlInfoRepository.save(urlInfo);
            return mapToDto(urlInfo);
        } catch(Exception e) {
            throw new RuntimeException("Error updating URL", e);
        }
    }
}
