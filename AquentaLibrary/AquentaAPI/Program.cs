using AquentaLibrary.Models;
using AquentaLibrary.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                origin.EndsWith(".azurestaticapps.net") ||
                origin.Contains("localhost"))
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<EmailService>();

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

// 2. BULLETPROOF CORS (Handles Custom Domains)
app.Use(async (context, next) =>
{
    var origin = context.Request.Headers["Origin"].ToString();
    if (!string.IsNullOrEmpty(origin))
    {
        context.Response.Headers["Access-Control-Allow-Origin"] = origin;
        context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With";
    }

    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        return;
    }

    await next();
});

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Aquenta API v1");
    c.RoutePrefix = string.Empty;
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
