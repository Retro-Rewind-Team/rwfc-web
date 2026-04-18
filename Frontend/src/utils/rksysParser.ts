const LIC_BASES = [0x08, 0x8cc8, 0x11988, 0x1a648] as const;

const OFF = {
    MII_NAME: 0x14,
    VR: 0xb0,
    VS_WINS: 0x98,
    VS_LOSSES: 0x9c,
    FIRSTS: 0xdc,
    DIST: 0xc4,
    DIST1ST: 0xe0,
    DWC: 0x40,
    DWC_PROFILE_ID: 0x1c,
} as const;

const REGION_ID_OFFSET = 0x26b0a;

const REGION_MAP: Record<number, string> = {
    0x0000: "Japan",
    0x1000: "Americas",
    0x2000: "Europe",
    0x3000: "Australia / NZ",
    0x4000: "Taiwan",
    0x5000: "South Korea",
    0x6000: "China",
};

// Score formula constants - calibrated against known rank thresholds
const W_VR = 0.6;
const W_WIN = 0.15;
const W_FIRSTS = 0.15;
const W_DIST = 0.05;
const W_DIST1ST = 0.05;

const AH = { VR: 100, WIN: 55, FIRSTS: 100, DIST: 100, DIST1ST: 100 };
const AL = { VR: 5, WIN: 50, FIRSTS: 0, DIST: 0, DIST1ST: 0 };
const M1 =
    W_VR * AH.VR +
    W_WIN * AH.WIN +
    W_FIRSTS * AH.FIRSTS +
    W_DIST * AH.DIST +
    W_DIST1ST * AH.DIST1ST;
const M2 =
    W_VR * AL.VR +
    W_WIN * AL.WIN +
    W_FIRSTS * AL.FIRSTS +
    W_DIST * AL.DIST +
    W_DIST1ST * AL.DIST1ST;

export const RANK_ALPHA = 90 / (M1 - M2);
export const RANK_BETA = 100 - RANK_ALPHA * M1;

export const MAX_VR_INTERNAL = 1000;
export const MAX_FIRSTS = 2250;
export const MAX_DIST = 40000;
export const MAX_DIST1ST = 10000;
export const MIN_VS_FOR_RANK = 100;

