using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DownloadController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<DownloadController> _logger;

        // Whitelist of allowed files to prevent abuse
        private static readonly Dictionary<string, (string Url, string FileName)> AllowedFiles = new()
        {
            { "full", ("http://update.rwfc.net:8000/RetroRewind/zip/RetroRewind.zip", "RetroRewind.zip") },
            { "update", ("http://update.rwfc.net:8000/RetroRewind/zip/6.5.6.zip", "RetroRewind-6.5.6.zip") }
        };

        public DownloadController(IHttpClientFactory httpClientFactory, ILogger<DownloadController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        [HttpGet("{fileKey}")]
        [EnableRateLimiting("DownloadPolicy")]
        public async Task<IActionResult> ProxyDownload(string fileKey)
        {
            // Validate the file key
            if (!AllowedFiles.TryGetValue(fileKey.ToLowerInvariant(), out var fileInfo))
            {
                _logger.LogWarning("Invalid download file key requested: {FileKey}", fileKey);
                return NotFound("File not found");
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromMinutes(10); // Large files need time

                _logger.LogInformation("Proxying download for {FileKey} from {Url}", fileKey, fileInfo.Url);

                // Stream the file directly to avoid loading it all into memory
                var response = await httpClient.GetAsync(fileInfo.Url, HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to fetch file from external server: {StatusCode}", response.StatusCode);
                    return StatusCode((int)response.StatusCode, "Failed to fetch file from download server");
                }

                // Get content type from source or default to zip
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/zip";

                // Stream the response directly to the client
                var stream = await response.Content.ReadAsStreamAsync();

                return File(stream, contentType, fileInfo.FileName);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error proxying download for {FileKey}", fileKey);
                return StatusCode(502, "Unable to reach download server");
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Timeout proxying download for {FileKey}", fileKey);
                return StatusCode(504, "Download server timeout");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error proxying download for {FileKey}", fileKey);
                return StatusCode(500, "Error downloading file");
            }
        }
    }
}