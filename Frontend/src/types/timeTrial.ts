export interface Track {
  id: number;
  name: string;
  trackSlot: string;
  courseId: number;
  category: "retro" | "custom";
  laps: number;
}

export interface TTProfile {
  id: number;
  discordUserId: string;
  displayName: string;
  totalSubmissions: number;
  currentWorldRecords: number;
  countryCode: number;
}

export interface GhostSubmission {
  id: number;
  trackId: number;
  trackName: string;
  ttProfileId: number;
  playerName: string;
  cc: number;
  finishTimeMs: number;
  finishTimeDisplay: string;
  vehicleId: number;
  characterId: number;
  controllerType: number;
  driftType: number;
  miiName: string;
  lapCount: number;
  lapSplitsMs: number[];
  ghostFilePath: string;
  dateSet: string;
  submittedAt: string;
  shroomless: boolean;
  glitch: boolean;
}

export interface TrackLeaderboard {
  track: Track;
  cc: number;
  submissions: GhostSubmission[];
  totalSubmissions: number;
  currentPage: number;
  pageSize: number;
}

export interface GhostSubmissionResponse {
  success: boolean;
  message: string;
  submission?: GhostSubmission;
}