import { RWFCPCount } from "../../types/rwfc";
import { rwfcAPIRequest } from "./client";

export const rwfcApi = {
    async getPCount(): Promise<RWFCPCount> {
        return rwfcAPIRequest<RWFCPCount>("/pcount");
    },
}
