package com.urlshortner.app.Controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.beans.factory.annotation.Autowired;
import com.urlshortner.app.Repository.UrlInfoRepository;
import com.urlshortner.app.Service.UrlService;
import com.urlshortner.app.Models.Dto.UrlInfoDto;

@Controller
@RequestMapping("")
public class Index {
    private final UrlService urlservice;
    @Autowired
    public Index(UrlService urlservice) {
        this.urlservice = urlservice;
    }
    @GetMapping("/")
    public String index() {
        return "index"; 
        // This returns the name of a view (e.g., templates/index.html if using Thymeleaf) and i put index.html at src\main\resources\templates\index.html
    }

    @GetMapping("/{shortUrl}")
    public String getMethodName(@PathVariable String shortUrl) {
        if(shortUrl.length()<3 || shortUrl.length()>10){
            return "redirect:/";
        }
        UrlInfoDto urlInfoDto = urlservice.redirectByShortUrl(shortUrl);
        if(urlInfoDto==null){
            return "redirect:/";
        }
        return "redirect:" + urlInfoDto.getLongUrl();
    }
    

}
