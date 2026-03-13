using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Leaderboard;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Repositories.Player;

namespace RetroRewindWebsite.Services.Application;

public class LeaderboardService : ILeaderboardService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly ILogger<LeaderboardService> _logger;

    public LeaderboardService(
        IPlayerRepository playerRepository,
        ILogger<LeaderboardService> logger)
    {
        _playerRepository = playerRepository;
        _logger = logger;
    }

    public async Task<LeaderboardResponseDto> GetLeaderboardAsync(LeaderboardRequest request)
    {
        var pagedResult = await _playerRepository.GetLeaderboardPageAsync(
            request.Page,
            request.PageSize,
            request.Search,
            request.SortBy,
            request.Ascending);

        var stats = await GetStatsAsync();
        var playerDtos = pagedResult.Items.Select(PlayerMapper.ToDto).ToList();

        return new LeaderboardResponseDto(
            Players: playerDtos,
            CurrentPage: pagedResult.CurrentPage,
            TotalPages: pagedResult.TotalPages,
            TotalCount: pagedResult.TotalCount,
            PageSize: pagedResult.PageSize,
            Stats: stats
        );
    }

    public async Task<List<PlayerDto>> GetTopPlayersAsync(int count)
    {
        var players = await _playerRepository.GetTopPlayersAsync(count);
        return [.. players.Select(PlayerMapper.ToDto)];
    }

    public async Task<List<PlayerDto>> GetTopPlayersNoMiiAsync(int count)
    {
        var players = await _playerRepository.GetTopPlayersAsync(count);
        return [.. players.Select(PlayerMapper.ToDtoWithoutMii)];
    }

    public async Task<List<PlayerDto>> GetTopVRGainersAsync(int count, string period)
    {
        var timeSpan = period.ToLower() switch
        {
            "24h" or "24" or "day" => TimeSpan.FromDays(1),
            "7d" or "week" => TimeSpan.FromDays(7),
            "30d" or "month" => TimeSpan.FromDays(30),
            _ => TimeSpan.FromDays(1)
        };

        var players = await _playerRepository.GetTopVRGainersAsync(count, timeSpan);
        return [.. players.Select(PlayerMapper.ToDtoWithoutMii)];
    }

    public async Task<LeaderboardStatsDto> GetStatsAsync()
    {
        var totalPlayers = await _playerRepository.GetTotalPlayersCountAsync();
        var suspiciousPlayers = await _playerRepository.GetSuspiciousPlayersCountAsync();

        return new LeaderboardStatsDto(
            TotalPlayers: totalPlayers,
            SuspiciousPlayers: suspiciousPlayers,
            LastUpdated: DateTime.UtcNow
        );
    }

    public async Task<bool> HasLegacySnapshotAsync() =>
        await _playerRepository.HasLegacySnapshotAsync();

    public async Task<LeaderboardResponseDto> GetLegacyLeaderboardAsync(LeaderboardRequest request)
    {
        var pagedResult = await _playerRepository.GetLegacyLeaderboardPageAsync(
            request.Page,
            request.PageSize,
            request.Search,
            request.SortBy,
            request.Ascending);

        var snapshotDate = pagedResult.Items.FirstOrDefault()?.SnapshotDate ?? DateTime.UtcNow;
        var playerDtos = pagedResult.Items.Select(PlayerMapper.FromLegacy).ToList();

        var totalPlayers = await _playerRepository.GetLegacyPlayersCountAsync();
        var suspiciousPlayers = await _playerRepository.GetLegacySuspiciousPlayersCountAsync();

        return new LeaderboardResponseDto(
            Players: playerDtos,
            CurrentPage: pagedResult.CurrentPage,
            TotalPages: pagedResult.TotalPages,
            TotalCount: pagedResult.TotalCount,
            PageSize: pagedResult.PageSize,
            Stats: new LeaderboardStatsDto(totalPlayers, suspiciousPlayers, snapshotDate)
        );
    }
}
