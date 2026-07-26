package com.dishaspora.marketplace.controller;

import com.dishaspora.auth.entity.User;
import com.dishaspora.common.dto.PageDto;
import com.dishaspora.marketplace.dto.ListingDto;
import com.dishaspora.marketplace.dto.MarketplaceRequests.ListingRequest;
import com.dishaspora.marketplace.service.ListingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public PageDto<ListingDto> search(@RequestParam(required = false) String type,
                                      @RequestParam(required = false) String q,
                                      @RequestParam(required = false) String country,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size,
                                      @AuthenticationPrincipal User user) {
        return listingService.search(type, q, country, page, size, user);
    }

    @GetMapping("/{id}")
    public ListingDto getById(@PathVariable Long id) {
        return listingService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ListingDto> create(@Valid @RequestBody ListingRequest request,
                                             @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(listingService.create(request, user));
    }

    @PutMapping("/{id}")
    public ListingDto update(@PathVariable Long id, @Valid @RequestBody ListingRequest request,
                             @AuthenticationPrincipal User user) {
        return listingService.update(id, request, user);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        listingService.delete(id, user);
        return Map.of("deleted", true);
    }
}
