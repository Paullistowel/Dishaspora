package com.dishaspora.common.paystack;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Landing page Paystack redirects the checkout WebView to after payment. The
 * mobile app detects the "/api/payments/callback" URL and then calls verify;
 * this page is just what a browser would see if opened directly.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentsController {

    @GetMapping(value = "/callback", produces = MediaType.TEXT_HTML_VALUE)
    public String callback(@RequestParam(required = false) String reference) {
        return """
                <!doctype html><html lang="en"><head><meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Payment received</title></head>
                <body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#FDF5EA;
                display:flex;min-height:100vh;align-items:center;justify-content:center">
                <div style="background:#fff;border-radius:20px;padding:40px 32px;max-width:400px;text-align:center;
                box-shadow:0 8px 30px rgba(0,0,0,.08)">
                <div style="font-size:44px">✅</div>
                <h1 style="font-size:20px;color:#17252A;margin:12px 0">Payment received</h1>
                <p style="color:#5C6B73;font-size:14px;line-height:1.5">You can return to the Dishaspora app —
                your purchase is being confirmed.</p>
                </div></body></html>""";
    }
}
