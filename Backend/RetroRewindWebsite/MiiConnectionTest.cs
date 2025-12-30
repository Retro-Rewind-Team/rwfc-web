namespace RetroRewindWebsite
{
    using System.Diagnostics;
    using System.Net;
    using System.Net.Sockets;

    public class MiiConnectionTest
    {
        public static async Task RunAllTests()
        {
            Console.WriteLine("=== MII SERVICE CONNECTION DIAGNOSTICS ===\n");

            // Test 1: DNS Resolution
            await TestDNS();

            // Test 2: Raw TCP connection
            await TestTcpConnection();

            // Test 3: Basic HTTPS GET
            await TestHttpsGet();

            // Test 4: Actual POST with multipart form data (simulates your MiiService)
            await TestActualMiiPost();

            // Test 5: HTTP/1.1 vs HTTP/2
            await TestHttp11VsHttp2();

            Console.WriteLine("\n=== TESTS COMPLETE ===");
        }

        private static async Task TestDNS()
        {
            Console.WriteLine("TEST 1: DNS Resolution");
            try
            {
                var sw = Stopwatch.StartNew();
                var hostEntry = await Dns.GetHostEntryAsync("miicontestp.wii.rc24.xyz");
                Console.WriteLine($"  ✓ Resolved in {sw.ElapsedMilliseconds}ms");
                Console.WriteLine($"    Hostname: {hostEntry.HostName}");
                foreach (var ip in hostEntry.AddressList)
                {
                    Console.WriteLine($"    IP: {ip} ({ip.AddressFamily})");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ✗ Failed: {ex.Message}");
            }
            Console.WriteLine();
        }

        private static async Task TestTcpConnection()
        {
            Console.WriteLine("TEST 2: Raw TCP Connection to port 443");
            try
            {
                var addresses = await Dns.GetHostAddressesAsync("miicontestp.wii.rc24.xyz");
                var ipv4 = addresses.FirstOrDefault(a => a.AddressFamily == AddressFamily.InterNetwork);

                if (ipv4 == null)
                {
                    Console.WriteLine("  ✗ No IPv4 address found");
                    return;
                }

                Console.WriteLine($"  Connecting to {ipv4}:443...");

                using var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
                socket.SendTimeout = 10000;
                socket.ReceiveTimeout = 10000;

                var sw = Stopwatch.StartNew();
                await socket.ConnectAsync(ipv4, 443);
                Console.WriteLine($"  ✓ TCP connection established in {sw.ElapsedMilliseconds}ms");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ✗ Failed: {ex.Message}");
            }
            Console.WriteLine();
        }

        private static async Task TestHttpsGet()
        {
            Console.WriteLine("TEST 3: HTTPS GET Request");
            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(10);

                var sw = Stopwatch.StartNew();
                Console.WriteLine("  Sending GET request...");

                var response = await httpClient.GetAsync("https://miicontestp.wii.rc24.xyz/");

                Console.WriteLine($"  ✓ Response: {response.StatusCode} in {sw.ElapsedMilliseconds}ms");
            }
            catch (TaskCanceledException)
            {
                Console.WriteLine($"  ✗ Timeout after 10 seconds");
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"  ✗ HTTP Error: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"    Inner: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ✗ Error: {ex.GetType().Name}: {ex.Message}");
            }
            Console.WriteLine();
        }

        private static async Task TestActualMiiPost()
        {
            Console.WriteLine("TEST 4: Actual POST with Multipart Form Data (Your Exact Code)");

            // Use a dummy Mii data - this is just base64 encoded dummy data
            var dummyMiiData = Convert.ToBase64String(new byte[96]); // Mii data is typically 96 bytes

            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(10);

                var sw = Stopwatch.StartNew();

                Console.WriteLine($"  Creating multipart form content... ({sw.ElapsedMilliseconds}ms)");
                using var content = new MultipartFormDataContent();
                var fileContent = new ByteArrayContent(Convert.FromBase64String(dummyMiiData));
                content.Add(fileContent, "data", "mii.dat");
                content.Add(new StringContent("wii"), "platform");

                Console.WriteLine($"  Sending POST request... ({sw.ElapsedMilliseconds}ms)");

                var response = await httpClient.PostAsync("https://miicontestp.wii.rc24.xyz/cgi-bin/studio.cgi", content);

                Console.WriteLine($"  ✓ Response: {response.StatusCode} in {sw.ElapsedMilliseconds}ms");

                var responseBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"  Response length: {responseBody.Length} characters");
                Console.WriteLine($"  First 200 chars: {responseBody[..Math.Min(200, responseBody.Length)]}");
            }
            catch (TaskCanceledException)
            {
                Console.WriteLine($"  ✗ TIMEOUT after 10 seconds - THIS IS YOUR PRODUCTION ISSUE");
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"  ✗ HTTP Error: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"    Inner: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ✗ Error: {ex.GetType().Name}: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"    Inner: {ex.InnerException.Message}");
                }
            }
            Console.WriteLine();
        }

        private static async Task TestHttp11VsHttp2()
        {
            Console.WriteLine("TEST 5: HTTP/1.1 vs HTTP/2");

            // Test with HTTP/1.1
            Console.WriteLine("  Testing with HTTP/1.1...");
            var handler1 = new SocketsHttpHandler();
            using var client1 = new HttpClient(handler1);
            client1.DefaultRequestVersion = new Version(1, 1);
            client1.DefaultVersionPolicy = HttpVersionPolicy.RequestVersionExact;
            client1.Timeout = TimeSpan.FromSeconds(10);

            try
            {
                var sw = Stopwatch.StartNew();
                var response = await client1.GetAsync("https://miicontestp.wii.rc24.xyz/");
                Console.WriteLine($"    ✓ HTTP/1.1: {response.StatusCode} in {sw.ElapsedMilliseconds}ms (Version: {response.Version})");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    ✗ HTTP/1.1 Failed: {ex.Message}");
            }

            // Test with HTTP/2
            Console.WriteLine("  Testing with HTTP/2...");
            var handler2 = new SocketsHttpHandler();
            using var client2 = new HttpClient(handler2);
            client2.DefaultRequestVersion = new Version(2, 0);
            client2.DefaultVersionPolicy = HttpVersionPolicy.RequestVersionExact;
            client2.Timeout = TimeSpan.FromSeconds(10);

            try
            {
                var sw = Stopwatch.StartNew();
                var response = await client2.GetAsync("https://miicontestp.wii.rc24.xyz/");
                Console.WriteLine($"    ✓ HTTP/2: {response.StatusCode} in {sw.ElapsedMilliseconds}ms (Version: {response.Version})");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    ✗ HTTP/2 Failed: {ex.Message}");
            }

            Console.WriteLine();
        }
    }
}