using AquentaLibrary.Models;
using AquentaLibrary.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// SECURITY: Add cache control headers to prevent browser caching of protected content
app.Use(async (context, next) =>
{
    // Apply no-cache headers to all responses
    context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate";
    context.Response.Headers["Pragma"] = "no-cache";
    context.Response.Headers["Expires"] = "0";
    
    await next();
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

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
