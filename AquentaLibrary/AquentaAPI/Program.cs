using AquentaLibrary.Models;
using AquentaLibrary.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. SERVICES
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
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 2. MIDDLEWARE PIPELINE
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Aquenta API v1");
    c.RoutePrefix = string.Empty; 
});

// Security & Diagnostics
app.Use(async (context, next) =>
{
    context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
    context.Response.Headers["Pragma"] = "no-cache";
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
app.UseCors("AllowFrontend");
app.UseAuthorization();

// 3. ENDPOINTS
app.MapControllers();

app.MapGet("/health", () => 
{
    try 
    {
        var connectionString = AquentaLibrary.Repositories.SqlConnectionResolver.GetWorkingConnectionString();
        if (string.IsNullOrWhiteSpace(connectionString)) return Results.Problem("Missing AQUENTA_SQL_CONNECTION", title: "Config Error");
        
        return Results.Ok(new { Status = "Healthy", Database = "Connected", Environment = app.Environment.EnvironmentName });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, title: "Database Connection Failed");
    }
});

SeedMissingMonthlyPeriods();

app.Run();

void SeedMissingMonthlyPeriods()
{
    try
    {
        var periodServices = new PeriodServices();
        var periods = periodServices.GetAll().Where(p => p != null).OrderBy(p => p.PeriodStart).ToList();
        var existingMonths = new HashSet<string>(periods.Select(p => p.PeriodStart.ToString("yyyy-MM")));
        
        var currentMonthStart = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        DateTime nextMonth = periods.Count == 0 ? currentMonthStart : periods.Max(p => p.PeriodStart).AddMonths(1);

        for (var m = nextMonth; m <= currentMonthStart; m = m.AddMonths(1))
        {
            if (existingMonths.Contains(m.ToString("yyyy-MM"))) continue;
            periodServices.Add(new PeriodModel { PeriodStart = m, PeriodEnd = m.AddMonths(1).AddDays(-1) });
        }
    }
    catch { /* Ignore seed errors on startup */ }
}
