using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Repositories.Player;

namespace RetroRewindWebsite.Services.Application;

/// <summary>
/// Implements flag, unflag, ban, stat-swap, and suspicious VR-jump detection for player moderation.
/// </summary>
public class PlayerModerationService : IPlayerModerationService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IVRHistoryRepository _vrHistoryRepository;
    private readonly LeaderboardDbContext _context;
    private readonly ILogger<PlayerModerationService> _logger;

    private const int SuspiciousJumpThreshold = 793; // Matches PlayerValidationService.MaxVRJumpPerRace

    public PlayerModerationService(
        IPlayerRepository playerRepository,
        IVRHistoryRepository vrHistoryRepository,
        LeaderboardDbContext context,
        ILogger<PlayerModerationService> logger)
    {
        _playerRepository = playerRepository;
        _vrHistoryRepository = vrHistoryRepository;
        _context = context;
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

    public async Task<SwapResultDto?> SwapPlayerStatsAsync(string sourcePid, string targetPid, string reason)
    {
        // Load both players with tracking so SaveChangesAsync picks up changes
        var source = await _context.Players.FirstOrDefaultAsync(p => p.Pid == sourcePid);
        if (source == null)
            return null;

        var target = await _context.Players.FirstOrDefaultAsync(p => p.Pid == targetPid);
        if (target == null)
            return null;

        // RaceResults.ProfileId is the numeric form of the PID. Validate before opening the
        // transaction so a malformed PID is reported instead of throwing mid-swap.
        if (!long.TryParse(sourcePid, out var sourceProfileId) || sourceProfileId <= 0 ||
            !long.TryParse(targetPid, out var targetProfileId) || targetProfileId <= 0)
        {
            return new SwapResultDto(
                false,
                $"Both PIDs must be positive numeric player IDs (SourcePid: '{sourcePid}', TargetPid: '{targetPid}')");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // --- Capture source stats before overwriting ---
            var srcEv = source.Ev;
            var srcGain24h = source.VRGainLast24Hours;
            var srcGainWeek = source.VRGainLastWeek;
            var srcGainMonth = source.VRGainLastMonth;
            var srcIsSuspicious = source.IsSuspicious;
            var srcSuspiciousVRJumps = source.SuspiciousVRJumps;
            var srcFlagReason = source.FlagReason;
            var srcUnflagReason = source.UnflagReason;
            var srcIsBanned = source.IsBanned;

            // --- Write target's stats onto source ---
            source.Ev = target.Ev;
            source.VRGainLast24Hours = target.VRGainLast24Hours;
            source.VRGainLastWeek = target.VRGainLastWeek;
            source.VRGainLastMonth = target.VRGainLastMonth;
            source.IsSuspicious = target.IsSuspicious;
            source.SuspiciousVRJumps = target.SuspiciousVRJumps;
            source.FlagReason = target.FlagReason;
            source.UnflagReason = target.UnflagReason;
            source.IsBanned = target.IsBanned;

            // --- Write source's saved stats onto target ---
            target.Ev = srcEv;
            target.VRGainLast24Hours = srcGain24h;
            target.VRGainLastWeek = srcGainWeek;
            target.VRGainLastMonth = srcGainMonth;
            target.IsSuspicious = srcIsSuspicious;
            target.SuspiciousVRJumps = srcSuspiciousVRJumps;
            target.FlagReason = srcFlagReason;
            target.UnflagReason = srcUnflagReason;
            target.IsBanned = srcIsBanned;

            // --- Swap VR history records ---
            // Both PIDs exist in the Players table throughout this transaction, so neither
            // FK update violates a constraint. VRHistories.PlayerId is a foreign key to
            // Players.Pid, so rows cannot be parked on a sentinel id the way race results are.
            // One conditional update handles both directions instead: two sequential updates
            // would re-match the rows the first had already moved and pile everything onto
            // one player. Postgres evaluates every SET expression against the pre-update row,
            // so both selectors below still see the original PlayerId.
            await _context.VRHistories
                .Where(v => v.PlayerId == sourcePid || v.PlayerId == targetPid)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(v => v.PlayerId, v => v.PlayerId == sourcePid ? targetPid : sourcePid)
                    .SetProperty(v => v.Fc, v => v.PlayerId == sourcePid ? target.Fc : source.Fc));

            // --- Swap race result records ---
            // (RoomId, RaceNumber, ProfileId) is unique, so when both players took part in the
            // same race a direct swap collides: Postgres checks the index per row as it writes,
            // not at statement end. Move the source rows onto an unused negative ProfileId
            // first so every step writes into a slot that is provably empty.
            // PlayerId is deliberately left alone -- it is the co-op slot marker (0 = the
            // online racer), not a foreign key to Players.Id, and every stats query filters
            // on PlayerId == 0.
            var parkedProfileId = -sourceProfileId;

            await _context.RaceResults
                .Where(r => r.ProfileId == sourceProfileId)
                .ExecuteUpdateAsync(s => s.SetProperty(r => r.ProfileId, parkedProfileId));

            await _context.RaceResults
                .Where(r => r.ProfileId == targetProfileId)
                .ExecuteUpdateAsync(s => s.SetProperty(r => r.ProfileId, sourceProfileId));

            await _context.RaceResults
                .Where(r => r.ProfileId == parkedProfileId)
                .ExecuteUpdateAsync(s => s.SetProperty(r => r.ProfileId, targetProfileId));

            // --- Flush player entity changes and commit ---
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Ranks depend on Ev, so recalculate after the swap
        await _playerRepository.UpdatePlayerRanksAsync();

        _logger.LogWarning(
            "Player stats swapped: {SourceName} ({SourcePid}) <-> {TargetName} ({TargetPid}) - Reason: {Reason}",
            source.Name, sourcePid, target.Name, targetPid, reason);

        // Re-fetch for accurate post-swap state (including updated rank)
        var sourceAfter = await _playerRepository.GetByPidAsync(sourcePid);
        var targetAfter = await _playerRepository.GetByPidAsync(targetPid);

        return new SwapResultDto(
            true,
            $"Stats swapped between '{source.Name}' ({sourcePid}) and '{target.Name}' ({targetPid}). Reason: '{reason}'",
            sourceAfter != null ? PlayerMapper.ToDto(sourceAfter) : null,
            targetAfter != null ? PlayerMapper.ToDto(targetAfter) : null
        );
    }

    public async Task<BadgeModerationActionResultDto?> AddBadgeAsync(string pid, int badge)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        player.Badges ??= [];

        if (player.Badges.Contains(badge))
        {
            return new BadgeModerationActionResultDto(
                false,
                $"Player '{player.Name}' already has this badge",
                player.Badges
            );
        }

        player.Badges.Add(badge);
        await _playerRepository.UpdateAsync(player);

        _logger.LogWarning(
            "Badge added to player: {Name} ({FriendCode}) - PID: {Pid} - Badge: {Badge}",
            player.Name, player.Fc, player.Pid, badge);

        return new BadgeModerationActionResultDto(
            true,
            $"Player '{player.Name}' has been given a badge",
            player.Badges
        );
    }

    public async Task<BadgeModerationActionResultDto?> RemoveBadgeAsync(string pid, int badge)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        if (player.Badges == null || player.Badges.Count == 0 || !player.Badges.Contains(badge))
        {
            return new BadgeModerationActionResultDto(
                false,
                $"Player '{player.Name}' does not have this badge",
                player.Badges ?? []
            );
        }

        player.Badges.Remove(badge);
        await _playerRepository.UpdateAsync(player);

        _logger.LogWarning(
            "Badge removed from player: {Name} ({FriendCode}) - PID: {Pid} - Badge: {Badge}",
            player.Name, player.Fc, player.Pid, badge);

        return new BadgeModerationActionResultDto(
            true,
            $"Player '{player.Name}' has had a badge removed",
            player.Badges
        );
    }
}
