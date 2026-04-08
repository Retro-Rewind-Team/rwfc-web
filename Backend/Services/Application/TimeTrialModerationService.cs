using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.TimeTrial;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Application;

public class TimeTrialModerationService : ITimeTrialModerationService
{
    private readonly IGhostFileService _ghostFileService;
    private readonly ITrackRepository _trackRepository;
    private readonly ITTProfileRepository _ttProfileRepository;
    private readonly IGhostSubmissionRepository _ghostSubmissionRepository;
    private readonly ILogger<TimeTrialModerationService> _logger;

    public TimeTrialModerationService(
        IGhostFileService ghostFileService,
        ITrackRepository trackRepository,
        ITTProfileRepository ttProfileRepository,
        IGhostSubmissionRepository ghostSubmissionRepository,
        ILogger<TimeTrialModerationService> logger)
    {
        _ghostFileService = ghostFileService;
        _trackRepository = trackRepository;
        _ttProfileRepository = ttProfileRepository;
        _ghostSubmissionRepository = ghostSubmissionRepository;
        _logger = logger;
    }

    // ===== GHOST SUBMISSION =====

    public async Task<GhostSubmissionResultDto> SubmitGhostAsync(
        IFormFile ghostFile,
        int trackId,
        short cc,
        int ttProfileId,
        bool shroomless,
        bool glitch,
        bool isFlap)
    {
        var track = await _trackRepository.GetByIdAsync(trackId);
        if (track == null)
            return new GhostSubmissionResultDto(false, $"Track ID {trackId} not found");

        if (glitch && !track.SupportsGlitch)
            return new GhostSubmissionResultDto(false, $"Glitch/shortcut runs are not allowed for {track.Name}");

        var ttProfile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
        if (ttProfile == null)
            return new GhostSubmissionResultDto(false, $"TT Profile with ID {ttProfileId} not found. Create the profile first.");

        GhostFileParseResult parseResult;
        using (var memoryStream = new MemoryStream())
        {
            await ghostFile.CopyToAsync(memoryStream);
            memoryStream.Position = 0;
            parseResult = await _ghostFileService.ParseGhostFileAsync(memoryStream);

            if (parseResult is not GhostFileParseResult.Success ghostData)
                return new GhostSubmissionResultDto(false, ((GhostFileParseResult.Failure)parseResult).ErrorMessage);

            memoryStream.Position = 0;
            var ghostFilePath = await _ghostFileService.SaveGhostFileAsync(memoryStream, trackId, cc, ttProfile.DisplayName);

            var submission = new GhostSubmissionEntity
            {
                TrackId = trackId,
                TTProfileId = ttProfile.Id,
                CC = cc,
                FinishTimeMs = ghostData.FinishTimeMs,
                FinishTimeDisplay = ghostData.FinishTimeDisplay,
                VehicleId = ghostData.VehicleId,
                CharacterId = ghostData.CharacterId,
                ControllerType = ghostData.ControllerType,
                DriftType = ghostData.DriftType,
                DriftCategory = ghostData.DriftCategory,
                MiiName = ghostData.MiiName,
                LapCount = ghostData.LapCount,
                LapSplitsMs = ghostData.LapSplitsMs,
                GhostFilePath = ghostFilePath,
                DateSet = ghostData.DateSet,
                SubmittedAt = DateTime.UtcNow,
                Shroomless = shroomless,
                Glitch = glitch,
                IsFlap = isFlap
            };

            try
            {
                await _ghostSubmissionRepository.AddAsync(submission);

                ttProfile.TotalSubmissions =
                    await _ghostSubmissionRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
                await _ttProfileRepository.UpdateAsync(ttProfile);
                await _ghostSubmissionRepository.UpdateWorldRecordCountsAsync();
            }
            catch
            {
                TryDeleteGhostFile(ghostFilePath);
                throw;
            }

            _logger.LogInformation(
                "Ghost submitted: Track {TrackId}, Player {PlayerName} (ID: {ProfileId}), Time {Time}ms, DriftCategory {DriftCategory}",
                trackId, ttProfile.DisplayName, ttProfile.Id,
                ghostData.FinishTimeMs, ghostData.DriftCategory);

            var saved = await _ghostSubmissionRepository.GetByIdAsync(submission.Id);

            return new GhostSubmissionResultDto(
                true,
                "Ghost submitted successfully",
                GhostSubmissionMapper.ToDto(saved!));
        }
    }

    public async Task<GhostDeletionResultDto?> DeleteGhostAsync(int id)
    {
        var submission = await _ghostSubmissionRepository.GetByIdAsync(id);
        if (submission == null)
            return null;

        TryDeleteGhostFile(submission.GhostFilePath);

        await _ghostSubmissionRepository.DeleteAsync(submission.Id);

        var ttProfile = await _ttProfileRepository.GetByIdAsync(submission.TTProfileId);
        if (ttProfile != null)
        {
            ttProfile.TotalSubmissions =
                await _ghostSubmissionRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
            await _ttProfileRepository.UpdateAsync(ttProfile);
        }
        else
        {
            _logger.LogWarning(
                "TT Profile {ProfileId} not found when deleting submission {SubmissionId}",
                submission.TTProfileId, id);
        }

        await _ghostSubmissionRepository.UpdateWorldRecordCountsAsync();

        _logger.LogInformation("Ghost submission {SubmissionId} deleted", id);

        return new GhostDeletionResultDto(true, "Ghost submission deleted successfully");
    }

