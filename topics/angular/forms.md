# Angular Forms

Angular forms coordinate control values, validation, interaction state, and submission. A useful form is more than a collection of inputs: it should explain which values are required, when errors become visible, what is happening during asynchronous validation, and how a failed save can be corrected. Client-side checks improve usability, but the server must validate again because a browser is under the user's control.

## Reactive or template-driven?

Reactive forms define controls and validators in TypeScript. This makes form structure explicit, supports dynamic controls and cross-field rules, and tends to be easier to test for complex workflows. Template-driven forms define more of the model through directives in HTML and can be concise for small forms with straightforward fields. Both use Angular's forms model; neither is universally superior. Choose according to complexity, dynamic behavior, team familiarity, and test needs.

Reactive forms are often a good choice when controls are added or removed based on user decisions, when validation rules depend on multiple values, or when the form must map carefully to an API DTO. For a small contact form with simple required fields, template-driven syntax may involve less setup. Do not mix the two approaches on the same form without a clear reason.

## Typed reactive forms

Typed forms help catch mistakes when reading and setting form values. Non-nullable controls are useful when the application should always treat a text field as a string rather than `string | null`:

```ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label for="email">Email</label>
      <input id="email" type="email" formControlName="email">
      @if (form.controls.email.touched && form.controls.email.invalid) {
        <p id="email-error">Enter a valid email address.</p>
      }
      <button type="submit" [disabled]="form.invalid || saving">Sign in</button>
    </form>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  saving = false;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.form.getRawValue();
    console.log(request);
  }
}
```

This example shows validation and extraction, not a complete authentication flow. A real screen would call an injected service, manage a pending and error state, and provide appropriate accessible error associations (for example `aria-describedby` and `aria-invalid`). Never log credentials.

## Value, validity, and interaction state

Controls and groups expose several distinct states:

- `value` is the current enabled value shape. Disabled controls are excluded from a group's aggregate value.
- `getRawValue()` includes disabled controls. This matters when building an update DTO, but do not assume disabled means trusted or authorized.
- `valid`/`invalid` reflect synchronous and completed asynchronous validators; `pending` indicates async validation is still running.
- `pristine`/`dirty` indicate whether the user changed a value.
- `untouched`/`touched` track focus/blur interaction, not correctness.

Show errors at a helpful time. Revealing errors on initial page load can overwhelm users; waiting until submit can be suitable for some forms, while field-level errors after blur help with longer forms. Keep server validation errors visible and mapped to relevant fields when possible. A disabled submit button is a usability aid, not a security or validation boundary.

## Validation and dynamic forms

Synchronous validators return either an error map or `null`. Cross-field validation belongs at a group level when the rule relates multiple controls, such as a date range. Async validators return a Promise or Observable and set the control to pending while they run. Avoid sending a server request on every keystroke without a deliberate update strategy; debounce and deduplicate where appropriate, and ensure the validator's observable completes.

When creating dynamic forms, make the schema and allowed control set explicit. Use `FormArray` for repeatable groups and `FormGroup` for named controls. Reconcile controls when the underlying options change rather than rebuilding indiscriminately, since recreation can discard dirty state, focus, and validation status. For server-driven form configuration, validate the configuration and constrain supported field types; never turn untrusted server strings into executable template code.

## Submission and API boundaries

On submission, verify validity in the handler even if the button is disabled. Build a deliberate request object instead of blindly sending every control property. Set a pending state to prevent accidental duplicate submissions, then handle success and failure. For operations that must not be duplicated, server-side idempotency is still required: a disabled button cannot protect against retries, multiple tabs, or direct requests.

Keep form state separate from server state when their lifecycles differ. A form's unsaved edits may survive a validation error, while refreshed server data may replace a list elsewhere on the page. Reset only when the user's workflow is complete or the intended record changes. `reset()` also changes pristine/touched state, so use it deliberately.

**Interview takeaway:** compare the two form models by complexity and testing needs, explain typed controls and validation timing, and distinguish UI validation from server authority. Strong production answers also cover pending state, accessibility, disabled values, and duplicate submission behavior.

## Related Topics

- [Components](./components.md)
- [Services](./services.md)
- [HTTP Client](./http-client.md)
- [Observables](./observables.md)
- [RxJS](./rxjs.md)
