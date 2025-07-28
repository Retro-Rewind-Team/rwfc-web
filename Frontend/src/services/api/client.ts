const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
    constructor(
    public status: number,
    message: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new ApiError(
                response.status,
                `HTTP ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new Error(
            `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}
