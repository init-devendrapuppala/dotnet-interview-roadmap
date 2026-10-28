# Angular Route Guards

Route guards let the Angular Router allow, cancel, or redirect a navigation. They are useful for user experience: redirecting a signed-out user to sign-in, checking whether a feature is available, or warning before leaving a form with unsaved edits. A guard influences navigation in the browser; it is not a security boundary for API data.

## Functional guards

Modern Angular commonly uses functional guards. The router runs the guard in an injection context, so it can use `inject()` to access services. A guard may synchronously return a boolean or redirect tree, or return an asynchronous result such as a Promise or Observable:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const signedInGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isSignedIn()
    ? true
    : router.createUrlTree(['/sign-in']);
};
```

Attach it in route configuration with `canActivate: [signedInGuard]`. Returning a `UrlTree` directly tells the router to redirect as part of the current navigation. Imperatively calling `router.navigate()` and then returning `false` can create confusing competing navigations.

## Asynchronous checks and guard types

For asynchronous identity or policy checks, return an observable or promise that resolves to the decision. The router waits for the result, so avoid a stream that never emits or completes. Decide how network errors should behave: allowing access on failure may be unsafe, while blocking navigation without explanation is confusing. Show or route to a useful error state where appropriate.

`canActivate` controls entering a route; `canActivateChild` applies to child routes. `canDeactivate` is often used for unsaved changes, and `canMatch` can decide whether a route configuration is eligible to match. Use the narrowest hook that expresses the intended navigation behavior; do not make a guard a large orchestration service.

## Security and testing

A browser user controls the client code and can bypass route checks or send HTTP requests directly. The API must authenticate and authorize every protected operation, including resource-level access. Do not put secrets or authoritative permission decisions in the Angular bundle. A guard can improve UX, but ASP.NET Core policies and server-side checks protect data.

Test signed-in, signed-out, redirect, and failure cases. Keep return URLs constrained to safe internal destinations; blindly trusting a supplied redirect URL can send users to an external site. For an unsaved-changes guard, test both a clean form and a dirty form where the user cancels or confirms.

**Interview takeaway:** distinguish client navigation from server authorization. Explain what the guard returns, how asynchronous decisions terminate, and why a redirect tree is clearer than side-effect navigation.

## Related Topics

- [Routing](./routing.md)
- [HTTP Client](./http-client.md)
- [Interceptors](./interceptors.md)
- [Angular Architecture](./angular-architecture.md)
- [Services](./services.md)
