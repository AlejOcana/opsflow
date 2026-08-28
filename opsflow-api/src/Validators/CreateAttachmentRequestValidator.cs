using FluentValidation;
using OpsFlow.Api.DTOs;

namespace OpsFlow.Api.Validators;

public class CreateAttachmentRequestValidator : AbstractValidator<CreateAttachmentRequest>
{
    public CreateAttachmentRequestValidator()
    {
        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("FileName is required")
            .MaximumLength(255).WithMessage("FileName max 255 characters")
            .Must(f => !string.IsNullOrWhiteSpace(f) && f.Trim().Length > 0).WithMessage("FileName cannot be whitespace");

        RuleFor(x => x.Url)
            .NotEmpty().WithMessage("Url is required")
            .Must(BeValidUrlOrDataUri).WithMessage("Url must be a valid absolute Uri (http/https) or data:image/*;base64, dataUri")
            .MaximumLength(100000).WithMessage("Url max 100000 characters");

        When(x => x.ContentType != null, () =>
        {
            RuleFor(x => x.ContentType!)
                .MaximumLength(100)
                .Must(ct => ct.Contains('/')).WithMessage("ContentType must be a valid MIME type");
        });

        When(x => x.SizeBytes.HasValue, () =>
        {
            RuleFor(x => x.SizeBytes!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("SizeBytes must be >=0")
                .LessThanOrEqualTo(50 * 1024 * 1024).WithMessage("SizeBytes max 50MB");
        });
    }

    private static bool BeValidUrlOrDataUri(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;
        url = url.Trim();
        if (url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            // data:image/* or data:application/* base64
            // Examples: data:image/png;base64,xxx  or data:application/pdf;base64,xxx
            if (!url.Contains(";base64,")) return false;
            var prefix = url.Substring(0, url.IndexOf(";base64,", StringComparison.OrdinalIgnoreCase));
            // must start with data:image/ or data:application/ or data:text/
            return prefix.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)
                || prefix.StartsWith("data:application/", StringComparison.OrdinalIgnoreCase)
                || prefix.StartsWith("data:text/", StringComparison.OrdinalIgnoreCase)
                || prefix.Equals("data:application/octet-stream", StringComparison.OrdinalIgnoreCase);
        }
        // Regular URL must be absolute http/https
        return Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
