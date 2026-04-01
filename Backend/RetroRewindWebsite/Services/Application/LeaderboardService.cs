using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Leaderboard;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Repositories.Player;

namespace RetroRewindWebsite.Services.Application;

public class LeaderboardService : ILeaderboardService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly ILegacyPlayerRepository _legacyPlayerRepository;
    private readonly ILogger<LeaderboardService> _logger;

    public LeaderboardService(
        IPlayerRepository playerRepository,
        ILegacyPlayerRepository legacyPlayerRepository,
        ILogger<LeaderboardService> logger)
    {
        _playerRepository = playerRepository;
        _legacyPlayerRepository = legacyPlayerRepository;
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

    public async Task<LeaderboardInGameResponseDto> GetLeaderboardInGameAsync(int page)
    {
        var pagedResult = await _playerRepository.GetLeaderboardPageNoMiiAsync(page);
        var playerDtos = pagedResult.Items.Select(PlayerMapper.ToInGameDto).ToList();

        return new LeaderboardInGameResponseDto(
            Players: playerDtos,
            CurrentPage: pagedResult.CurrentPage,
            TotalPages: pagedResult.TotalPages,
            TotalCount: pagedResult.TotalCount
        );
    }

    public async Task<List<PlayerDto>> GetTopPlayersAsync(int count)
    {
        var players = await _playerRepository.GetTopPlayersAsync(count);
        return [.. players.Select(PlayerMapper.ToDto)];
    }

    public async Task<List<InGamePlayerDto>> GetTopPlayersInGameAsync(int count)
    {
        var players = await _playerRepository.GetTopPlayersAsync(count);
        return [.. players.Select(PlayerMapper.ToInGameDto)];
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
        await _legacyPlayerRepository.HasLegacySnapshotAsync();

    public async Task<LeaderboardResponseDto> GetLegacyLeaderboardAsync(LeaderboardRequest request)
    {
        var pagedResult = await _legacyPlayerRepository.GetLegacyLeaderboardPageAsync(
            request.Page,
            request.PageSize,
            request.Search,
            request.SortBy,
            request.Ascending);

        var snapshotDate = pagedResult.Items.FirstOrDefault()?.SnapshotDate ?? DateTime.UtcNow;
        var playerDtos = pagedResult.Items.Select(PlayerMapper.FromLegacy).ToList();

        var totalPlayers = await _legacyPlayerRepository.GetLegacyPlayersCountAsync();
        var suspiciousPlayers = await _legacyPlayerRepository.GetLegacySuspiciousPlayersCountAsync();

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
