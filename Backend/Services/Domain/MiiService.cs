using Kaitai;
using Microsoft.Extensions.Caching.Memory;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;

namespace RetroRewindWebsite.Services.Domain;

/// <summary>
/// Fetches and caches Mii avatar images from RiiConnect24, applying size normalization and per-friend-code request throttling.
/// </summary>
public class MiiService : IMiiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly MemoryCacheEntryOptions _cacheOptions;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    private readonly ILogger<MiiService> _logger;

    public MiiService(IHttpClientFactory httpClientFactory, IMemoryCache memoryCache, ILogger<MiiService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = memoryCache;
        _logger = logger;

        // Extended cache duration since Mii data rarely changes
        _cacheOptions = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(TimeSpan.FromDays(1))
            .SetAbsoluteExpiration(TimeSpan.FromDays(7))
            .SetSize(1);
    }

    public async Task<string?> GetMiiImageAsync(string friendCode, string miiData, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(friendCode) || string.IsNullOrEmpty(miiData))
            return null;

        // Check memory cache first
        if (_cache.TryGetValue(friendCode, out string? cachedMiiImage))
        {
            return cachedMiiImage;
        }

        var semaphore = _locks.GetOrAdd(friendCode, _ => new SemaphoreSlim(1, 1));

        try
        {
            await semaphore.WaitAsync(cancellationToken);

            // Double-check cache after acquiring lock
            if (_cache.TryGetValue(friendCode, out cachedMiiImage))
            {
                return cachedMiiImage;
            }

            using var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);

            var miiBytes = Convert.FromBase64String(miiData);
            var gen1Wii = new Gen1Wii(new KaitaiStream(miiBytes));
            var miiHex = CreateStudioMii(gen1Wii);

            var miiImageUrl = $"https://studio.mii.nintendo.com/miis/image.png?data={miiHex}&type=face&expression=normal&width=270&bgColor=FFFFFF00";

            var imageResponse = await httpClient.GetAsync(miiImageUrl, cancellationToken);
            if (!imageResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to get image from Nintendo: {StatusCode}", imageResponse.StatusCode);
                return null;
            }

            var imageBytes = await imageResponse.Content.ReadAsByteArrayAsync(cancellationToken);

            using var image = Image.Load(imageBytes);
            image.Mutate(x => x.Resize(64, 64));
            using var ms = new MemoryStream();
            await image.SaveAsPngAsync(ms, cancellationToken);
            var base64Image = Convert.ToBase64String(ms.ToArray());

            // Cache in memory
            _cache.Set(friendCode, base64Image, _cacheOptions);

            _logger.LogDebug("Successfully fetched and cached Mii for {FriendCode}", friendCode);

            return base64Image;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error fetching Mii for {FriendCode}", friendCode);
            return null;
        }
        finally
        {
            semaphore.Release();
        }
    }

    static readonly Dictionary<byte, byte> _wrinkles = new() { { 4, 5 }, { 5, 2 }, { 6, 3 }, { 7, 7 }, { 8, 8 }, { 10, 9 }, { 11, 11 } };

    static readonly Dictionary<byte, byte> _makeup = new() { { 1, 1 }, { 2, 6 }, { 3, 9 }, { 9, 10 } };

    public static string CreateStudioMii(Gen1Wii mii)
    {
        var buf = new MemoryStream();
        var ctx = new MiiContext(buf);

        if (mii.FacialHairColor == 0)
            ctx.WriteValue(8);
        else
            ctx.WriteValue(mii.FacialHairColor);

        ctx.WriteValue(mii.FacialHairBeard);
        ctx.WriteValue(mii.BodyWeight);

        // Eye stretch
        ctx.WriteValue(3);

        ctx.WriteValue(mii.EyeColor + 8);
        ctx.WriteValue(mii.EyeRotation);
        ctx.WriteValue(mii.EyeSize);
        ctx.WriteValue(mii.EyeType);
        ctx.WriteValue(mii.EyeHorizontal);
        ctx.WriteValue(mii.EyeVertical);
        // Eyebrow Stretch
        ctx.WriteValue(3);

        if (mii.EyebrowColor == 0)
            ctx.WriteValue(8);
        else
            ctx.WriteValue(mii.EyebrowColor);

        ctx.WriteValue(mii.EyebrowRotation);
        ctx.WriteValue(mii.EyebrowSize);
        ctx.WriteValue(mii.EyebrowType);
        ctx.WriteValue(mii.EyebrowHorizontal);
        ctx.WriteValue(mii.EyebrowVertical);

        ctx.WriteValue(mii.FaceColor);

        if (_makeup.TryGetValue((byte)mii.FacialFeature, out byte v))
            ctx.WriteValue(v);
        else
            ctx.WriteValue(0);

        ctx.WriteValue(mii.FaceType);

        if (_wrinkles.TryGetValue((byte)mii.FacialFeature, out byte v1))
            ctx.WriteValue(v1);
        else
            ctx.WriteValue(0);

        ctx.WriteValue(mii.FavoriteColor);
        ctx.WriteValue(mii.Gender);

        if (mii.GlassesColor == 0)
            ctx.WriteValue(8);
        else if (mii.GlassesColor < 6)
            ctx.WriteValue(mii.GlassesColor + 13);
        else
            ctx.WriteValue(0);

        ctx.WriteValue(mii.GlassesSize);
        ctx.WriteValue(mii.GlassesType);
        ctx.WriteValue(mii.GlassesVertical);

        if (mii.HairColor == 0)
            ctx.WriteValue(8);
        else
            ctx.WriteValue(mii.HairColor);

        ctx.WriteValue(mii.HairFlip);
        ctx.WriteValue(mii.HairType);
        ctx.WriteValue(mii.BodyHeight);
        ctx.WriteValue(mii.MoleSize);
        ctx.WriteValue(mii.MoleEnable);
        ctx.WriteValue(mii.MoleHorizontal);
        ctx.WriteValue(mii.MoleVertical);

        // Mouth Stretch
        ctx.WriteValue(3);

        if (mii.MouthColor < 5)
            ctx.WriteValue(mii.MouthColor + 19);
        else
            ctx.WriteValue(0);

        ctx.WriteValue(mii.MouthSize);
        ctx.WriteValue(mii.MouthType);
        ctx.WriteValue(mii.MouthVertical);
        ctx.WriteValue(mii.FacialHairSize);
        ctx.WriteValue(mii.FacialHairMustache);
        ctx.WriteValue(mii.FacialHairVertical);
        ctx.WriteValue(mii.NoseSize);
        ctx.WriteValue(mii.NoseType);
        ctx.WriteValue(mii.NoseVertical);

        return Convert.ToHexString(buf.ToArray().AsSpan()).ToLower();
    }

    internal class MiiContext
    {
        int _n = 0;
        readonly MemoryStream _writer;

        internal MiiContext(MemoryStream writer)
        {
            _writer = writer;
            _writer.WriteByte(0);
        }

        internal void WriteValue(object value)
        {
            var bval = Convert.ToByte(value);
            var eo = (7 + (bval ^ _n)) % 256;
            var n = _n;
            _n = eo;
            _writer.WriteByte((byte)eo);
        }
    }
}
