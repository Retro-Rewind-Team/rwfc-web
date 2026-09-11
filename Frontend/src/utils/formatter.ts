import { type LucideIcon, Medal, Trophy } from "lucide-solid";
import { getDriftCategoryName, getDriftTypeName } from "../constants/marioKartMappings";

/** Formats an ISO date string as DD/MM/YYYY. */
/**
 * Formats a date in the visitor's own locale.
 *
 * The site had three conventions at once: a hand-rolled DD/MM/YYYY here, a hardcoded nl-NL in five
 * components and an en-US in a sixth, so the same date read differently depending on which screen
 * you were on. Passing no locale defers to the reader's browser, which is the right answer for an
 * international community and means nobody has to agree on a house style.
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
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

/** Returns the Lucide Trophy/Medal component for ranks 1–3, or null for all other ranks. */
export function getRankIcon(rank: number): LucideIcon | null {
    if (rank === 1) return Trophy;
    if (rank === 2) return Medal;
    if (rank === 3) return Medal;
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

/**
 * Mean of a set of lap times, formatted as m:ss.mmm. Returns "N/A" for an empty set.
 *
 * Both time trial tables computed this inline, in an IIFE nested deep in their expanded-row
 * markup, with identical arithmetic in each.
 */
export function formatAverageLap(laps: { timeMs: number }[]): string {
    if (laps.length === 0) return "N/A";

    const average = laps.reduce((sum, lap) => sum + lap.timeMs, 0) / laps.length;
    const minutes = Math.floor(average / 60000);
    const seconds = ((average % 60000) / 1000).toFixed(3);

    return `${minutes}:${seconds.padStart(6, "0")}`;
}
