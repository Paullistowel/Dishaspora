package com.dishaspora.order.service;

import com.dishaspora.auth.entity.User;
import com.dishaspora.common.dto.PaystackInitDto;
import com.dishaspora.common.enums.Enums.OrderStatus;
import com.dishaspora.common.enums.Enums.Role;
import com.dishaspora.common.exception.ApiException;
import com.dishaspora.common.exception.NotFoundException;
import com.dishaspora.common.paystack.PaystackClient;
import com.dishaspora.common.util.CountryUtil;
import com.dishaspora.marketplace.entity.Listing;
import com.dishaspora.marketplace.entity.Vendor;
import com.dishaspora.marketplace.repository.ListingRepository;
import com.dishaspora.marketplace.repository.VendorRepository;
import com.dishaspora.order.dto.OrderDtos.CheckoutResponse;
import com.dishaspora.order.dto.OrderDtos.CreateOrderItem;
import com.dishaspora.order.dto.OrderDtos.CreateOrderRequest;
import com.dishaspora.order.dto.OrderDtos.OrderDto;
import com.dishaspora.order.entity.Order;
import com.dishaspora.order.entity.OrderItem;
import com.dishaspora.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class OrderService {

    public static final long DELIVERY_MINOR = 300;
    public static final double FEE_RATE = 0.07;

    private final OrderRepository orderRepository;
    private final ListingRepository listingRepository;
    private final VendorRepository vendorRepository;
    private final PaystackClient paystackClient;

    public OrderService(OrderRepository orderRepository,
                        ListingRepository listingRepository,
                        VendorRepository vendorRepository,
                        PaystackClient paystackClient) {
        this.orderRepository = orderRepository;
        this.listingRepository = listingRepository;
        this.vendorRepository = vendorRepository;
        this.paystackClient = paystackClient;
    }

    @Transactional
    public CheckoutResponse create(CreateOrderRequest request, User user) {
        List<Listing> listings = request.items().stream()
                .map(i -> listingRepository.findById(i.listingId())
                        .orElseThrow(() -> new NotFoundException("Listing " + i.listingId() + " not found")))
                .toList();

        // Single vendor per order.
        long distinctVendors = listings.stream().map(Listing::getVendorId).distinct().count();
        if (distinctVendors > 1) {
            throw ApiException.badRequest("All items in an order must be from the same vendor (one order per vendor)");
        }

        // Same-country + stock enforcement.
        for (int i = 0; i < listings.size(); i++) {
            Listing listing = listings.get(i);
            CreateOrderItem item = request.items().get(i);
            if (!listing.getCountry().equalsIgnoreCase(user.getCountry())) {
                throw ApiException.badRequest(
                        "Listing '" + listing.getTitle() + "' is not available in your country");
            }
            if (!listing.isAvailable()) {
                throw ApiException.badRequest("'" + listing.getTitle() + "' is currently unavailable.");
            }
            // stockQty <= 0 means the vendor doesn't track stock for this item (unlimited).
            if (listing.getStockQty() > 0 && item.qty() > listing.getStockQty()) {
                throw ApiException.badRequest(
                        "Only " + listing.getStockQty() + " of '" + listing.getTitle()
                                + "' left in stock.");
            }
        }

        long subtotal = 0;
        Order order = new Order();
        for (int i = 0; i < listings.size(); i++) {
            Listing listing = listings.get(i);
            CreateOrderItem item = request.items().get(i);
            subtotal += listing.getAmountMinor() * item.qty();
            order.getItems().add(new OrderItem(listing.getId(), listing.getTitle(), listing.getImageUrl(),
                    item.qty(), listing.getAmountMinor()));
        }

        long fee = Math.round(subtotal * FEE_RATE);
        long total = subtotal + fee + DELIVERY_MINOR;

        order.setReference("DSP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setUserId(user.getId());
        order.setVendorId(listings.get(0).getVendorId());
        order.setSubtotalMinor(subtotal);
        order.setFeeMinor(fee);
        order.setDeliveryMinor(DELIVERY_MINOR);
        order.setTotalMinor(total);
        order.setCurrency(CountryUtil.currencyFor(user.getCountry()));
        order = orderRepository.save(order);

        PaystackInitDto payment = paystackClient.initialize(
                user.getEmail(), total, order.getCurrency(), order.getReference());
        return new CheckoutResponse(toDto(order), payment);
    }

    @Transactional
    public OrderDto verify(Long orderId, String reference, User user) {
        Order order = findOwned(orderId, user);
        if (!Objects.equals(order.getReference(), reference)) {
            throw ApiException.badRequest("Reference does not match this order");
        }
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            if (!paystackClient.verify(reference)) {
                throw ApiException.badRequest("Payment not confirmed yet");
            }
            order.setStatus(OrderStatus.PAID);
            order = orderRepository.save(order);
            decrementStock(order);
        }
        return toDto(order);
    }

    public List<OrderDto> myOrders(User user) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    public OrderDto get(Long id, User user) {
        return toDto(findOwned(id, user));
    }

    public List<OrderDto> vendorOrders(User user) {
        Vendor vendor = requireVendor(user);
        return orderRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public OrderDto updateStatus(Long orderId, String status, User user) {
        Vendor vendor = requireVendor(user);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (!Objects.equals(order.getVendorId(), vendor.getId()) && user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("This order does not belong to your store");
        }
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid order status: " + status);
        }
        order.setStatus(newStatus);
        return toDto(orderRepository.save(order));
    }

    public OrderDto toDto(Order order) {
        Vendor vendor = vendorRepository.findById(order.getVendorId()).orElse(null);
        return OrderDto.from(order, vendor);
    }

    /** After payment, draw down tracked stock (stockQty > 0) so listings can sell out. */
    private void decrementStock(Order order) {
        for (OrderItem item : order.getItems()) {
            listingRepository.findById(item.getListingId()).ifPresent(listing -> {
                if (listing.getStockQty() > 0) {
                    int remaining = Math.max(0, listing.getStockQty() - item.getQty());
                    listing.setStockQty(remaining);
                    if (remaining == 0) listing.setAvailable(false);
                    listingRepository.save(listing);
                }
            });
        }
    }

    private Order findOwned(Long id, User user) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (!Objects.equals(order.getUserId(), user.getId()) && user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("This order does not belong to you");
        }
        return order;
    }

    private Vendor requireVendor(User user) {
        return vendorRepository.findByOwnerUserId(user.getId())
                .orElseThrow(() -> ApiException.forbidden("You need a vendor profile to do this"));
    }
}
