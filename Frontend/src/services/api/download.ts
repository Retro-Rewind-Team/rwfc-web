const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const downloadsApi = {
    getFullDownloadUrl(): string {
        return `${API_BASE_URL}/download/full`;
    },

    getUpdateDownloadUrl(): string {
        return `${API_BASE_URL}/download/update`;
    },
};