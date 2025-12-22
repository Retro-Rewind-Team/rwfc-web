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
            if (!AllowedFiles.TryGetValue(fileKey.ToLowerInvariant(), out var fileInfo))
            {
                _logger.LogWarning("Invalid download file key requested: {FileKey}", fileKey);
                return NotFound("File not found");
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromMinutes(10);

                // Check if client is requesting a range (resume)
                var rangeHeader = Request.Headers.Range;

                var request = new HttpRequestMessage(HttpMethod.Get, fileInfo.Url);
                if (rangeHeader.Count > 0)
                {
                    request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(
                        rangeHeader[0]!.Split('=')[1].Split('-')[0] != ""
                            ? long.Parse(rangeHeader[0]!.Split('=')[1].Split('-')[0])
                            : (long?)null,
                        rangeHeader[0]!.Split('-').Length > 1 && rangeHeader[0]!.Split('-')[1] != ""
                            ? long.Parse(rangeHeader[0]!.Split('-')[1])
                            : (long?)null
                    );
                    _logger.LogInformation("Range request for {FileKey}: {Range}", fileKey, rangeHeader[0]);
                }

                _logger.LogInformation("Proxying download for {FileKey} from {Url}", fileKey, fileInfo.Url);

                var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.PartialContent)
                {
                    _logger.LogError("Failed to fetch file from external server: {StatusCode}", response.StatusCode);
                    return StatusCode((int)response.StatusCode, "Failed to fetch file from download server");
                }

                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/zip";
                var contentLength = response.Content.Headers.ContentLength;

                Response.RegisterForDispose(response);

                // Copy all relevant headers
                if (contentLength.HasValue)
                {
                    Response.ContentLength = contentLength.Value;
                }

                Response.Headers.Append("Accept-Ranges", "bytes");
                Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{fileInfo.FileName}\"");

                // If upstream sent partial content, forward that status
                if (response.StatusCode == System.Net.HttpStatusCode.PartialContent)
                {
                    Response.StatusCode = 206;
                    if (response.Content.Headers.ContentRange != null)
                    {
                        Response.Headers.Append("Content-Range", response.Content.Headers.ContentRange.ToString());
                    }
                }

                var stream = await response.Content.ReadAsStreamAsync();

                return new FileStreamResult(stream, contentType)
                {
                    FileDownloadName = fileInfo.FileName,
                    EnableRangeProcessing = true
                };
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