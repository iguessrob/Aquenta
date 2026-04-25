using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AquentaAPI.Services
{
    public class KeepAliveService : BackgroundService
    {
        private readonly ILogger<KeepAliveService> _logger;
        private readonly HttpClient _httpClient;
        // Ping every 10 minutes to prevent the app pool from sleeping
        private readonly TimeSpan _pingInterval = TimeSpan.FromMinutes(10);
        // Default URL for local testing, will be updated based on environment if needed
        private readonly string _pingUrl;

        public KeepAliveService(ILogger<KeepAliveService> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient("KeepAliveClient");
            
            // Note: In Azure, you could read this from configuration (e.g. WEBSITE_HOSTNAME)
            // But calling localhost/health works inside the container/app service instance.
            // Some Azure environments might block localhost calls depending on configuration.
            // Using a relative URL or relying on a configured full URL is safer.
            // Let's use a default value but allow overriding via environment variables.
            var websiteHostname = Environment.GetEnvironmentVariable("WEBSITE_HOSTNAME");
            if (!string.IsNullOrEmpty(websiteHostname))
            {
                _pingUrl = $"https://{websiteHostname}/health";
            }
            else
            {
                _pingUrl = "http://localhost:5500/health"; // fallback for local
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation($"KeepAliveService started. Pinging {_pingUrl} every {_pingInterval.TotalMinutes} minutes.");

            // Wait a bit before first ping to allow application to fully start
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation($"[KeepAlive] Sending ping to {_pingUrl} at {DateTimeOffset.Now}");
                    
                    var response = await _httpClient.GetAsync(_pingUrl, stoppingToken);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation($"[KeepAlive] Ping successful. Status: {response.StatusCode}");
                    }
                    else
                    {
                        _logger.LogWarning($"[KeepAlive] Ping failed. Status: {response.StatusCode}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"[KeepAlive] Error during ping: {ex.Message}");
                }

                // Wait for the next interval
                await Task.Delay(_pingInterval, stoppingToken);
            }
        }
    }
}
