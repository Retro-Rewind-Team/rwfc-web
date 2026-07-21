export interface RWFCResponse {
    Success: boolean,
    Error: string,
}

export interface RWFCPCount extends RWFCResponse {
    Count: number,
}
