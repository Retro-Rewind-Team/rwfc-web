import type { RksysLicense } from "../types/tools";
import { pidToFriendCode } from "./friendCodeUtils";

const LICENSE_OFFSETS = [0x08, 0x8CC8, 0x11988, 0x1A648];
const DWC_OFFSET = 0x40;
const DWC_PROFILE_ID_OFF = 0x1C;

const OFF_VS_WINS = 0x98;
const OFF_VS_LOSSES = 0x9C;
const OFF_VR = 0xB0;
const OFF_FIRSTS = 0xDC;
const OFF_DIST = 0xC4;
const OFF_DIST1ST = 0xE0;

function readMiiName(dv: DataView, licBase: number): string {
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset + licBase + 0x14, 0x14);
    let s = "";
    for (let i = 0; i < bytes.length; i += 2) {
        const code = (bytes[i] << 8) | bytes[i + 1];
        if (!code) break;
        s += String.fromCharCode(code);
    }
    return s || "—";
}

export function parseRksysFile(buffer: ArrayBuffer): RksysLicense[] {
    const dv = new DataView(buffer);
    const licenses: RksysLicense[] = [];

    for (let i = 0; i < LICENSE_OFFSETS.length; i++) {
        const licBase = LICENSE_OFFSETS[i];
        const name = readMiiName(dv, licBase);
        const profileId = dv.getUint32(licBase + DWC_OFFSET + DWC_PROFILE_ID_OFF, false);
        const friendCode = pidToFriendCode(profileId);

        const vrPoints = dv.getUint16(licBase + OFF_VR, false);
        const vsWins = dv.getInt32(licBase + OFF_VS_WINS, false);
        const vsLosses = dv.getInt32(licBase + OFF_VS_LOSSES, false);
        const firsts = dv.getInt32(licBase + OFF_FIRSTS, false);
        const distance = dv.getFloat32(licBase + OFF_DIST, false);
        const distance1st = dv.getFloat32(licBase + OFF_DIST1ST, false);

        licenses.push({
            index: i,
            name,
            profileId,
            friendCode,
            vrPoints,
            vsWins,
            vsLosses,
            firsts,
            distance,
            distance1st
        });
    }

    return licenses;
}