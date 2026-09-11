using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Repositories.Player;

namespace RetroRewindWebsite.Services.Application;

/// <summary>
/// Provides player lookup, profile retrieval, and VR history queries for the leaderboard.
/// </summary>
public class PlayerService : IPlayerService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly ILegacyPlayerRepository _legacyPlayerRepository;
    private readonly IVRHistoryRepository _vrHistoryRepository;
    private readonly ILogger<PlayerService> _logger;

    public PlayerService(
        IPlayerRepository playerRepository,
        ILegacyPlayerRepository legacyPlayerRepository,
        IVRHistoryRepository vrHistoryRepository,
        ILogger<PlayerService> logger)
    {
        _playerRepository = playerRepository;
        _legacyPlayerRepository = legacyPlayerRepository;
        _vrHistoryRepository = vrHistoryRepository;
        _logger = logger;
    }

    public async Task<PlayerDto?> GetPlayerAsync(string fc)
    {
        var player = await _playerRepository.GetByFcAsync(fc);
        return player != null ? PlayerMapper.ToDto(player) : null;
    }

    public async Task<VRHistoryRangeResponseDto?> GetPlayerHistoryAsync(string fc, int? days)
    {
        var player = await _playerRepository.GetByFcAsync(fc);
        if (player == null)
            return null;

        var toDate = DateTime.UtcNow;
        var fromDate = days.HasValue ? toDate.AddDays(-days.Value) : DateTime.MinValue;

        var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, fromDate, toDate);

        // No window requested: report the range actually covered rather than DateTime.MinValue.
        if (!days.HasValue)
            fromDate = history.Count > 0 ? history.Min(h => h.Date) : toDate;

        return BuildHistoryRange(player, history, fromDate, toDate);
    }

    public async Task<VRHistoryRangeResponseDto?> GetPlayerHistoryAsync(string fc, DateTime from, DateTime to)
    {
        var player = await _playerRepository.GetByFcAsync(fc);
        if (player == null)
            return null;

        var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, from, to);

        return BuildHistoryRange(player, history, from, to);
    }

    /// <summary>
    /// Shared tail of the two history overloads, which differ only in how they arrive at their date
    /// range. Everything from here on was duplicated between them, minus the comments, which only
    /// one copy carried.
    /// </summary>
    private static VRHistoryRangeResponseDto BuildHistoryRange(
        PlayerEntity player,
        List<VRHistoryEntity> history,
        DateTime fromDate,
        DateTime toDate)
    {
        var historyDtos = history
            .Select(PlayerMapper.ToVRHistoryDto)
            .OrderBy(h => h.Date)
            .ToList();

        // Each history entry stores the VR *after* the change, so the VR *before* the first entry
        // is TotalVR - VRChange (i.e. what the player had before that race session).
        var startingVR = historyDtos.Count > 0
            ? historyDtos.First().TotalVR - historyDtos.First().VRChange
            : player.Ev;
        var endingVR = historyDtos.Count > 0
            ? historyDtos.Last().TotalVR
            : player.Ev;

        if (historyDtos.Count > 0)
        {
            // Prepend a zero-change anchor point one second before the first real entry so the
            // frontend chart starts from the correct baseline VR rather than jumping from zero.
            var initialEntry = new VRHistoryDto(
                Date: historyDtos.First().Date.AddSeconds(-1),
                VRChange: 0,
                TotalVR: startingVR
            );
            historyDtos.Insert(0, initialEntry);
        }

        return new VRHistoryRangeResponseDto(
            PlayerId: player.Pid,
            FromDate: fromDate,
            ToDate: toDate,
            History: historyDtos,
            TotalVRChange: endingVR - startingVR,
            StartingVR: startingVR,
            EndingVR: endingVR
        );
    }

    public async Task<List<VRHistoryDto>?> GetPlayerRecentHistoryAsync(string fc, int count)
    {
        var player = await _playerRepository.GetByFcAsync(fc);
        if (player == null)
            return null;

        var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, count);

        return [.. history
            .Select(PlayerMapper.ToVRHistoryDto)
            .OrderBy(h => h.Date)];
    }

    public async Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode)
    {
        var legacyPlayer = await _legacyPlayerRepository.GetLegacyPlayerByFriendCodeAsync(friendCode);
        return legacyPlayer != null ? PlayerMapper.FromLegacy(legacyPlayer) : null;
    }

    public async Task<PlayerMiiDownloadDto?> GetPlayerMiiDownloadAsync(string fc)
    {
        var player = await _playerRepository.GetByFcAsync(fc);
        return player != null ? PlayerMapper.ToMiiDownloadDto(player) : null;
    }
}
