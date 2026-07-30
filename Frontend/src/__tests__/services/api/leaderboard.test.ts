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
                    { name: "RetroRewindChannel.zip", browser_download_url: "https://example.com/RetroRewindChannel.zip" },
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
                    { name: "checksums.txt", browser_download_url: "https://example.com/checksums.txt" },
                    { name: "RetroRewindChannel.zip", browser_download_url: "https://example.com/RetroRewindChannel.zip" },
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
            json: async () => ({ assets: [{ name: "readme.txt", browser_download_url: "https://example.com/readme.txt" }] }),
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
