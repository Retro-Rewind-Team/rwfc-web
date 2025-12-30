using Microsoft.AspNetCore.Mvc;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<DiagnosticsController> _logger;

        public DiagnosticsController(IHttpClientFactory httpClientFactory, ILogger<DiagnosticsController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        [HttpGet("test-mii-connection")]
        public async Task<IActionResult> TestMiiConnection()
        {
            var results = new Dictionary<string, object>();
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);

            // Test 1: Simple GET to RC24
            try
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();
                var response = await httpClient.GetAsync("https://miicontestp.wii.rc24.xyz/");
                sw.Stop();

                results["rc24_get"] = new
                {
                    success = true,
                    statusCode = (int)response.StatusCode,
                    durationMs = sw.ElapsedMilliseconds
                };
            }
            catch (Exception ex)
            {
                results["rc24_get"] = new
                {
                    success = false,
                    error = ex.Message,
                    type = ex.GetType().Name
                };
            }

            // Test 2: POST with minimal data
            try
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();
                using var content = new MultipartFormDataContent();
                var dummyData = new ByteArrayContent(new byte[76]); // Mii data is 76 bytes
                content.Add(dummyData, "data", "mii.dat");
                content.Add(new StringContent("wii"), "platform");

                var response = await httpClient.PostAsync("https://miicontestp.wii.rc24.xyz/cgi-bin/studio.cgi", content);
                sw.Stop();

                results["rc24_post"] = new
                {
                    success = true,
                    statusCode = (int)response.StatusCode,
                    durationMs = sw.ElapsedMilliseconds
                };
            }
            catch (Exception ex)
            {
                results["rc24_post"] = new
                {
                    success = false,
                    error = ex.Message,
                    type = ex.GetType().Name,
                    stackTrace = ex.StackTrace
                };
            }

            // Test 3: Check DNS
            try
            {
                var addresses = await System.Net.Dns.GetHostAddressesAsync("miicontestp.wii.rc24.xyz");
                results["dns"] = new
                {
                    success = true,
                    addresses = addresses.Select(a => a.ToString()).ToArray()
                };
            }
            catch (Exception ex)
            {
                results["dns"] = new
                {
                    success = false,
                    error = ex.Message
                };
            }

            return Ok(results);
        }
    }
}