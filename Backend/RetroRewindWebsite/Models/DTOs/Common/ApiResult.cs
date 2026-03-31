namespace RetroRewindWebsite.Models.DTOs.Common;

public class ApiResult<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }

    public static ApiResult<T> Ok(T data, string? message = null) => new() { Success = true, Data = data, Message = message };
    public static ApiResult<T> Fail(string message) => new() { Success = false, Message = message };
}
