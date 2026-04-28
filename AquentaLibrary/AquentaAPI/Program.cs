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
    // Apply no-cache headers to all responses
    context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate";
    context.Response.Headers["Pragma"] = "no-cache";
    context.Response.Headers["Expires"] = "0";

    await next();
});

// Use the properly configured CORS policy (replaces the dangerous "BULLETPROOF" middleware)
app.UseCors("AllowFrontend");

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Aquenta API v1");
    c.RoutePrefix = string.Empty;
});

// 3. JWT AUTHENTICATION MIDDLEWARE
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.ToLower() ?? "";
    
    // Define public endpoints that don't need a token
    var publicPaths = new[] { 
        "/api/user/login", 
        "/api/user/forgot-password", 
        "/api/user/reset-password",
        "/api/contact",
        "/health",
        "/swagger"
    };

    if (publicPaths.Any(p => path.Contains(p)))
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
app.MapControllers();

app.MapGet("/health", () =>
{
    try
    {
        var connectionString = AquentaLibrary.Repositories.SqlConnectionResolver.GetWorkingConnectionString();
        // Hide sensitive parts of connection string for safety, but show the server
        var displayString = connectionString.Split(';')[0];
        return Results.Ok(new { Status = "Healthy", Database = "Connected", Info = displayString });
    }
    catch (Exception ex)
    {
        var message = ex.Message;
        if (ex.InnerException != null)
        {
            message += " Details: " + ex.InnerException.Message;
        }
        return Results.Problem(detail: message, title: "Database Connection Failed");
    }
});

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
