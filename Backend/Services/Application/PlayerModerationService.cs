using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Repositories.Player;

namespace RetroRewindWebsite.Services.Application;

public class PlayerModerationService : IPlayerModerationService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IVRHistoryRepository _vrHistoryRepository;
    private readonly ILogger<PlayerModerationService> _logger;

    private const int SuspiciousJumpThreshold = 529; // Matches PlayerValidationService.MaxVRJumpPerRace

    public PlayerModerationService(
        IPlayerRepository playerRepository,
        IVRHistoryRepository vrHistoryRepository,
        ILogger<PlayerModerationService> logger)
    {
        _playerRepository = playerRepository;
        _vrHistoryRepository = vrHistoryRepository;
        _logger = logger;
    }

    public async Task<ModerationActionResultDto?> FlagPlayerAsync(string pid, string reason)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        if (player.IsSuspicious)
        {
            return new ModerationActionResultDto(
                true,
                $"Player '{player.Name}' is already flagged as suspicious. Reason: '{reason}'"
            );
        }

        player.IsSuspicious = true;
        player.FlagReason = reason;
        await _playerRepository.UpdateAsync(player);

        _logger.LogWarning(
            "Player flagged: {Name} ({FriendCode}) - PID: {Pid} - Reason: {Reason}",
            player.Name, player.Fc, player.Pid, player.FlagReason);

        return new ModerationActionResultDto(
            true,
            $"Player '{player.Name}' has been flagged as suspicious, reason: '{player.FlagReason}'",
            PlayerMapper.ToDto(player)
        );
    }

    public async Task<ModerationActionResultDto?> UnflagPlayerAsync(string pid, string reason)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        if (!player.IsSuspicious)
        {
            return new ModerationActionResultDto(
                true,
                $"Player '{player.Name}' is not flagged as suspicious"
            );
        }

        player.IsSuspicious = false;
        player.SuspiciousVRJumps = 0;
        player.UnflagReason = reason;
        await _playerRepository.UpdateAsync(player);

        _logger.LogInformation(
            "Player unflagged: {Name} ({FriendCode}) - PID: {Pid} - Reason: {Reason}",
            player.Name, player.Fc, player.Pid, player.UnflagReason);

        return new ModerationActionResultDto(
            true,
            $"Player '{player.Name}' has been unflagged. Reason: '{player.UnflagReason}'",
            PlayerMapper.ToDto(player)
        );
    }

    public async Task<ModerationActionResultDto?> BanPlayerAsync(string pid)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        if (player.IsBanned)
        {
            return new ModerationActionResultDto(
                true,
                $"Player '{player.Name}' is already banned",
                PlayerMapper.ToDto(player)
            );
        }

        player.IsBanned = true;
        await _playerRepository.UpdateAsync(player);

        _logger.LogWarning("Player banned: {Name} ({FriendCode}) - PID: {Pid}",
            player.Name, player.Fc, player.Pid);

        return new ModerationActionResultDto(
            true,
            $"Player '{player.Name}' has been banned and hidden from the leaderboard",
            PlayerMapper.ToDto(player)
        );
    }

    public async Task<SuspiciousJumpsResultDto?> GetSuspiciousJumpsAsync(string pid)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid);
        var suspiciousJumps = history
            .Where(h => Math.Abs(h.VRChange) >= SuspiciousJumpThreshold)
            .OrderByDescending(h => h.Date)
            .Select(h => new VRJumpDto(h.Date, h.VRChange, h.TotalVR))
            .ToList();

        _logger.LogInformation(
            "Retrieved {Count} suspicious jumps for player: {Name} ({Pid})",
            suspiciousJumps.Count, player.Name, pid);

        return new SuspiciousJumpsResultDto(
            PlayerMapper.ToBasicDto(player),
            suspiciousJumps,
            suspiciousJumps.Count
        );
    }
}
