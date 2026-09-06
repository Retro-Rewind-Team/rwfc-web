using RetroRewindWebsite.Models.DTOs.Multiplier;
using RetroRewindWebsite.Models.Entities.Multiplier;
using RetroRewindWebsite.Repositories.Multiplier;

namespace RetroRewindWebsite.Services.Application;

public class MultiplierService : IMultiplierService
{
    private const double NoMultiplier = 1.0;

    private readonly IMultiplierRepository _repository;

    public MultiplierService(IMultiplierRepository repository)
    {
        _repository = repository;
    }

    public async Task<double> GetActiveValueAsync(string channel)
    {
        var parsedChannel = ParseChannel(channel);
        var active = await _repository.GetActiveAsync(parsedChannel, DateTime.UtcNow);
        return active?.Value ?? NoMultiplier;
    }

    public async Task<MultiplierResultDto> CreateAsync(CreateMultiplierRequest request)
    {
        if (!TryParseChannel(request.Channel, out var parsedChannel))
            return new MultiplierResultDto(false, $"Unknown channel '{request.Channel}'");

        if (request.StartTime >= request.EndTime)
            return new MultiplierResultDto(false, "StartTime must be before EndTime");

        var overlapping = await _repository.GetOverlappingAsync(parsedChannel, request.StartTime, request.EndTime);
        if (overlapping.Count > 0)
            return new MultiplierResultDto(false, "This range overlaps an existing scheduled multiplier for this channel");

        var created = await _repository.CreateAsync(new MultiplierEntity
        {
            Channel = parsedChannel,
            Value = request.Value,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            CreatedAt = DateTime.UtcNow
        });

        return new MultiplierResultDto(true, "Multiplier created", ToDto(created));
    }

    public async Task<MultiplierListResultDto> GetAllAsync(string? channel)
    {
        MultiplierChannel? parsedChannel = null;
        if (!string.IsNullOrWhiteSpace(channel))
        {
            if (!TryParseChannel(channel, out var parsed))
                return new MultiplierListResultDto(true, 0, []);
            parsedChannel = parsed;
        }

        var all = await _repository.GetAllAsync(parsedChannel);
        var dtos = all.Select(ToDto).ToList();
        return new MultiplierListResultDto(true, dtos.Count, dtos);
    }

    public async Task<MultiplierDto?> GetByIdAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        return entity == null ? null : ToDto(entity);
    }

    public async Task<MultiplierResultDto> UpdateAsync(int id, UpdateMultiplierRequest request)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
            return new MultiplierResultDto(false, $"Multiplier with id {id} not found");

        if (request.StartTime >= request.EndTime)
            return new MultiplierResultDto(false, "StartTime must be before EndTime");

        var overlapping = await _repository.GetOverlappingAsync(
            existing.Channel, request.StartTime, request.EndTime, excludeId: id);
        if (overlapping.Count > 0)
            return new MultiplierResultDto(false, "This range overlaps an existing scheduled multiplier for this channel");

        existing.Value = request.Value;
        existing.StartTime = request.StartTime;
        existing.EndTime = request.EndTime;
        await _repository.UpdateAsync(existing);

        return new MultiplierResultDto(true, "Multiplier updated", ToDto(existing));
    }

    public async Task<MultiplierDeletionResultDto> DeleteAsync(int id)
    {
        var deleted = await _repository.DeleteAsync(id);
        return deleted
            ? new MultiplierDeletionResultDto(true, "Multiplier deleted")
            : new MultiplierDeletionResultDto(false, $"Multiplier with id {id} not found");
    }

    private static MultiplierChannel ParseChannel(string? channel)
    {
        if (!TryParseChannel(channel, out var parsed))
            throw new ArgumentException($"Unknown channel '{channel}'", nameof(channel));
        return parsed;
    }

    private static bool TryParseChannel(string? channel, out MultiplierChannel parsed)
    {
        if (string.IsNullOrWhiteSpace(channel))
        {
            parsed = MultiplierChannel.Stable;
            return true;
        }

        return Enum.TryParse(channel, ignoreCase: true, out parsed);
    }

    private static MultiplierDto ToDto(MultiplierEntity entity) => new(
        entity.Id, entity.Channel.ToString(), entity.Value, entity.StartTime, entity.EndTime);
}
