## Why cookie settings matter

An authentication cookie is a bearer credential: whoever can present it may act as its owner until it expires or is invalidated. Protect it in transit and at rest, and choose scope and lifetime intentionally. ASP.NET Core cookie authentication typically stores a protected authentication ticket in the browser; it is not the same as a server-side session store, although the ticket can reference server-side state.

For an authentication cookie, use HTTPS and normally set `Secure`, `HttpOnly`, and an appropriate `SameSite` value. `HttpOnly` prevents ordinary JavaScript access but does not stop XSS from issuing authenticated requests. `SameSite` helps mitigate cross-site request forgery, but legitimate cross-site flows and browser behavior may require `Lax` or `None` (with `Secure`) plus explicit CSRF protection. Do not set `SameSite=None` casually.

ASP.NET Core configuration example:

```csharp
using Microsoft.AspNetCore.Authentication.Cookies;

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "__Host-myapp";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.Path = "/";
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
        options.SlidingExpiration = true;
    });
```

The `__Host-` prefix has browser requirements, including `Secure`, path `/`, and no `Domain`; verify the deployment and framework behavior before adopting it. Sliding expiration can keep active sessions alive, so pair it with an absolute lifetime or reauthentication policy when appropriate. Cookie deletion must use matching path/domain settings. Behind a TLS-terminating proxy, configure forwarded headers correctly so the app recognizes the original HTTPS scheme; do not trust arbitrary forwarded headers from untrusted clients.

Cookies are automatically attached by browsers, which creates CSRF considerations for state-changing endpoints. Validate antiforgery tokens or use another well-reviewed strategy, and avoid state changes on GET.

## Authentication cookie versus application data

An authentication cookie commonly contains a cryptographically protected ticket with identity claims and expiration metadata. Data Protection keys must be persisted and shared appropriately across instances if users should remain signed in during restarts or load balancing. In a multi-instance deployment, ephemeral per-process keys can make another instance unable to unprotect the ticket. Protect and rotate the key ring, restrict access to it, and avoid copying keys broadly. A cookie is not encrypted by TLS alone; ASP.NET Core's authentication ticket protection and HTTPS serve different purposes.

Do not use a large cookie as a general data store. Cookies travel with matching requests, increasing bandwidth and header size; browser and proxy limits can reject oversized headers. Store only the minimum identity/session state needed, and keep mutable authorization state server-side when it must change immediately. Logout typically deletes the browser cookie, but stolen copies may remain usable until expiration unless the application supports revocation or server-side validation.

## CSRF, scope, and deployment checks

Because browsers attach cookies automatically, a malicious site may try to cause a victim's browser to submit a state-changing request. Antiforgery tokens bind the request to a value the attacking origin cannot normally read. SameSite reduces some cross-site cookie sending, but compatibility requirements, top-level navigations, and browser behavior mean it should be one layer rather than a blanket guarantee. Protect POST/PUT/PATCH/DELETE actions that use cookie credentials; never mutate state through GET.

Cookie path and domain control where browsers send a cookie. Narrow scope reduces unnecessary exposure; a `__Host-` cookie requires `Secure`, `Path=/`, and no `Domain`, while a `__Secure-` cookie requires HTTPS. Confirm the application sees HTTPS behind a trusted TLS-terminating proxy, otherwise redirects and cookie policies can be wrong. Configure forwarded headers only from known proxies; arbitrary forwarded values are attacker-controlled.

Test sign-in and sign-out, expiration, renewal, cross-subdomain behavior, antiforgery failures, and multi-instance Data Protection continuity. Inspect the browser's cookie attributes and the response headers in a production-like deployment. Do not copy session identifiers into logs or analytics. For an interview, explain that `HttpOnly` limits JavaScript reads, `Secure` limits transport to HTTPS, and `SameSite` affects cross-site sending—none of these replaces server authorization or input validation.

## Related Topics

- [Authentication](./authentication.md)
- [Authorization](./authorization.md)
- [CORS](./cors.md)
- [Middleware](./middleware.md)
- [Kestrel](./kestrel.md)