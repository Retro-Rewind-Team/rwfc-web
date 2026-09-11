import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { leaderboardApi } from "../../../services/api/leaderboard";

const RELEASES_URL = "https://api.github.com/repos/Jacherr/RR-Launcher/releases/latest";
const FALLBACK_URL = "https://github.com/Jacherr/RR-Launcher/releases/latest";

describe("getChannelDownloadUrl", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the .zip asset's browser_download_url on success", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                assets: [
                    {
                        name: "RetroRewindChannel.zip",
                        browser_download_url: "https://example.com/RetroRewindChannel.zip",
                    },
                ],
            }),
        });

        const url = await leaderboardApi.getChannelDownloadUrl();

        expect(url).toBe("https://example.com/RetroRewindChannel.zip");
        expect(fetchMock).toHaveBeenCalledWith(RELEASES_URL);
    });

    it("picks the .zip asset when multiple assets are present", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                assets: [
                    {
                        name: "checksums.txt",
                        browser_download_url: "https://example.com/checksums.txt",
                    },
                    {
                        name: "RetroRewindChannel.zip",
                        browser_download_url: "https://example.com/RetroRewindChannel.zip",
                    },
                ],
            }),
        });

        const url = await leaderboardApi.getChannelDownloadUrl();

        expect(url).toBe("https://example.com/RetroRewindChannel.zip");
    });

    it("falls back to the releases page when the response is not ok", async () => {
        fetchMock.mockResolvedValueOnce({ ok: false });

        const url = await leaderboardApi.getChannelDownloadUrl();

        expect(url).toBe(FALLBACK_URL);
    });

    it("falls back to the releases page when no .zip asset exists", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                assets: [
                    { name: "readme.txt", browser_download_url: "https://example.com/readme.txt" },
                ],
            }),
        });

        const url = await leaderboardApi.getChannelDownloadUrl();

        expect(url).toBe(FALLBACK_URL);
    });

    it("falls back to the releases page when the .zip asset has no browser_download_url", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                assets: [{ name: "RetroRewindChannel.zip", browser_download_url: "" }],
            }),
        });

        const url = await leaderboardApi.getChannelDownloadUrl();

        expect(url).toBe(FALLBACK_URL);
    });

    it("falls back to the releases page when fetch throws", async () => {
        fetchMock.mockRejectedValueOnce(new Error("network error"));

        const url = await leaderboardApi.getChannelDownloadUrl();

        expect(url).toBe(FALLBACK_URL);
    });
});

describe("getDiscordInviteIcon", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the CDN icon URL when the guild has a static icon", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                guild: { id: "123456789", icon: "abcdef1234567890abcdef1234567890" },
            }),
        });

        const url = await leaderboardApi.getDiscordInviteIcon("https://discord.gg/ztuhWaWnkh");

        expect(url).toBe(
            "https://cdn.discordapp.com/icons/123456789/abcdef1234567890abcdef1234567890.png",
        );
        expect(fetchMock).toHaveBeenCalledWith("https://discord.com/api/v10/invites/ztuhWaWnkh");
    });

    it("uses the .gif extension for animated icons (hash starting with a_)", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                guild: { id: "999", icon: "a_abcdef1234567890abcdef1234567890" },
            }),
        });

        const url = await leaderboardApi.getDiscordInviteIcon("https://discord.gg/somecode");

        expect(url).toBe(
            "https://cdn.discordapp.com/icons/999/a_abcdef1234567890abcdef1234567890.gif",
        );
    });

    it("extracts the invite code correctly from a discord.com/invite/ URL", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ guild: { id: "1", icon: "hash" } }),
        });

        await leaderboardApi.getDiscordInviteIcon("https://discord.com/invite/XB6YmGhyNA");

        expect(fetchMock).toHaveBeenCalledWith("https://discord.com/api/v10/invites/XB6YmGhyNA");
    });

    it("returns null when the guild has no icon", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ guild: { id: "123", icon: null } }),
        });

        const url = await leaderboardApi.getDiscordInviteIcon("https://discord.gg/somecode");

        expect(url).toBeNull();
    });

    it("returns null when the response is not ok", async () => {
        fetchMock.mockResolvedValueOnce({ ok: false });

        const url = await leaderboardApi.getDiscordInviteIcon("https://discord.gg/somecode");

        expect(url).toBeNull();
    });

    it("returns null when fetch throws", async () => {
        fetchMock.mockRejectedValueOnce(new Error("network error"));

        const url = await leaderboardApi.getDiscordInviteIcon("https://discord.gg/somecode");

        expect(url).toBeNull();
    });
});

describe("getDiscordMemberCount", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("returns the count Discord reports", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ approximate_member_count: 12345 }),
        });

        expect(await leaderboardApi.getDiscordMemberCount()).toBe(12345);
    });

    it("returns null rather than inventing a number when Discord fails", async () => {
        // It used to return a hard-coded 8000, which the page then displayed as a real figure.
        fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

        expect(await leaderboardApi.getDiscordMemberCount()).toBeNull();
    });

    it("returns null when the request throws outright", async () => {
        fetchMock.mockRejectedValueOnce(new Error("offline"));

        expect(await leaderboardApi.getDiscordMemberCount()).toBeNull();
    });
});

describe("route parameter encoding", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const requestedUrl = () => String(fetchMock.mock.calls[0][0]);

    it("leaves an ordinary friend code readable", async () => {
        await leaderboardApi.getPlayer("0000-0000-0001");

        expect(requestedUrl()).toContain("/leaderboard/player/0000-0000-0001");
    });

    it("encodes a friend code containing a slash so it cannot add a path segment", async () => {
        await leaderboardApi.getPlayer("0000/0000");

        expect(requestedUrl()).toContain("0000%2F0000");
        expect(requestedUrl()).not.toContain("player/0000/0000");
    });

    it("encodes a friend code containing a question mark so it cannot start a query string", async () => {
        await leaderboardApi.getPlayer("abc?admin=1");

        expect(requestedUrl()).toContain("abc%3Fadmin%3D1");
    });

    it("encodes the friend code on the history route too", async () => {
        await leaderboardApi.getPlayerHistory("0000/0000", 30);

        expect(requestedUrl()).toContain("0000%2F0000");
    });
});
