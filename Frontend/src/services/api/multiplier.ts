import { API_BASE_URL, ApiError } from "./client";

/** Release channel to read. The beta build of the game asks for its own value. */
export type MultiplierChannel = "stable" | "beta";

export const multiplierApi = {
    /**
     * Fetches the VR multiplier the game downloads when it connects (RatingMultiplier.cpp). The
     * endpoint answers in plain text such as "1.5", so this skips apiRequest's JSON parsing.
     * @param channel - Which release channel's value to read.
     * @throws ApiError on an HTTP error, or Error when the body is not a plain number.
     */
    async getActive(channel: MultiplierChannel): Promise<number> {
        const response = await fetch(`${API_BASE_URL}/multiplier?channel=${channel}`);
        if (!response.ok) {
            throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
        }

        const body = (await response.text()).trim();
        // Number("") is 0, which would pass as a real multiplier.
        const value = body === "" ? Number.NaN : Number(body);
        if (!Number.isFinite(value)) {
            throw new Error(`Multiplier endpoint returned "${body}", which is not a number`);
        }
        return value;
    },
};
