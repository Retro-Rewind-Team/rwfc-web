export interface VRHistoryEntry {
  date: string;
  vrChange: number;
  totalVR: number;
}

export interface VRHistoryResponse {
  playerId: string;
  fromDate: string;
  toDate: string;
  history: VRHistoryEntry[];
  totalVRChange: number;
  startingVR: number;
  endingVR: number;
}