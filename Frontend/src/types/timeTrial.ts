export interface Track {
  id: number;
  name: string;
  trackSlot: string;
  courseId: number;
  sortOrder: number;
  category: "retro" | "custom";
  laps: number;
  supportsGlitch: boolean;
}

export interface TTProfile {
  id: number;
  displayName: string;
  totalSubmissions: number;
  currentWorldRecords: number;
  countryCode: number;
  countryAlpha2: string | null;
  countryName: string | null;
}

export interface GhostSubmission {
  id: number;
  trackId: number;
  trackName: string;
  ttProfileId: number;
  playerName: string;
  countryCode: number;
  countryAlpha2: string | null;
  countryName: string | null;
  cc: 150 | 200;
  finishTimeMs: number;
  finishTimeDisplay: string;
  vehicleId: number;
  characterId: number;
  controllerType: number;
  driftType: number;
  driftCategory: number;
  shroomless: boolean;
  glitch: boolean;
  miiName: string;
  lapCount: number;
  lapSplitsMs: number[];
  lapSplitsDisplay: string[];
  fastestLapMs: number;
  fastestLapDisplay: string;
  ghostFilePath: string;
  dateSet: string;
  submittedAt: string;
}

export interface TrackLeaderboard {
  track: Track;
  cc: 150 | 200;
  glitch: boolean;
  submissions: GhostSubmission[];
  totalSubmissions: number;
  currentPage: number;
  pageSize: number;
  fastestLapMs: number | null;
  fastestLapDisplay: string | null;
}

export interface GhostSubmissionResponse {
  success: boolean;
  message: string;
  submission?: GhostSubmission;
}

export interface TTPlayerStats {
  profile: TTProfile;
  totalTracks: number;
  tracks150cc: number;
  tracks200cc: number;
  averageFinishPosition: number;
  top10Count: number;
  recentSubmissions: GhostSubmission[];
}

export interface TrackWorldRecords {
    trackId: number;
    trackName: string;
    worldRecord150: GhostSubmission | null;
    worldRecord200: GhostSubmission | null;
    worldRecord150Glitch: GhostSubmission | null;
    worldRecord200Glitch: GhostSubmission | null;
}