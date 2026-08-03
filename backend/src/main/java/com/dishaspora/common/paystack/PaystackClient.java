package com.dishaspora.common.paystack;

import com.dishaspora.common.dto.PaystackInitDto;
import com.dishaspora.common.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Thin wrapper around the Paystack transaction API.
 * When no secret key is configured the client runs in MOCK mode so the whole
 * platform can be demoed locally without real Paystack credentials.
 */
@Component
public class PaystackClient {

    private static final Logger log = LoggerFactory.getLogger(PaystackClient.class);
    private static final String BASE_URL = "https://api.paystack.co";

    private final String secretKey;
    private final String publicKey;
    private final boolean allowMock;
    private final String callbackUrl;
    private final RestClient restClient;

    public PaystackClient(@Value("${paystack.secret-key:}") String secretKey,
                          @Value("${paystack.public-key:}") String publicKey,
                          @Value("${paystack.allow-mock:true}") boolean allowMock,
                          @Value("${app.base-url:http://localhost:8080}") String baseUrl) {
        this.secretKey = secretKey == null ? "" : secretKey.trim();
        this.publicKey = publicKey == null ? "" : publicKey.trim();
        this.allowMock = allowMock;
        this.callbackUrl = baseUrl.replaceAll("/+$", "") + "/api/payments/callback";
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
        // Make the payment mode unmistakable at startup so a missing key is never a
        // silent surprise (mock mode returns a fake checkout URL, not a real page).
        if (isMockMode()) {
            log.warn("Paystack: MOCK MODE — no PAYSTACK_SECRET_KEY set. Checkout will return a "
                    + "SANDBOX url (not a real Paystack page). allow-mock={}. Set PAYSTACK_SECRET_KEY "
                    + "(sk_test_/sk_live_) to enable real checkout.", allowMock);
        } else {
            String kind = this.secretKey.startsWith("sk_live") ? "LIVE" : "TEST";
            log.info("Paystack: REAL mode ({} key). callbackUrl={}", kind, callbackUrl);
        }
    }

    public boolean isMockMode() {
        return secretKey.isBlank();
    }

    /** Guards against silently auto-approving payments when no key is set in production. */
    private void assertUsable() {
        if (isMockMode() && !allowMock) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Payments are not available: no Paystack key is configured on the server.");
        }
    }

    public String publicKey() {
        return publicKey;
    }

    /**
     * Initializes a Paystack transaction and returns the checkout details.
     */
    @SuppressWarnings("unchecked")
    public PaystackInitDto initialize(String email, long amountMinor, String currency, String reference) {
        assertUsable();
        // Paystack REQUIRES a customer email (it's who the receipt is sent to). Fail
        // loudly rather than let Paystack reject the transaction opaquely.
        if (email == null || email.isBlank()) {
            log.error("Paystack init [{}]: customer email is null/blank — cannot initialize", reference);
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Cannot start payment: your account has no email on file.");
        }
        if (isMockMode()) {
            log.warn("Paystack init [{}]: MOCK MODE — returning sandbox url (no real charge). "
                    + "Set PAYSTACK_SECRET_KEY for a real checkout page.", reference);
            return new PaystackInitDto(
                    "https://checkout.paystack.com/mock/" + reference,
                    reference, publicKey, amountMinor, currency);
        }
        log.info("Paystack init [{}]: REAL — amount={} {}, email={}, callback={}",
                reference, amountMinor, currency, email, callbackUrl);
        try {
            Map<String, Object> body = Map.of(
                    "email", email,
                    "amount", amountMinor,
                    "currency", currency,
                    "reference", reference,
                    "callback_url", callbackUrl);
            Map<String, Object> response = restClient.post()
                    .uri("/transaction/initialize")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (response == null || !(response.get("data") instanceof Map)) {
                log.error("Paystack init [{}]: unexpected response (no data): {}", reference, response);
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Paystack initialize failed");
            }
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            String authUrl = String.valueOf(data.get("authorization_url"));
            log.info("Paystack init [{}]: OK — authorization_url={}", reference, authUrl);
            return new PaystackInitDto(
                    authUrl,
                    String.valueOf(data.get("reference")),
                    publicKey, amountMinor, currency);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Paystack init [{}]: FAILED — {}", reference, e.getMessage(), e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Paystack initialize failed: " + e.getMessage());
        }
    }

    /**
     * Verifies a Paystack transaction. In mock mode every reference verifies successfully.
     */
    @SuppressWarnings("unchecked")
    public boolean verify(String reference) {
        assertUsable();
        if (isMockMode()) {
            log.warn("Paystack verify [{}]: MOCK MODE — auto-approving (no real verification).", reference);
            return true;
        }
        log.info("Paystack verify [{}]: querying Paystack…", reference);
        try {
            Map<String, Object> response = restClient.get()
                    .uri("/transaction/verify/{reference}", reference)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
                    .retrieve()
                    .body(Map.class);
            if (response == null || !(response.get("data") instanceof Map)) {
                log.warn("Paystack verify [{}]: no data in response — treating as unverified", reference);
                return false;
            }
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            boolean ok = "success".equalsIgnoreCase(String.valueOf(data.get("status")));
            log.info("Paystack verify [{}]: status={} -> {}", reference, data.get("status"), ok ? "PAID" : "not paid");
            return ok;
        } catch (Exception e) {
            log.error("Paystack verify [{}]: FAILED — {}", reference, e.getMessage(), e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Paystack verify failed: " + e.getMessage());
        }
    }
}
