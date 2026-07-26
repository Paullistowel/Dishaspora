package com.dishaspora.marketplace.service;

import com.dishaspora.admin.service.AutoFlagService;
import com.dishaspora.auth.entity.User;
import com.dishaspora.common.dto.PageDto;
import com.dishaspora.common.enums.Enums.ApprovalStatus;
import com.dishaspora.common.enums.Enums.ListingType;
import com.dishaspora.common.enums.Enums.Role;
import com.dishaspora.common.exception.ApiException;
import com.dishaspora.common.exception.NotFoundException;
import com.dishaspora.common.util.CountryUtil;
import com.dishaspora.marketplace.dto.ListingDto;
import com.dishaspora.marketplace.dto.MarketplaceRequests.ListingRequest;
import com.dishaspora.marketplace.entity.Listing;
import com.dishaspora.marketplace.entity.Vendor;
import com.dishaspora.marketplace.repository.ListingRepository;
import com.dishaspora.marketplace.repository.VendorRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final VendorRepository vendorRepository;
    private final AutoFlagService autoFlagService;

    public ListingService(ListingRepository listingRepository,
                          VendorRepository vendorRepository,
                          AutoFlagService autoFlagService) {
        this.listingRepository = listingRepository;
        this.vendorRepository = vendorRepository;
        this.autoFlagService = autoFlagService;
    }

    public PageDto<ListingDto> search(String type, String q, String countryParam, int page, int size, User user) {
        // Server forces country = caller's country when authenticated, else uses the param.
        String country = user != null ? user.getCountry() : countryParam;

        Specification<Listing> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), ApprovalStatus.APPROVED));
            if (type != null && !type.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("type"), ListingType.valueOf(type.toUpperCase())));
                } catch (IllegalArgumentException e) {
                    throw ApiException.badRequest("Invalid listing type: " + type);
                }
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like)));
            }
            if (country != null && !country.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("country")), country.toLowerCase()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Listing> result = listingRepository.findAll(spec,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.DESC, "createdAt")));

        // Only listings from APPROVED vendors are shown publicly.
        List<ListingDto> content = result.getContent().stream()
                .map(l -> {
                    Vendor vendor = vendorRepository.findById(l.getVendorId()).orElse(null);
                    if (vendor == null || vendor.getStatus() != ApprovalStatus.APPROVED) return null;
                    return ListingDto.from(l, vendor);
                })
                .filter(Objects::nonNull)
                .toList();
        return new PageDto<>(content, result.getTotalElements(), result.getTotalPages());
    }

    public ListingDto getById(Long id) {
        Listing listing = find(id);
        Vendor vendor = vendorRepository.findById(listing.getVendorId())
                .orElseThrow(() -> new NotFoundException("Vendor not found"));
        return ListingDto.from(listing, vendor);
    }

    public List<ListingDto> vendorListings(Long vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new NotFoundException("Vendor not found"));
        return listingRepository.findByVendorIdAndStatus(vendorId, ApprovalStatus.APPROVED).stream()
                .map(l -> ListingDto.from(l, vendor))
                .toList();
    }

    @Transactional
    public ListingDto create(ListingRequest request, User user) {
        Vendor vendor = requireApprovedVendor(user);
        Listing listing = new Listing();
        applyRequest(listing, request);
        listing.setVendorId(vendor.getId());
        listing.setCountry(vendor.getCountry());
        listing.setCurrency(CountryUtil.currencyFor(vendor.getCountry()));
        listing.setStatus(ApprovalStatus.PENDING);
        listing = listingRepository.save(listing);
        autoFlagService.checkListing(listing, vendor);
        return ListingDto.from(listing, vendor);
    }

    @Transactional
    public ListingDto update(Long id, ListingRequest request, User user) {
        Listing listing = find(id);
        Vendor vendor = requireOwnership(listing, user);
        applyRequest(listing, request);
        listing.setStatus(ApprovalStatus.PENDING);
        listing.setRejectionFeedback(null);
        return ListingDto.from(listingRepository.save(listing), vendor);
    }

    @Transactional
    public void delete(Long id, User user) {
        Listing listing = find(id);
        requireOwnership(listing, user);
        listingRepository.delete(listing);
    }

    public Listing find(Long id) {
        return listingRepository.findById(id).orElseThrow(() -> new NotFoundException("Listing not found"));
    }

    private Vendor requireApprovedVendor(User user) {
        Vendor vendor = vendorRepository.findByOwnerUserId(user.getId())
                .orElseThrow(() -> ApiException.forbidden("You need a vendor profile to do this"));
        if (vendor.getStatus() != ApprovalStatus.APPROVED) {
            throw ApiException.forbidden("Your vendor profile is not approved yet");
        }
        return vendor;
    }

    private Vendor requireOwnership(Listing listing, User user) {
        Vendor vendor = vendorRepository.findById(listing.getVendorId()).orElse(null);
        if (user.getRole() == Role.ADMIN) return vendor;
        if (vendor == null || !Objects.equals(vendor.getOwnerUserId(), user.getId())) {
            throw ApiException.forbidden("You can only manage your own listings");
        }
        return vendor;
    }

    private void applyRequest(Listing listing, ListingRequest request) {
        listing.setType(ListingType.valueOf(request.type()));
        listing.setTitle(request.title());
        listing.setDescription(request.description());
        listing.setImageUrl(request.imageUrl());
        listing.setAmountMinor(request.amountMinor());
        listing.setCompareAtMinor(request.compareAtMinor());
        listing.setAvailable(request.available() == null || request.available());
        listing.setStockQty(request.stockQty() == null ? 0 : request.stockQty());
        listing.setQuantity(request.quantity());
        listing.setUnit(request.unit());
        listing.setPrepMinutes(request.prepMinutes());
        listing.setLinkedRecipeId(request.linkedRecipeId());
    }
}
