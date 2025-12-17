export interface MiiResponse {
  friendCode: string;
  miiImageBase64: string;
}

export interface BatchMiiRequest {
  friendCodes: string[];
}

export interface BatchMiiResponse {
  miis: Record<string, string>;
}