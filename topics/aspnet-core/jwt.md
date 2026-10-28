## What a JWT does—and does not do

JSON Web Tokens (JWTs) are a compact token format commonly used as bearer access tokens. A signed JWT provides integrity and issuer authentication if validation is correct; a standard signed token is not confidential, so its header and claims can be decoded by anyone holding it. Do not put secrets or unnecessary personal data in claims.

ASP.NET Core's JWT bearer handler validates the token on each request. Configure trusted issuer, audience, signing-key validation, and lifetime validation using trusted configuration or an identity provider's metadata. Do not disable signature or issuer validation to “make tokens work.” Key rotation and clock skew need a deliberate policy; avoid hard-coding development keys or logging the token.

```csharp
builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Identity:Authority"];
        options.Audience = builder.Configuration["Identity:Audience"];
        options.RequireHttpsMetadata = true;
    });
builder.Services.AddAuthorization();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/profile", (ClaimsPrincipal user) =>
    Results.Ok(new { Subject = user.FindFirst("sub")?.Value }))
   .RequireAuthorization();
```

In an authority-based setup, metadata supplies validation keys and issuer information; verify the provider's expected audience/claim mapping. JWTs are often valid until expiration, so immediate revocation is not inherent. Short lifetimes, refresh-token rotation, server-side deny lists, or reference tokens address different operational needs and tradeoffs.

Bearer tokens in the `Authorization` header are generally not automatically attached by browsers, reducing classic CSRF exposure compared with cookies, but XSS can still steal or use tokens available to script. A 401 indicates authentication challenge; a valid identity lacking a required policy commonly receives 403. Token validation and authorization are separate steps.

## Token structure and validation model

A compact JWT commonly has three base64url-encoded sections: header, claims payload, and signature. The payload is readable; base64url encoding is not encryption. A signature lets a validator detect changes and verify that a trusted issuer created the token, but only when the handler validates it against trusted keys and expected issuer/audience values. Never make access decisions by decoding a token in client code or by accepting an unverified claim.

The bearer handler runs during authentication middleware and produces a principal when the token passes validation. A valid signature alone is not enough: audience prevents a token intended for one API from being replayed to another, issuer ties it to a trusted authority, and lifetime limits stale credentials. HTTPS protects tokens in transit; signing protects integrity; neither makes a token secret once exposed.

## Lifetime and revocation tradeoffs

Short-lived access tokens reduce the time a stolen token remains useful, but frequent renewal affects availability and user experience. Refresh tokens require stronger storage and rotation protections and should be revoked or rotated after reuse according to the identity provider's capabilities. A self-contained JWT has no built-in immediate revocation: logout at the client does not invalidate a copied token. Options include short expiration, a server-side denylist/reference token, or checking an account/session version, each adding operational or request-time costs.

Signing key rotation needs overlap so existing valid tokens can be checked while new keys are issued. With authority metadata, the handler can use the provider's published signing keys; avoid hard-coded keys and disabling issuer/audience/signature checks as a debugging shortcut. Test unknown key IDs, metadata outages, clock skew, invalid algorithms, expired tokens, and wrong audiences according to the configured library and identity provider.

Do not put passwords, API keys, or sensitive personal data into claims. Keep claims minimal; large tokens increase request headers and can exceed proxy/server limits. Treat authentication and authorization separately: a valid token establishes an identity, while policies and resource checks decide whether that identity can perform the operation.

## Related Topics

- [Authentication](./authentication.md)
- [Authorization](./authorization.md)
- [Cookies](./cookies.md)
- [Configuration](./configuration.md)
- [Rate limiting](./rate-limiting.md)