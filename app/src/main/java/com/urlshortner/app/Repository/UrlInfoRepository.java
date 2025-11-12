package com.urlshortner.app.Repository;

import com.urlshortner.app.Models.UrlInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UrlInfoRepository extends JpaRepository<UrlInfo, Long> {
    UrlInfo findByShortUrl(String shortUrl);
    UrlInfo findByLongUrl(String longUrl);
}
