using RetroRewindWebsite.Models.External;
using System.Text.Json;

namespace RetroRewindWebsite.Services.External;

public class RetroWFCApiClient : IRetroWFCApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RetroWFCApiClient> _logger;

    private readonly string _groupsApiUrl = Environment.GetEnvironmentVariable("WFC_GROUPS_ENDPOINT")
        ?? "https://rwfc.net/api/wfc/groups";
    private readonly string _raceResultsApiUrl = Environment.GetEnvironmentVariable("WFC_RACE_RESULTS_ENDPOINT")
        ?? "https://rwfc.net/api/wfc/mkw_rr?id=";
    private readonly string _pcountApiUrl = Environment.GetEnvironmentVariable("WFC_PCOUNT_ENDPOINT")
        ?? "https://rwfc.net/api/wfc/pcount";

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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

            var response = await _httpClient.GetStringAsync(_groupsApiUrl);
            var groups = JsonSerializer.Deserialize<List<Group>>(response, _jsonOptions);

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
            return [];
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error while parsing Retro WFC API response");
            return [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching groups from Retro WFC API");
            return [];
        }
    }

    public async Task<Dictionary<int, List<RaceResult>>> GetRoomRaceResultsAsync(string roomId)
    {
        try
        {
            _logger.LogDebug("Fetching race results for room {RoomId}", roomId);

            var response = await _httpClient.GetStringAsync($"{_raceResultsApiUrl}{roomId}");
            var raceResponse = JsonSerializer.Deserialize<RoomRaceResponse>(response, _jsonOptions);

            if (raceResponse?.Results == null || raceResponse.Results.Count == 0)
            {
                _logger.LogWarning("Received null or empty response from race results API for room {RoomId}", roomId);
                return [];
            }

            // The API returns race numbers as string keys; convert to int for typed consumption
            var resultsDict = new Dictionary<int, List<RaceResult>>();
            foreach (var kvp in raceResponse.Results)
            {
                if (int.TryParse(kvp.Key, out int raceNumber))
                    resultsDict[raceNumber] = kvp.Value;
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

    public async Task<int?> GetPlayerCountAsync()
    {
        try
        {
            _logger.LogDebug("Fetching player count from Retro WFC API");

            var response = await _httpClient.GetStringAsync(_pcountApiUrl);
            var pcount = JsonSerializer.Deserialize<PCountResponse>(response, _jsonOptions);

            if (pcount is not { Success: true })
            {
                _logger.LogWarning("Received unsuccessful player count response from Retro WFC API: {Error}", pcount?.Error);
                return null;
            }

            return pcount.Count;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while fetching player count from Retro WFC API");
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error while parsing player count response");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching player count from Retro WFC API");
            return null;
        }
    }
}
