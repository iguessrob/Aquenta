using AquentaLibrary.Models;
using AquentaLibrary.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // In Development: allow localhost for local testing
            policy.SetIsOriginAllowed(origin =>
                    origin.Contains("localhost") || origin.Contains("127.0.0.1"))
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            // In Production: strictly allow only known origins
            policy.WithOrigins(
                    "https://www.aquenta-coop.com",
                    "https://aquenta-coop.com")
                .SetIsOriginAllowedToAllowWildcardSubdomains()
                .AllowAnyHeader()
                .AllowAnyMethod();

            // Also allow Azure Static Web Apps staging environments
            policy.SetIsOriginAllowed(origin =>
                    origin.EndsWith(".azurestaticapps.net") ||
                    origin == "https://www.aquenta-coop.com" ||
                    origin == "https://aquenta-coop.com")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<EmailService>();

// Register KeepAliveService and its HttpClient
builder.Services.AddHttpClient("KeepAliveClient");
builder.Services.AddHostedService<AquentaAPI.Services.KeepAliveService>();

var app = builder.Build();

// SECURITY: Add cache control headers
app.Use(async (context, next) =>
{
    // Apply security headers to all responses
    context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate";
    context.Response.Headers["Pragma"] = "no-cache";
    context.Response.Headers["Expires"] = "0";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://aquentawebapp-bgcjgpgfbbfddmb6.southeastasia-01.azurewebsites.net;";
    context.Response.Headers["Referrer-Policy"] = "same-origin";

    await next();
});

// Use the properly configured CORS policy (replaces the dangerous "BULLETPROOF" middleware)
app.UseCors("AllowFrontend");

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Aquenta API v1");
    // Removed c.RoutePrefix = string.Empty; to avoid root conflict
});

// 3. JWT AUTHENTICATION MIDDLEWARE
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.ToLower() ?? "";
    
    // Define public endpoints that don't need a token
    var publicPaths = new[] { 
        "user/login", 
        "user/forgot-password", 
        "user/reset-password",
        "contact",
        "health",
        "swagger"
    };

    if (publicPaths.Any(p => path.Contains(p.ToLower())))
    {
        await next();
        return;
    }

    // Check for Authorization header
    var authHeader = context.Request.Headers["Authorization"].ToString();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsync("Unauthorized: No token provided.");
        return;
    }

    var token = authHeader.Substring("Bearer ".Length).Trim();
    var tokenService = new TokenService();
    var (userId, role, isValid) = tokenService.ValidateToken(token);

    if (!isValid)
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsync("Unauthorized: Invalid or expired token.");
        return;
    }

    // Add user info to context for controllers to use if needed
    context.Items["UserId"] = userId;
    context.Items["UserRole"] = role;

    await next();
});

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/error");
}

app.UseRouting();
app.UseAuthorization();

// Explicitly map controllers with a fallback to ensure routes are found
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

SeedMissingMonthlyPeriods();

app.Run();

void SeedMissingMonthlyPeriods()
{
    try
    {
        var periodServices = new PeriodServices();
        var periods = periodServices.GetAll()
            .Where(p => p != null)
            .OrderBy(p => p.PeriodStart)
            .ToList();

        var existingMonths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var period in periods)
        {
            var monthStart = new DateTime(period.PeriodStart.Year, period.PeriodStart.Month, 1);
            existingMonths.Add(monthStart.ToString("yyyy-MM"));
        }

        var today = DateTime.Today;
        var currentMonthStart = new DateTime(today.Year, today.Month, 1);

        DateTime nextMonthToCreate;
        if (periods.Count == 0)
        {
            nextMonthToCreate = currentMonthStart;
        }
        else
        {
            var latestStart = periods
                .Select(p => new DateTime(p.PeriodStart.Year, p.PeriodStart.Month, 1))
                .Max();

            nextMonthToCreate = latestStart.AddMonths(1);
        }

        for (var month = nextMonthToCreate; month <= currentMonthStart; month = month.AddMonths(1))
        {
            var monthKey = month.ToString("yyyy-MM");
            if (existingMonths.Contains(monthKey))
            {
                continue;
            }

            var monthEnd = month.AddMonths(1).AddDays(-1);
            periodServices.Add(new PeriodModel
            {
                PeriodStart = month,
                PeriodEnd = monthEnd,
            });

            existingMonths.Add(monthKey);
        }
    }
    catch
    {
    }
}
