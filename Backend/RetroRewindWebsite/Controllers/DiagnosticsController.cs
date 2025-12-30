// Add this controller to your project
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;

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

        [HttpGet("rc24-connection")]
        public async Task<IActionResult> TestRC24Connection()
        {
            var results = new List<string>();
            results.Add($"=== RC24 CONNECTION DIAGNOSTICS ===");
            results.Add($"Time: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            results.Add($"Environment: {Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}");
            results.Add("");

            // Test 1: DNS
            results.Add("TEST 1: DNS Resolution");
            try
            {
                var sw = Stopwatch.StartNew();
                var hostEntry = await Dns.GetHostEntryAsync("miicontestp.wii.rc24.xyz");
                results.Add($"  ✓ Resolved in {sw.ElapsedMilliseconds}ms");
                results.Add($"    Hostname: {hostEntry.HostName}");
                foreach (var ip in hostEntry.AddressList)
                {
                    results.Add($"    IP: {ip} ({ip.AddressFamily})");
                }
            }
            catch (Exception ex)
            {
                results.Add($"  ✗ Failed: {ex.Message}");
            }
            results.Add("");

            // Test 2: TCP Connection
            results.Add("TEST 2: Raw TCP Connection");
            try
            {
                var addresses = await Dns.GetHostAddressesAsync("miicontestp.wii.rc24.xyz");
                var ipv4 = addresses.FirstOrDefault(a => a.AddressFamily == AddressFamily.InterNetwork);

                if (ipv4 != null)
                {
                    using var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
                    socket.SendTimeout = 5000;
                    socket.ReceiveTimeout = 5000;

                    var sw = Stopwatch.StartNew();
                    await socket.ConnectAsync(ipv4, 443);
                    results.Add($"  ✓ TCP connected to {ipv4}:443 in {sw.ElapsedMilliseconds}ms");
                }
                else
                {
                    results.Add($"  ✗ No IPv4 address found");
                }
            }
            catch (Exception ex)
            {
                results.Add($"  ✗ TCP Failed: {ex.Message}");
            }
            results.Add("");

            // Test 3: HTTPS GET
            results.Add("TEST 3: HTTPS GET");
            try
            {
                using var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(10);

                var sw = Stopwatch.StartNew();
                var response = await httpClient.GetAsync("https://miicontestp.wii.rc24.xyz/");
                results.Add($"  ✓ GET: {response.StatusCode} in {sw.ElapsedMilliseconds}ms");
                results.Add($"    HTTP Version: {response.Version}");
            }
            catch (TaskCanceledException)
            {
                results.Add($"  ✗ GET: Timeout after 10 seconds");
            }
            catch (Exception ex)
            {
                results.Add($"  ✗ GET Failed: {ex.GetType().Name}: {ex.Message}");
                if (ex.InnerException != null)
                    results.Add($"    Inner: {ex.InnerException.Message}");
            }
            results.Add("");

            // Test 4: Actual Mii POST
            results.Add("TEST 4: Mii POST (Multipart Form Data)");
            try
            {
                using var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(10);

                var sw = Stopwatch.StartNew();
                results.Add($"  Creating form content... ({sw.ElapsedMilliseconds}ms)");

                var dummyMiiData = Convert.ToBase64String(new byte[96]);
                using var content = new MultipartFormDataContent();
                var fileContent = new ByteArrayContent(Convert.FromBase64String(dummyMiiData));
                content.Add(fileContent, "data", "mii.dat");
                content.Add(new StringContent("wii"), "platform");

                results.Add($"  Sending POST... ({sw.ElapsedMilliseconds}ms)");
                var response = await httpClient.PostAsync("https://miicontestp.wii.rc24.xyz/cgi-bin/studio.cgi", content);

                results.Add($"  ✓ POST: {response.StatusCode} in {sw.ElapsedMilliseconds}ms");
                results.Add($"    HTTP Version: {response.Version}");

                var body = await response.Content.ReadAsStringAsync();
                results.Add($"    Response: {body.Substring(0, Math.Min(100, body.Length))}...");
            }
            catch (TaskCanceledException)
            {
                results.Add($"  ✗ POST: Timeout after 10 seconds - THIS IS THE ISSUE");
            }
            catch (Exception ex)
            {
                results.Add($"  ✗ POST Failed: {ex.GetType().Name}: {ex.Message}");
                if (ex.InnerException != null)
                    results.Add($"    Inner: {ex.InnerException.Message}");
            }
            results.Add("");

            // Test 5: Environment Info
            results.Add("TEST 5: Environment Info");
            results.Add($"  HTTP_PROXY: {Environment.GetEnvironmentVariable("HTTP_PROXY") ?? "not set"}");
            results.Add($"  HTTPS_PROXY: {Environment.GetEnvironmentVariable("HTTPS_PROXY") ?? "not set"}");
            results.Add($"  NO_PROXY: {Environment.GetEnvironmentVariable("NO_PROXY") ?? "not set"}");
            results.Add($"  DOTNET_SYSTEM_NET_HTTP_SOCKETSHTTPHANDLER_HTTP2SUPPORT: {Environment.GetEnvironmentVariable("DOTNET_SYSTEM_NET_HTTP_SOCKETSHTTPHANDLER_HTTP2SUPPORT") ?? "not set"}");
            results.Add("");

            results.Add("=== DIAGNOSTICS COMPLETE ===");

            return Ok(new
            {
                success = true,
                output = string.Join("\n", results),
                results = results
            });
        }
    }
}