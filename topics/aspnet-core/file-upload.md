## Why uploads need explicit limits

An uploaded file is untrusted input. Limits protect memory, disk, network bandwidth, parser libraries, and downstream systems; validating only the filename or browser-provided content type is insufficient. Prefer streaming for large payloads instead of buffering the entire body into memory.

For modest multipart uploads, ASP.NET Core binds `IFormFile`:

```csharp
using Microsoft.Extensions.Options;

public sealed class UploadController(IOptions<UploadOptions> options) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> Upload(
        IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length is <= 0 or > 10_000_000)
            return BadRequest("Invalid file size.");

        var safeName = Path.GetRandomFileName();
        var destination = Path.Combine(options.Value.StagingDirectory, safeName);
        await using var output = System.IO.File.Create(destination);
        await file.CopyToAsync(output, cancellationToken);
        return Accepted();
    }
}

public sealed class UploadOptions
{
    public string StagingDirectory { get; set; } = "";
}
```

Configure request/form limits consistently across Kestrel, reverse proxies, and application code. Avoid writing to a web-served directory, trusting `FileName`, or using user input directly in a path. Apply authorization and quotas, generate server-side storage names, validate content through safe parsers/scanning appropriate to the domain, and store metadata separately. Do not trust the extension or MIME header alone.

For large files, stream multipart sections or upload directly to object storage using short-lived, narrowly scoped upload permissions; then validate the completed object before making it available. Use temporary/quarantine storage and cleanup policies. Consider decompression bombs, archive traversal, malware, and abandoned partial uploads. Return an opaque identifier rather than exposing internal paths.

**Interview check:** `IFormFile` is convenient but may buffer content before endpoint code executes; it is not automatically a streaming design.

## End-to-end upload flow

Treat an upload as a multi-stage workflow rather than one controller action. A robust flow is: authenticate and authorize the uploader; enforce request and per-user quotas; stream into a quarantine or staging area with a server-generated identifier; validate size and file structure; scan or inspect using approved tooling; persist metadata and state; then make the object available only after successful validation. The client should receive an opaque ID and a clear processing state, not an internal filesystem path.

For modest multipart requests, `IFormFile` is convenient, but form parsing may buffer content to memory or temporary disk before endpoint logic. Configure both Kestrel/reverse proxy limits and ASP.NET Core form limits; a controller attribute alone may not represent the effective maximum. For larger transfers, stream sections and enforce the byte limit while copying so a dishonest `Content-Length` does not bypass the limit. Use cancellation tokens, bounded buffers, and async streams; do not call `ReadAllBytes` for unbounded input.

Never use the original filename as a storage path. It may contain traversal sequences, confusing Unicode, or a duplicate name. Store a sanitized display name only as metadata if needed, and keep it separate from a generated storage key. Do not trust the browser's content type or extension. Inspect signatures and parse content with safe libraries; parsers themselves can have vulnerabilities, so keep them updated and isolate high-risk processing.

## Abuse, lifecycle, and delivery

Uploads can exhaust disk through many small files, oversized files, abandoned multipart sessions, or decompression bombs. Enforce per-file, per-user, and aggregate quotas; rate-limit creation; expire incomplete uploads; monitor storage growth; and make cleanup idempotent. Archive extraction requires entry-count, expanded-size, path-normalization, and traversal checks. Never extract untrusted archives directly into a served directory.

Object storage can reduce pressure on the web process. A short-lived upload authorization should grant access only to a specific object and operation, with size/content constraints where supported. The application must still validate the completed object before serving it. Store files outside the web root or in a private bucket; serve through an authorized download endpoint or a short-lived read link. Set safe content-disposition and content-type headers, and consider malware scanning and content-disarm workflows for the domain.

Use integration tests for empty and over-limit files, malformed multipart boundaries, invalid names, unauthorized users, cancellation, and cleanup after partial failure. Document when the upload becomes visible and how clients poll for processing completion. A senior interview answer should mention memory/disk buffering, proxy limits, untrusted metadata, staged storage, and the difference between accepting bytes and validating a safe document.

## Related Topics

- [Web APIs](./web-api.md)
- [Kestrel](./kestrel.md)
- [Rate limiting](./rate-limiting.md)
- [S3](../aws/s3.md)
- [Streams](../csharp/streams.md)