    public async Task<GhostSubmissionSearchResultDto> SearchGhostSubmissionsAsync(
        int? ttProfileId,
        int? trackId,
        short? cc,
        bool? glitch,
        bool? shroomless,
        bool? isFlap,
        short? driftCategory,
        int limit)
    {
        limit = Math.Clamp(limit, 1, 100);

        var submissions = await _ghostSubmissionRepository.SearchAsync(
            ttProfileId, trackId, cc, glitch, shroomless, isFlap, driftCategory, limit);

        var submissionDtos = submissions.Select(s => GhostSubmissionMapper.ToDto(s)).ToList();

        return new GhostSubmissionSearchResultDto(true, submissionDtos.Count, submissionDtos);
    }

    public async Task<GhostSubmissionDetailDto?> GetBestKnownTimeAsync(
        int trackId,
        short cc,
        bool nonGlitchOnly,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax,
        short? driftType,
        short? driftCategory)
    {
        var track = await _trackRepository.GetByIdAsync(trackId);
        if (track == null)
            return null;

        bool glitchFilter = nonGlitchOnly || !track.SupportsGlitch;

        var bkt = await _ghostSubmissionRepository.GetBestKnownTimeAsync(
            trackId, cc, glitchFilter, shroomless,
            vehicleMin, vehicleMax, driftType, driftCategory);

        return bkt == null ? null : GhostSubmissionMapper.ToDto(bkt);
    }

    // ===== TT PROFILE MANAGEMENT =====

    public async Task<ProfileCreationResultDto> CreateProfileAsync(string displayName, int? countryCode)
    {
        var existingProfile = await _ttProfileRepository.GetByNameAsync(displayName);
        if (existingProfile != null)
        {
            return new ProfileCreationResultDto(
                false,
                $"Profile with name '{displayName}' already exists",
                TTProfileMapper.ToDto(existingProfile));
        }

        var newProfile = new TTProfileEntity
        {
            DisplayName = displayName,
            TotalSubmissions = 0,
            CurrentWorldRecords = 0,
            CountryCode = countryCode ?? 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _ttProfileRepository.AddAsync(newProfile);

        _logger.LogInformation("TT Profile created: {DisplayName} (ID: {ProfileId})",
            newProfile.DisplayName, newProfile.Id);

        return new ProfileCreationResultDto(
            true,
            "TT Profile created successfully",
            TTProfileMapper.ToDto(newProfile));
    }

    public async Task<ProfileListResultDto> GetAllProfilesAsync()
    {
        var profiles = await _ttProfileRepository.GetAllAsync();
        var profileDtos = profiles
            .OrderBy(p => p.DisplayName)
            .Select(TTProfileMapper.ToDto)
            .ToList();

        return new ProfileListResultDto(true, profileDtos.Count, profileDtos);
    }

    public async Task<ProfileViewResultDto?> GetProfileAsync(int id)
    {
        var profile = await _ttProfileRepository.GetByIdAsync(id);
        if (profile == null)
            return null;

        return new ProfileViewResultDto(true, string.Empty, TTProfileMapper.ToDto(profile));
    }

    public async Task<ProfileUpdateResultDto?> UpdateProfileAsync(int id, string? displayName, int? countryCode)
    {
        var profile = await _ttProfileRepository.GetByIdAsync(id);
        if (profile == null)
            return null;

        if (displayName != null)
        {
            var existingProfile = await _ttProfileRepository.GetByNameAsync(displayName);
            if (existingProfile != null && existingProfile.Id != id)
            {
                return new ProfileUpdateResultDto(
                    false,
                    $"Profile with name '{displayName}' already exists");
            }

            profile.DisplayName = displayName;
        }

        if (countryCode.HasValue)
            profile.CountryCode = countryCode.Value;

        await _ttProfileRepository.UpdateAsync(profile);

        _logger.LogInformation("TT Profile updated: {DisplayName} (ID: {ProfileId})",
            profile.DisplayName, id);

        return new ProfileUpdateResultDto(
            true,
            "Profile updated successfully",
            TTProfileMapper.ToDto(profile));
    }

    public async Task<ProfileDeletionResultDto?> DeleteProfileAsync(int id)
    {
        var profile = await _ttProfileRepository.GetByIdAsync(id);
        if (profile == null)
            return null;

        var submissionCount = await _ghostSubmissionRepository.GetProfileSubmissionsCountAsync(id);
        if (submissionCount > 0)
        {
            return new ProfileDeletionResultDto(
                false,
                $"Cannot delete profile '{profile.DisplayName}' - it has {submissionCount} submission(s). Delete submissions first.");
        }

        await _ttProfileRepository.DeleteAsync(id);

        _logger.LogInformation("TT Profile deleted: {DisplayName} (ID: {ProfileId})",
            profile.DisplayName, id);

        return new ProfileDeletionResultDto(
            true,
            $"Profile '{profile.DisplayName}' deleted successfully");
    }

    // ===== PRIVATE HELPERS =====

    private void TryDeleteGhostFile(string? filePath)
    {
        if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath))
            return;

        try
        {
            File.Delete(filePath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete ghost file: {FilePath}", filePath);
        }
    }
}
