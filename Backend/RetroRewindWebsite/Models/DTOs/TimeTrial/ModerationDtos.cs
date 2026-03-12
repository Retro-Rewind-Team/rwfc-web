namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record GhostSubmissionResultDto(bool Success, string Message, GhostSubmissionDetailDto? Submission = null);
public record GhostDeletionResultDto(bool Success, string Message);
public record GhostSubmissionSearchResultDto(bool Success, int Count, List<GhostSubmissionDetailDto> Submissions);
public record ProfileCreationResultDto(bool Success, string Message, TTProfileDto? Profile = null);
public record ProfileListResultDto(bool Success, int Count, List<TTProfileDto> Profiles);
public record ProfileDeletionResultDto(bool Success, string Message);
public record ProfileUpdateResultDto(bool Success, string Message, TTProfileDto? Profile = null);
public record ProfileViewResultDto(bool Success, string Message, TTProfileDto? Profile = null);
