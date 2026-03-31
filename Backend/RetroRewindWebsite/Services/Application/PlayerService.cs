using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Repositories.Player;

namespace RetroRewindWebsite.Services.Application;

public class PlayerService : IPlayerService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IVRHistoryRepository _vrHistoryRepository;
    private readonly ILogger<PlayerService> _logger;

    public PlayerService(
        IPlayerRepository playerRepository,
        IVRHistoryRepository vrHistoryRepository,
        ILogger<PlayerService> logger)
    {
        _playerRepository = playerRepository;
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
        List<Models.Entities.Player.VRHistoryEntity> history;
        DateTime fromDate;

        if (days.HasValue)
        {
            fromDate = toDate.AddDays(-days.Value);
            history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, fromDate, toDate);
        }
        else
        {
            history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, int.MaxValue);
            fromDate = history.Count > 0 ? history.Min(h => h.Date) : toDate;
        }

        var historyDtos = history
            .Select(h => new VRHistoryDto(h.Date, h.VRChange, h.TotalVR))
            .OrderBy(h => h.Date)
            .ToList();

        var startingVR = historyDtos.Count > 0
            ? historyDtos.First().TotalVR - historyDtos.First().VRChange
            : player.Ev;
        var endingVR = historyDtos.Count > 0
            ? historyDtos.Last().TotalVR
            : player.Ev;

        if (historyDtos.Count > 0)
        {
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
            .Select(h => new VRHistoryDto(h.Date, h.VRChange, h.TotalVR))
            .OrderBy(h => h.Date)];
    }

    public async Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode)
    {
        var legacyPlayer = await _playerRepository.GetLegacyPlayerByFriendCodeAsync(friendCode);
        return legacyPlayer != null ? PlayerMapper.FromLegacy(legacyPlayer) : null;
    }
}
