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

export function getRankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-yellow-500 text-white"; // Gold
  if (rank === 2) return "bg-gray-400 text-white"; // Silver
  if (rank === 3) return "bg-yellow-600 text-white"; // Bronze
  return "bg-blue-500 text-white";
}

export function getRankIcon(rank: number): string | null {
  if (rank === 1) return "🏆"; // Gold trophy
  if (rank === 2) return "🥈"; // Silver medal
  if (rank === 3) return "🥉"; // Bronze medal
  return null;
}

export function getVRGainClass(gain: number): string {
  if (gain > 0) return "text-green-600 font-bold";
  if (gain < 0) return "text-red-600 font-bold";
  return "text-gray-600";
}
