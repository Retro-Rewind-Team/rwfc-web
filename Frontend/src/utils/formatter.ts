import { getDriftCategoryName, getDriftTypeName } from "../constants/marioKartMappings";

/** Formats an ISO date string as DD/MM/YYYY. */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/** Returns a compact drift label, e.g. "Manual Inside" or "Hybrid Outside". */
export function getDriftInfo(driftType: number, driftCategory: number): string {
    const type = getDriftTypeName(driftType);
    const category = getDriftCategoryName(driftCategory);
    return `${type} ${category.replace(" Drift", "")}`;
}

/** Formats an ISO timestamp as a human-readable relative time (e.g. "5 minutes ago"). */
export function formatLastSeen(lastSeen: string): string {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "Now Online";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return "1 week ago";
    return `${diffWeeks} weeks ago`;
}

/** Returns Tailwind classes for the rank badge background colour (gold/silver/bronze/blue). */
export function getRankBadgeClass(rank: number): string {
    if (rank === 1) return "bg-yellow-500 text-white"; // Gold
    if (rank === 2) return "bg-gray-400 text-white"; // Silver
    if (rank === 3) return "bg-yellow-600 text-white"; // Bronze
    return "bg-blue-500 text-white";
}

/** Returns a trophy/medal emoji for ranks 1–3, or null for all other ranks. */
export function getRankIcon(rank: number): string | null {
    if (rank === 1) return "🏆"; // Gold trophy
    if (rank === 2) return "🥈"; // Silver medal
    if (rank === 3) return "🥉"; // Bronze medal
    return null;
}

/** Returns a Tailwind colour class for a VR gain value (green = positive, red = negative). */
export function getVRGainClass(gain: number): string {
    if (gain > 0) return "text-green-600 font-bold";
    if (gain < 0) return "text-red-600 font-bold";
    return "text-gray-600";
}

/** Formats an ISO timestamp as HH:MM:SS. */
export const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
};
