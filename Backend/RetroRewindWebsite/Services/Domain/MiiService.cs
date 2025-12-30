using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;

namespace RetroRewindWebsite.Services.Domain
{
    public class MiiService : IMiiService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;
        private readonly MemoryCacheEntryOptions _cacheOptions;
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
        private readonly ILogger<MiiService> _logger;

        private static readonly SemaphoreSlim _rc24Semaphore = new SemaphoreSlim(5, 5);

        public MiiService(IHttpClientFactory httpClientFactory, IMemoryCache memoryCache, ILogger<MiiService> logger)
        {
            _httpClientFactory = httpClientFactory;
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

            if (_cache.TryGetValue(friendCode, out string? cachedMiiImage))
            {
                return cachedMiiImage;
            }

            var semaphore = _locks.GetOrAdd(friendCode, _ => new SemaphoreSlim(1, 1));

            try
            {
                await semaphore.WaitAsync();

                if (_cache.TryGetValue(friendCode, out cachedMiiImage))
                {
                    return cachedMiiImage;
                }

                _logger.LogInformation("Waiting for RC24 slot for {FriendCode}", friendCode);
                await _rc24Semaphore.WaitAsync();

                try
                {
                    _logger.LogInformation("Got RC24 slot for {FriendCode}, sending request", friendCode);

                    using var httpClient = _httpClientFactory.CreateClient();
                    httpClient.Timeout = TimeSpan.FromSeconds(30);

                    using var content = new MultipartFormDataContent();
                    var fileContent = new ByteArrayContent(Convert.FromBase64String(miiData));
                    content.Add(fileContent, "data", "mii.dat");
                    content.Add(new StringContent("wii"), "platform");

                    var response = await httpClient.PostAsync("https://miicontestp.wii.rc24.xyz/cgi-bin/studio.cgi", content);

                    _logger.LogInformation("Received RC24 response for {FriendCode}: {StatusCode}", friendCode, response.StatusCode);

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

                    var miiImageUrl = $"https://studio.mii.nintendo.com/miis/image.png?data={jsonResponse.Mii}&type=face&expression=normal&width=270&bgColor=FFFFFF00";

                    var imageResponse = await httpClient.GetAsync(miiImageUrl);
                    if (!imageResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Failed to get image from Nintendo: {StatusCode}", imageResponse.StatusCode);
                        return null;
                    }

                    var imageBytes = await imageResponse.Content.ReadAsByteArrayAsync();
                    var base64Image = Convert.ToBase64String(imageBytes);

                    _cache.Set(friendCode, base64Image, _cacheOptions);

                    _logger.LogInformation("Successfully fetched and cached Mii for {FriendCode}", friendCode);

                    return base64Image;
                }
                finally
                {
                    _rc24Semaphore.Release();
                    _logger.LogInformation("Released RC24 slot for {FriendCode}", friendCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error fetching Mii for {FriendCode}", friendCode);
                return null;
            }
            finally
            {
                semaphore.Release();

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