export const RANK_THRESHOLDS = [24, 36, 48, 60, 72, 84, 94, 100] as const;
export const RANK_NAMES = ["-", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"] as const;

export interface LicenseStats {
    miiName: string;
    profileId: number;
    vrPoints: number;
    vsWins: number;
    vsLosses: number;
    firsts: number;
    dist: number;
    dist1st: number;
}

export interface LicenseScore {
    score: number;
    rank: number;
    M: number;
    vrNorm: number;
    winPct: number;
    firstsNorm: number;
    distNorm: number;
    dist1stNorm: number;
    totalVs: number;
    meetsRaceReq: boolean;
}

export interface StatNeed {
    neededRaw: number;
    feasibility: "ok" | "warn" | "infeasible";
}

export interface WinPctNeed extends StatNeed {
    extraWins: number | null;
}

export interface RankNeeds {
    threshold: number;
    vr: StatNeed;
    winPct: WinPctNeed;
    firsts: StatNeed;
    dist: StatNeed;
    dist1st: StatNeed;
}

export interface RksysFile {
    region: string;
    licenses: (LicenseStats | null)[];
}

function hasBytes(dv: DataView, off: number, len: number): boolean {
    return off >= 0 && off + len <= dv.byteLength;
}

function readUtf16BE(dv: DataView, off: number, maxChars: number): string {
    let s = "";
    for (let i = 0; i < maxChars; i++) {
        if (!hasBytes(dv, off + i * 2, 2)) break;
        const code = dv.getUint16(off + i * 2, false);
        if (code === 0) break;
        s += String.fromCodePoint(code);
    }
    return s;
}

function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

export function parseRksys(buffer: ArrayBuffer): RksysFile {
    const dv = new DataView(buffer);

    let region = "Unknown";
    if (hasBytes(dv, REGION_ID_OFFSET, 2)) {
        const id = dv.getUint16(REGION_ID_OFFSET, false);
        region = REGION_MAP[id] ?? `Unknown (0x${id.toString(16).toUpperCase()})`;
    }

    const licenses: (LicenseStats | null)[] = LIC_BASES.map((base) => {
        if (!hasBytes(dv, base, 0x100)) return null;

        const miiName = readUtf16BE(dv, base + OFF.MII_NAME, 10);
        const profileId = hasBytes(dv, base + OFF.DWC + OFF.DWC_PROFILE_ID, 4)
            ? dv.getInt32(base + OFF.DWC + OFF.DWC_PROFILE_ID, false)
            : 0;
        const vrPoints = hasBytes(dv, base + OFF.VR, 2) ? dv.getUint16(base + OFF.VR, false) : 0;
        const vsWins = hasBytes(dv, base + OFF.VS_WINS, 4)
            ? dv.getInt32(base + OFF.VS_WINS, false)
            : 0;
        const vsLosses = hasBytes(dv, base + OFF.VS_LOSSES, 4)
            ? dv.getInt32(base + OFF.VS_LOSSES, false)
            : 0;
        const firsts = hasBytes(dv, base + OFF.FIRSTS, 4)
            ? dv.getInt32(base + OFF.FIRSTS, false)
            : 0;
        const dist = hasBytes(dv, base + OFF.DIST, 4) ? dv.getFloat32(base + OFF.DIST, false) : 0;
        const dist1st = hasBytes(dv, base + OFF.DIST1ST, 4)
            ? dv.getFloat32(base + OFF.DIST1ST, false)
            : 0;

        if (!miiName && profileId === 0) return null;

        return { miiName, profileId, vrPoints, vsWins, vsLosses, firsts, dist, dist1st };
    });

    return { region, licenses };
}

function vrToNorm(vrPoints: number): number {
    return clamp((vrPoints / 100 / MAX_VR_INTERNAL) * 100, 0, 100);
}

export function computeScore(stats: LicenseStats): LicenseScore {
    const totalVs = stats.vsWins + stats.vsLosses;
    const winPct = totalVs > 0 ? (100 * stats.vsWins) / totalVs : 45;
    const vrNorm = vrToNorm(stats.vrPoints);
    const firstsNorm = clamp((stats.firsts / MAX_FIRSTS) * 100, 0, 100);
    const distNorm = clamp((stats.dist / MAX_DIST) * 100, 0, 100);
    const dist1stNorm = clamp((stats.dist1st / MAX_DIST1ST) * 100, 0, 100);

    const M =
        W_VR * vrNorm +
        W_WIN * winPct +
        W_FIRSTS * firstsNorm +
        W_DIST * distNorm +
        W_DIST1ST * dist1stNorm;

    const meetsRaceReq = totalVs >= MIN_VS_FOR_RANK;
    const rawScore = clamp(RANK_ALPHA * M + RANK_BETA, 0, 100);
    const score = meetsRaceReq ? rawScore : 0;
    const rank = meetsRaceReq ? rankFromScore(rawScore) : 0;

    return {
        score,
        rank,
        M,
        vrNorm,
        winPct,
        firstsNorm,
        distNorm,
        dist1stNorm,
        totalVs,
        meetsRaceReq,
    };
}

export function rankFromScore(score: number): number {
    if (score >= 100) return 9;
    if (score >= 94) return 8;
    if (score >= 84) return 7;
    if (score >= 72) return 6;
    if (score >= 60) return 5;
    if (score >= 48) return 4;
    if (score >= 36) return 3;
    if (score >= 24) return 2;
    return 1;
}

function feasibility(normReq: number): "ok" | "warn" | "infeasible" {
    if (normReq <= 100) return "ok";
    if (normReq <= 110) return "warn";
    return "infeasible";
}

export function computeNeeds(stats: LicenseStats): RankNeeds | null {
    const cur = computeScore(stats);
    const effectiveRank = cur.meetsRaceReq
        ? cur.rank
        : rankFromScore(clamp(RANK_ALPHA * cur.M + RANK_BETA, 0, 100));

    if (effectiveRank >= 9) return null;

    const threshold = RANK_THRESHOLDS[effectiveRank - 1] ?? 24;
    const mReq = (threshold - RANK_BETA) / RANK_ALPHA;

    const parts = {
        vr: W_VR * cur.vrNorm,
        win: W_WIN * cur.winPct,
        firsts: W_FIRSTS * cur.firstsNorm,
        dist: W_DIST * cur.distNorm,
        dist1st: W_DIST1ST * cur.dist1stNorm,
    };

    const weights: Record<keyof typeof parts, number> = {
        vr: W_VR,
        win: W_WIN,
        firsts: W_FIRSTS,
        dist: W_DIST,
        dist1st: W_DIST1ST,
    };

    const otherSum = (exclude: keyof typeof parts) =>
        (Object.keys(parts) as (keyof typeof parts)[])
            .filter((k) => k !== exclude)
            .reduce((s, k) => s + parts[k], 0);

    const normReq = (key: keyof typeof parts) => (mReq - otherSum(key)) / weights[key];

    const vrNormReq = normReq("vr");
    const vrInternal = clamp(Math.ceil((vrNormReq / 100) * MAX_VR_INTERNAL), 0, MAX_VR_INTERNAL);
    const vrRaw = Math.round(vrInternal * 100);

    const winNormReq = normReq("win");
    const winRaw = clamp(Math.ceil(winNormReq * 100) / 100, 0, 100);
    const totalVs = stats.vsWins + stats.vsLosses;
    let extraWins: number | null = null;
    if (totalVs > 0 && winRaw > cur.winPct) {
        const p = winRaw / 100;
        extraWins = p >= 1 ? null : Math.max(0, Math.ceil((p * totalVs - stats.vsWins) / (1 - p)));
    }

    const firstsNormReq = normReq("firsts");
    const firstsRaw = clamp(Math.ceil((firstsNormReq / 100) * MAX_FIRSTS), 0, MAX_FIRSTS);

    const distNormReq = normReq("dist");
    const distRaw = clamp(Math.ceil((distNormReq / 100) * MAX_DIST), 0, MAX_DIST);

    const dist1stNormReq = normReq("dist1st");
    const dist1stRaw = clamp(Math.ceil((dist1stNormReq / 100) * MAX_DIST1ST), 0, MAX_DIST1ST);

    return {
        threshold,
        vr: { neededRaw: vrRaw, feasibility: feasibility(vrNormReq) },
        winPct: { neededRaw: winRaw, feasibility: feasibility(winNormReq), extraWins },
        firsts: { neededRaw: firstsRaw, feasibility: feasibility(firstsNormReq) },
        dist: { neededRaw: distRaw, feasibility: feasibility(distNormReq) },
        dist1st: { neededRaw: dist1stRaw, feasibility: feasibility(dist1stNormReq) },
    };
}
