namespace MutualFund.Gateway.Middleware
{
    public class GatewayLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GatewayLoggingMiddleware> _logger;

        public GatewayLoggingMiddleware(
            RequestDelegate next,
            ILogger<GatewayLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var start = DateTime.UtcNow;
            var traceId = context.TraceIdentifier;
            var method = context.Request.Method;
            var path = context.Request.Path;
            var userEmail = context.User?.FindFirst("email")?.Value
                            ?? "anonymous";
            var userRole = context.User?.FindFirst("role")?.Value
                            ?? "none";

            _logger.LogInformation(
                "→ Gateway Request — TraceId:{TraceId} " +
                "{Method} {Path} User:{Email} Role:{Role}",
                traceId, method, path, userEmail, userRole);

            await _next(context);

            var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;

            _logger.LogInformation(
                "← Gateway Response — TraceId:{TraceId} " +
                "Status:{Status} Elapsed:{Elapsed}ms",
                traceId,
                context.Response.StatusCode,
                elapsed.ToString("F0"));
        }
    }
}
