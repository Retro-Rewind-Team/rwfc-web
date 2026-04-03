// Rating Editor Types
export interface RatingEntry {
  index: number;
  profileId: number;
  vr: number;
  br: number;    // Battle Rating
  flags: number; // Bitfield containing entry metadata flags
}

export interface RatingFile {
  magic: string;
  version: number;
  count: number;
  entries: RatingEntry[];
}

// Font Patcher Types
export interface U8Node {
  type: number;       // 0 = file, 1 = directory
  nameOffset: number; // Byte offset into the string table
  dataOffset: number; // Byte offset of node data within the archive
  size: number;
  index: number;
}

export interface U8Archive {
  nodes: U8Node[];
  paths: string[];
  rootOffset: number;
  headerSize: number;
  dataOffset: number;
}
