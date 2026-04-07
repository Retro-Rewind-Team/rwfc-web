using RetroRewindWebsite.Models.External;
using System.Text.Json;

namespace RetroRewindWebsite.Services.External;

public class RetroWFCApiClient : IRetroWFCApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RetroWFCApiClient> _logger;

    private const string GroupsApiUrl = "http://rwfc.net/api/groups";
    private const string RaceResultsApiUrl = "http://rwfc.net/api/mkw_rr?id=";

    private static readonly JsonSerializerOptions JsonOptions = new()
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

            var response = await _httpClient.GetStringAsync(GroupsApiUrl);
            var groups = JsonSerializer.Deserialize<List<Group>>(response, JsonOptions);

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

            var response = await _httpClient.GetStringAsync($"{RaceResultsApiUrl}{roomId}");
            var raceResponse = JsonSerializer.Deserialize<RoomRaceResponse>(response, JsonOptions);

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
}
