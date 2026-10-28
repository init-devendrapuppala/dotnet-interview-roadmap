## Why authentication is separate

Authentication establishes who or what is making a request; authorization decides what that principal may do. ASP.NET Core authentication handlers read credentials and produce an `AuthenticateResult` containing a `ClaimsPrincipal`. A scheme names a handler and its options. Cookie, bearer-token, and external-login schemes have different trust and transport assumptions, so do not treat them as interchangeable.

Register the schemes and choose defaults intentionally. For a bearer API, a typical setup uses `AddAuthentication(...).AddJwtBearer(...)`; for an interactive web app, cookie authentication is common. In either case, configure secrets and signing keys outside source control, validate issuer, audience, lifetime, and signature for JWTs, and use TLS. A JWT is normally signed, not encrypted: its claims can be read by whoever obtains it.

Authentication middleware must run after routing and before authorization:

```csharp
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

Calling authentication does not itself protect endpoints; endpoints need authorization policy/metadata. Conversely, authorization without an authenticated principal may still allow anonymous endpoints. A 401 typically means credentials were absent or invalid; 403 means the authenticated principal failed authorization, though custom handlers and challenge behavior can affect the response.

Avoid storing long-lived access tokens in browser-accessible storage without considering XSS exposure. Cookie-based browser auth needs CSRF defenses (SameSite is useful but not a universal replacement); bearer tokens sent explicitly in an Authorization header have different CSRF characteristics. Keep credentials short-lived where appropriate, rotate/revoke through a deliberate design, and avoid logging secrets or raw authorization headers.

**Interview check:** Authentication answers “who are you?”; authorization answers “may you perform this action?” Neither a decoded JWT nor a client-side role check is proof of trust.

## The authentication flow

Authentication is a request-time operation performed by one or more named schemes. A scheme identifies a handler and its options: a cookie handler can read a protected cookie, a JWT bearer handler can validate an `Authorization: Bearer` token, and an external handler can participate in an OpenID Connect sign-in. The handler returns an authentication result; on success ASP.NET Core associates a `ClaimsPrincipal` with the request. The principal is a set of identities and claims, not a database entity and not proof that every claim is current.

The common endpoint flow is:

```text
HTTP request
   → routing selects endpoint and metadata
   → authentication scheme reads credentials / builds principal
   → authorization evaluates endpoint policy against principal
   → endpoint runs or challenge/forbid response is produced
