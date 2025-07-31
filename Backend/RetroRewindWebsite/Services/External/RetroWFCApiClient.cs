using Newtonsoft.Json;
using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Services.External
{
    public class RetroWFCApiClient : IRetroWFCApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<RetroWFCApiClient> _logger;
        private const string ApiUrl = "http://rwfc.net/api/groups";
        private List<Group>? _cachedResponse;
        private DateTime _cachedTimestamp = DateTime.MinValue;

        public RetroWFCApiClient(HttpClient httpClient, ILogger<RetroWFCApiClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<List<Group>> GetActiveGroupsAsync()
        {
            try
            {
                if (_cachedResponse != null && _cachedTimestamp - DateTime.Now < new TimeSpan(0, minutes: 1, 0))
                {
                    _logger.LogDebug("Returning cached groups ({}) from Retro WFC API", _cachedTimestamp);
                    return _cachedResponse;
                }

                _logger.LogDebug("Fetching active groups from Retro WFC API");

                var response = await _httpClient.GetStringAsync(ApiUrl);
                var groups = JsonConvert.DeserializeObject<List<Group>>(response);

                if (groups == null)
                {
                    _logger.LogWarning("Received null response from Retro WFC API");
                    return [];
                }

                _logger.LogDebug("Successfully fetched {GroupCount} groups from API", groups.Count);
                _cachedResponse = groups;
                _cachedTimestamp = DateTime.Now;
                return groups;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while fetching groups from Retro WFC API");
                throw new InvalidOperationException("Failed to connect to Retro WFC API", ex);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON deserialization error while parsing Retro WFC API response");
                throw new InvalidOperationException("Invalid response format from Retro WFC API", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while fetching groups from Retro WFC API");
                throw;
            }
        }
    }
}
