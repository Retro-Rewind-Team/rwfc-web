using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;

namespace RetroRewindWebsite.Services.Domain
{
    public class MiiService : IMiiService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly MemoryCacheEntryOptions _cacheOptions;
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
        private readonly ILogger<MiiService> _logger;

        public MiiService(IHttpClientFactory httpClientFactory, IMemoryCache memoryCache, ILogger<MiiService> logger)
        {
            _httpClient = httpClientFactory.CreateClient();
            _cache = memoryCache;
            _logger = logger;
            _cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(30))
                .SetAbsoluteExpiration(TimeSpan.FromHours(1))
                .SetSize(1);
        }

        public async Task<string?> GetMiiImageAsync(string friendCode, string miiData)
        {
            if (string.IsNullOrEmpty(friendCode) || string.IsNullOrEmpty(miiData))
                return null;

            // Check cache first
            if (_cache.TryGetValue(friendCode, out string? cachedMiiImage))
            {
                return cachedMiiImage;
            }

            // Use a semaphore to prevent multiple simultaneous requests for the same Mii
            var semaphore = _locks.GetOrAdd(friendCode, _ => new SemaphoreSlim(1, 1));

            try
            {
                await semaphore.WaitAsync();

                // Double-check cache after acquiring lock
                if (_cache.TryGetValue(friendCode, out cachedMiiImage))
                {
                    return cachedMiiImage;
                }

                // Create the multipart form data
                using var content = new MultipartFormDataContent();
                var fileContent = new ByteArrayContent(Convert.FromBase64String(miiData));
                content.Add(fileContent, "data", "mii.dat");
                content.Add(new StringContent("wii"), "platform");

                // Post to the Mii studio service
                var response = await _httpClient.PostAsync("http://miicontestp.wii.rc24.xyz/cgi-bin/studio.cgi", content);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Bad response from miicontestp.wii.rc24.xyz: {StatusCode}", response.StatusCode);
                    return null;
                }

                var jsonResponse = await response.Content.ReadFromJsonAsync<MiiResponse>();

                if (jsonResponse?.Mii == null)
                {
                    _logger.LogWarning("Malformed JSON response from Mii service");
                    return null;
                }

                // Get the image from Nintendo
                var miiImageUrl = $"https://studio.mii.nintendo.com/miis/image.png?data={jsonResponse.Mii}&type=face&expression=normal&width=270&bgColor=FFFFFF00";

                var imageResponse = await _httpClient.GetAsync(miiImageUrl);
                if (!imageResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get image from Nintendo: {StatusCode}", imageResponse.StatusCode);
                    return null;
                }

                var imageBytes = await imageResponse.Content.ReadAsByteArrayAsync();
                var base64Image = Convert.ToBase64String(imageBytes);

                // Cache the result
                _cache.Set(friendCode, base64Image, _cacheOptions);

                return base64Image;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error fetching Mii for {FriendCode}", friendCode);
                return null;
            }
            finally
            {
                semaphore.Release();

                // Clean up the lock if no one else is waiting
                if (semaphore.CurrentCount == 1)
                {
                    _locks.TryRemove(friendCode, out _);
                }
            }
        }

        private class MiiResponse
        {
            public string? Mii { get; set; }
        }
    }
}
