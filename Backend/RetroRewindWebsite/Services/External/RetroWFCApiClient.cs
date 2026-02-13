using Newtonsoft.Json;
using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Services.External
{
    public class RetroWFCApiClient : IRetroWFCApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<RetroWFCApiClient> _logger;

        private const string ApiUrl = "http://rwfc.net/api/groups";

        public RetroWFCApiClient(HttpClient httpClient, ILogger<RetroWFCApiClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<List<Group>> GetActiveGroupsAsync()
        {
            try
            {
                _logger.LogDebug("Fetching active groups from Retro WFC API");

                var response = await _httpClient.GetStringAsync(ApiUrl);
                var groups = JsonConvert.DeserializeObject<List<Group>>(response);

                if (groups == null)
                {
                    _logger.LogWarning("Received null response from Retro WFC API");
                    return [];
                }

                _logger.LogDebug("Successfully fetched {GroupCount} groups from API", groups.Count);

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

        public async Task<Dictionary<int, List<RaceResult>>> GetRoomRaceResultsAsync(string roomId)
        {
            try
            {
                _logger.LogDebug("Fetching race results for room {RoomId}", roomId);

                var url = $"http://rwfc.net/api/mkw_rr?id={roomId}";
                var response = await _httpClient.GetStringAsync(url);

                var raceResponse = JsonConvert.DeserializeObject<RoomRaceResponse>(response);

                if (raceResponse?.Results == null || raceResponse.Results.Count == 0)
                {
                    _logger.LogWarning("Received null or empty response from race results API for room {RoomId}", roomId);
                    return [];
                }

                var resultsDict = new Dictionary<int, List<RaceResult>>();
                foreach (var kvp in raceResponse.Results)
                {
                    if (int.TryParse(kvp.Key, out int raceNumber))
                    {
                        resultsDict[raceNumber] = kvp.Value;
                    }
                }

                _logger.LogDebug("Successfully fetched results for {RaceCount} races from room {RoomId}",
                    resultsDict.Count, roomId);

                return resultsDict;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while fetching race results for room {RoomId}", roomId);
                return [];
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON deserialization error while parsing race results for room {RoomId}", roomId);
                return [];
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while fetching race results for room {RoomId}", roomId);
                return [];
            }
        }
    }
}