```

`UseAuthentication` attempts to establish the principal. It does not by itself reject anonymous users. `UseAuthorization` applies endpoint metadata and policies. An `[Authorize]` attribute or `.RequireAuthorization()` is what protects the endpoint; otherwise an endpoint can remain anonymous. A challenge (often 401 for a bearer API) asks for valid credentials. A forbid (often 403) says credentials were accepted but the principal did not satisfy access rules. Cookie handlers may redirect an unauthenticated browser to a login page, so an API's response semantics depend on its configured scheme and events.

## Choosing schemes for application types

Use bearer authentication for clients that explicitly send access tokens, especially service-to-service and mobile/API clients. Use cookies for browser sessions when the browser's automatic cookie behavior and server-side sign-in flow fit the application. These approaches have distinct threat models:

* Cookies are automatically attached by browsers, so state-changing operations require CSRF protection. `HttpOnly` makes a cookie unavailable to ordinary JavaScript but does not stop injected script from issuing authenticated requests.
* Bearer tokens placed in a browser's persistent script-readable storage can be stolen by XSS. A bearer token in an explicit header is not normally attached automatically cross-site, but the client must protect its storage and transmission.
* OAuth/OIDC flows should use a trusted identity provider and the appropriate flow for the client. A resource API validates access tokens; it should not treat an ID token, intended to describe an authentication event to a client, as an API access token.

For a JWT API, configure a well-supported handler and validate signature, trusted issuer, intended audience, expiry, and HTTPS metadata. Prefer identity-provider discovery and managed key rotation over hand-written token validation. Configure the correct authentication default when multiple schemes exist; otherwise a policy may authenticate with an unintended cookie or token handler. Use policy schemes only when routing among credential types is an intentional design with tests.

## Claims and trust boundaries

Claims are inputs to authorization, not facts merely because a client supplied them. A server should construct the principal only after a trusted handler validates credentials. Claim names and value formats can differ between providers, so normalize required claims at a boundary and avoid brittle assumptions about one provider's role claim mapping. A user's roles or account status can change after a long-lived token is issued; high-impact actions may need a current server-side check or shorter credential lifetime.

Avoid putting sensitive data in a signed JWT: signing protects integrity, not confidentiality. Minimize claims to what the resource server needs. Never log raw tokens, cookies, passwords, or full authorization headers. Do not accept a user ID from a request body as the authenticated identity; derive identity from the validated principal and still authorize access to the requested resource.

## Operational behavior and testing

Authentication should fail closed for protected endpoints if required credentials or validation services are unavailable. Keep signing keys and client secrets out of source control, restrict access to them, and plan rotation before an incident. TLS protects credentials in transit but does not replace correct validation. Token expiration, revocation, refresh-token rotation, logout, and multi-device session policy are application-level lifecycle decisions; a self-contained JWT is not automatically revoked when a user logs out.

Test no credentials, malformed credentials, expired and wrong-audience tokens, valid credentials without permission, and valid credentials with permission. Also test browser redirects versus API status codes, scheme selection when multiple handlers are configured, and anonymous endpoints. Integration tests exercise the real middleware ordering and endpoint metadata more reliably than testing a handler in isolation.

## Multiple schemes and sign-in flows

An application may use more than one scheme—for example, a cookie for browser sessions and bearer tokens for API calls. Register each scheme with a deliberate name and configure which scheme is the default for authenticate, challenge, and forbid operations. A named authorization policy can specify which scheme to use, which is often clearer than making one endpoint guess. If one endpoint intentionally accepts multiple credential types, define and test that behavior; accidental fallback between a browser cookie and an API bearer token can produce surprising redirects or trust assumptions.

An OpenID Connect sign-in commonly involves redirecting the browser to an identity provider, receiving a protected callback, validating protocol state/nonce, and establishing a local application cookie. The ID token is typically part of sign-in protocol processing, whereas the access token is meant for a resource API. Keep callback paths, redirect URIs, and cookie settings aligned with the identity provider. Protect state-changing callback flows against forgery and avoid accepting arbitrary return URLs, which can create open redirects.

Cookie authentication is often a practical browser session mechanism even when an external identity provider handles the user's credentials. The app should not collect or store the user's upstream password. For APIs, bearer authentication usually avoids browser-style automatic credential sending, but browser token storage creates XSS exposure and refresh-token storage deserves special care. The right choice depends on the client and threat model; "JWT is stateless" does not make an application automatically scalable, secure, or simpler.

## Principal construction and identity boundaries

Authentication handlers can create multiple identities in a principal, and claims may be mapped or normalized by framework/provider configuration. Do not rely on an assumed claim type such as `role` or `name` without checking the issuer's contract and token-validation mapping. Normalize external claims once at the trust boundary when multiple identity providers should map into one internal permission vocabulary. Preserve the subject/issuer relationship needed to distinguish identical subject identifiers from different issuers.

`IClaimsTransformation` can enrich a principal, but transformation may run more than once for a request or authentication flow. Implement it idempotently and avoid costly database queries on every call. If dynamic account state is needed, be clear about caching and freshness. A claims transformation is not an appropriate place to silently grant permissions based on untrusted input.

## Troubleshooting without weakening security

When authentication fails, inspect scheme selection, challenge behavior, token issuer/audience/lifetime, clock synchronization, signing-key discovery, and proxy/TLS metadata. Use safe diagnostic logs and never paste production tokens into online decoders, tickets, or chat. Redact token values and cookies before sharing traces. A development-only token inspection utility may help, but it does not replace runtime validation.

In an interview, explain which component establishes identity, how multiple schemes are selected, and what the app does after the identity provider authenticates a person. Then describe token/cookie transport and lifetime tradeoffs. Avoid blanket statements such as "JWTs are always better than sessions" or "cookies are insecure"; compare credential attachment, storage, revocation, browser behavior, and server-side authorization requirements.

**Interview misconceptions:** `UseAuthentication` is not an authorization rule; decoding a JWT is not validating it; “401 means not logged in and 403 means logged in” is a useful shorthand but challenge/forbid handlers can customize behavior; and CORS is not a way to authenticate callers.

## Related Topics

- [Authorization](./authorization.md)
- [JWT](./jwt.md)
- [Cookies](./cookies.md)
- [Middleware](./middleware.md)
- [Dependency injection](./dependency-injection.md)