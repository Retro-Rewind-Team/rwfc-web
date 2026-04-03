/**
 * Parser for Mario Kart Wii's rksys.dat save file. Extracts per-license
 * statistics (VR, wins/losses, distance, etc.) from the binary format.
 */
import type { RksysLicense } from "../types/tools";
import { pidToFriendCode } from "./friendCodeUtils";

/** Byte offset of each of the 4 license slots within rksys.dat. */
const LICENSE_OFFSETS = [0x08, 0x8cc8, 0x11988, 0x1a648];
/** Byte offset of the DWC (Nintendo Wi-Fi Connection) block within a license. */
const DWC_OFFSET = 0x40;
/** Byte offset of the profile ID within the DWC block. */
const DWC_PROFILE_ID_OFF = 0x1c;
// Stat offsets relative to the license base
const OFF_VS_WINS = 0x98;
const OFF_VS_LOSSES = 0x9c;
const OFF_VR = 0xb0;
const OFF_FIRSTS = 0xdc;   // Total 1st-place finishes
const OFF_DIST = 0xc4;     // Total distance raced (km, float32)
const OFF_DIST1ST = 0xe0;  // Distance raced while in 1st place (km, float32)

/** Reads the UTF-16BE Mii name from a license block. Returns "-" if empty. */
function readMiiName(dv: DataView, licBase: number): string {
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset + licBase + 0x14, 0x14);
    let s = "";
    for (let i = 0; i < bytes.length; i += 2) {
        const code = (bytes[i] << 8) | bytes[i + 1];
        if (!code) break;
        s += String.fromCharCode(code);
    }
    return s || "-";
}

/** Parses a raw rksys.dat `ArrayBuffer` and returns stats for all 4 license slots. */
export function parseRksysFile(buffer: ArrayBuffer): RksysLicense[] {
    const dv = new DataView(buffer);
    const licenses: RksysLicense[] = [];

    for (let i = 0; i < LICENSE_OFFSETS.length; i++) {
        const licBase = LICENSE_OFFSETS[i];
        const name = readMiiName(dv, licBase);
        const profileId = dv.getUint32(
            licBase + DWC_OFFSET + DWC_PROFILE_ID_OFF,
            false,
        );
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
            distance1st,
        });
    }

    return licenses;
}
