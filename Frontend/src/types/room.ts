export interface RoomPlayer {
  pid: string;
  name: string;
  friendCode: string;
  vr: number | null;
  br: number | null;
  isOpenHost: boolean;
  isSuspended: boolean;
  connectionMap: string[];
  mii: {
    data: string;
    name: string;
  } | null;
}

export interface Race {
  num: number;
  course: number;
  cc: number;
}

export interface Room {
  id: string;
  type: string;
  created: string;
  host: string;
  rk: string | null;
  players: RoomPlayer[];
  averageVR: number | null;
  race: Race | null;
  roomType: string;
  isSuspended: boolean;
  isPublic: boolean;
  isJoinable: boolean;
}

export interface RoomStatusResponse {
  rooms: Room[];
  timestamp: string;
  id: number;
  minimumId: number;
  maximumId: number;
}

export interface RoomStatusStats {
  totalPlayers: number;
  totalRooms: number;
  publicRooms: number;
  privateRooms: number;
  lastUpdated: string;
}