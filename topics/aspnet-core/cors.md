## Why CORS exists

Cross-Origin Resource Sharing is a browser-enforced mechanism that controls whether JavaScript from one origin may read a response from another. An origin is the scheme, host, and port. CORS is not authentication, authorization, or a general firewall: non-browser clients are not constrained by browser CORS enforcement, and a blocked response does not imply the server did not process the request.

Define a narrow policy for known front-end origins:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins("https://app.example.com")
              .WithMethods("GET", "POST")
              .WithHeaders("Content-Type", "Authorization"));
});

var app = builder.Build();
app.UseRouting();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

Ordering and endpoint metadata matter; place CORS after routing and before authorization when using endpoint routing. Alternatively attach the policy to selected endpoints. Avoid `AllowAnyOrigin` together with credentials; browsers disallow that combination, and reflecting arbitrary origins while permitting credentials is dangerous. If cookies or other credentials are needed cross-origin, explicitly allow trusted origins and enable credentials, then separately implement CSRF defenses.

Preflight `OPTIONS` requests ask permission for certain methods/headers before the browser sends the actual request. A policy must account for the methods and headers the client really uses. `Access-Control-Allow-Origin` responses may be cached, so middleware and caches must correctly vary by origin when reflecting from an allowlist. Diagnose CORS in browser developer tools and server logs; a CORS error is often a missing/misordered policy, not an API reachability failure.

## Preflight and cache details

A browser sends a preflight when a cross-origin request is not a "simple" request under the CORS rules—for example, certain methods or custom headers. The preflight includes the requesting origin and the intended method/headers. The server's response tells the browser whether it may send the actual request. A failed preflight means the browser does not send that follow-up request; a failure on a non-preflight response can mean the server processed the request but the browser withheld the response from JavaScript. This distinction matters when investigating duplicated writes or apparent API outages.

Avoid manually implementing broad `OPTIONS` handlers that conflict with CORS middleware. Let the policy describe required methods, headers, origins, and credentials. If the origin is selected dynamically from an allowlist, ensure responses vary correctly by `Origin` so shared caches do not serve one origin's CORS headers to another. Keep the allowlist exact; wildcard subdomain matching should be narrowly scoped and tested.

## CORS is not an access-control boundary

CORS controls whether browser JavaScript can read cross-origin responses; it does not stop curl, mobile apps, server-to-server callers, or malicious clients from reaching the endpoint. It also does not prevent a browser from sending every possible cross-site request. Authentication and authorization remain server-side requirements. For cookie-authenticated cross-origin requests, explicitly allow trusted origins and credentials, then use antiforgery protection or another deliberate CSRF defense.

The `AllowAnyOrigin` plus credentials combination is invalid in browser CORS and should not be worked around by reflecting any `Origin`. A permissive CORS policy can expose sensitive response data to untrusted web pages when credentials are involved. Conversely, an overly narrow policy can break legitimate clients but is not a substitute for endpoint security. Keep development origins separate from production policy and avoid broad localhost patterns in deployed configuration.

When diagnosing a browser report, inspect the request origin, preflight response, actual response headers, credential mode, and middleware ordering. Verify the server response with a command-line client while remembering that command-line tools do not enforce CORS. Add integration tests for expected origin/method/header combinations and a browser test for credential behavior where it is business-critical.

## Related Topics

- [Authentication](./authentication.md)
- [Cookies](./cookies.md)
- [Middleware](./middleware.md)
- [Web APIs](./web-api.md)
- [Rate limiting](./rate-limiting.md)