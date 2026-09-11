import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../services/api/client";
import { multiplierApi } from "../../../services/api/multiplier";

/**
 * The game fetches its event multiplier from /api/multiplier as a bare number in plain text
 * (RatingMultiplier.cpp). The VR calculator reads the same endpoint to prefill that value.
 */
function textResponse(body: string, status = 200, statusText = "OK") {
    return { ok: status >= 200 && status < 300, status, statusText, text: async () => body };
}

describe("multiplierApi.getActive", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the plain-text number the endpoint serves", async () => {
        fetchMock.mockResolvedValueOnce(textResponse("1.5"));

        await expect(multiplierApi.getActive("stable")).resolves.toBe(1.5);
    });

    it("requests the channel it was given", async () => {
        fetchMock.mockResolvedValueOnce(textResponse("1"));

        await multiplierApi.getActive("beta");

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/multiplier\?channel=beta$/),
        );
    });

    it("rejects an empty body instead of reading it as 0", async () => {
        fetchMock.mockResolvedValueOnce(textResponse(""));

        await expect(multiplierApi.getActive("stable")).rejects.toThrow(/not a number/i);
    });

    it("rejects a body with trailing text", async () => {
        fetchMock.mockResolvedValueOnce(textResponse("1.5x"));

        await expect(multiplierApi.getActive("stable")).rejects.toThrow(/not a number/i);
    });

    it("rejects an HTTP error with ApiError", async () => {
        fetchMock.mockResolvedValueOnce(textResponse("Unknown channel", 400, "Bad Request"));

        await expect(multiplierApi.getActive("stable")).rejects.toBeInstanceOf(ApiError);
    });
});
