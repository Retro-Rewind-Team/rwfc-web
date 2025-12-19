import type { NeededStats, RankScore, RksysLicense, StatContribution } from "../types/tools";

// Ranking model constants (from Retro Rewind implementation)
const W_VR = 0.60;
const W_RWIN = 0.15;
const W_FIRSTS = 0.15;
const W_DIST = 0.05;
const W_DIST1ST = 0.05;

const AH = { VR: 100.0, RWIN: 55.0, FIRSTS: 100.0, DIST: 100.0, DIST1ST: 100.0 };
const AL = { VR: 5.0, RWIN: 50.0, FIRSTS: 0.0, DIST: 0.0, DIST1ST: 0.0 };

const M1 = W_VR * AH.VR + W_RWIN * AH.RWIN + W_FIRSTS * AH.FIRSTS + W_DIST * AH.DIST + W_DIST1ST * AH.DIST1ST;
const M2 = W_VR * AL.VR + W_RWIN * AL.RWIN + W_FIRSTS * AL.FIRSTS + W_DIST * AL.DIST + W_DIST1ST * AL.DIST1ST;

const ALPHA = 90.0 / (M1 - M2);
const BETA = 100.0 - ALPHA * M1;
const MIN_VS_MATCHES = 100;

const MAX_VR_FLOAT = 10000.0;
const MAX_VR_FANCY = 1000000.0;

const RANK_THRESH = [12, 24, 36, 48, 60, 72, 84, 94, 100];
const RANK_LABELS = ["0", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ"];

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

function toInternalVr(vrPoints: number): number {
    let v = Number(vrPoints);
    if (!isFinite(v)) v = 0;
    v = Math.round(v);
    v = clamp(v, 0, MAX_VR_FANCY);
    const rating = v / 100.0;
    return clamp(rating, 0, MAX_VR_FLOAT);
}

function scoreToRank(score: number): number {
    if (score >= 100.0) return 9;
    for (let i = RANK_THRESH.length - 1; i >= 0; i--) {
        if (score >= RANK_THRESH[i]) return i + 1;
    }
    return 0;
}

function nextThresholdFromScore(score: number): number | null {
    const r = scoreToRank(score);
    if (r >= 9) return null;
    return RANK_THRESH[r];
}

export function computeScore(license: RksysLicense): RankScore {
    const { vrPoints, vsWins, vsLosses, firsts, distance, distance1st } = license;
    const totalVs = vsWins + vsLosses;
    const winPct = totalVs > 0 ? (100.0 * vsWins / totalVs) : 45.0;

    const vrInternal = toInternalVr(vrPoints);
    let vrClamped = vrInternal;
    if (vrClamped > 1000.0) vrClamped = 1000.0;
    if (vrClamped < 0.0) vrClamped = 0.0;
    const vrNorm = (vrClamped / 1000.0) * 100.0;

    const firstsNorm = (firsts >= 2500.0) ? 100.0 : (100.0 * firsts / 2500.0);
    const distNorm = (distance >= 50000.0) ? 100.0 : (100.0 * distance / 50000.0);
    const dist1stNorm = (distance1st >= 10000.0) ? 100.0 : (100.0 * distance1st / 10000.0);

    const M = W_VR * vrNorm + W_RWIN * winPct + W_FIRSTS * firstsNorm + W_DIST * distNorm + W_DIST1ST * dist1stNorm;
    let score = clamp(ALPHA * M + BETA, 0, 100);

    const meetsRaceReq = (totalVs >= MIN_VS_MATCHES);
    if (!meetsRaceReq) {
        score = 0.0;
    }

    const rank = scoreToRank(score);
    const rankLabel = RANK_LABELS[rank] || String(rank);

    return {
        score,
        rank,
        rankLabel,
        M,
        winPct,
        vrNorm,
        firstsNorm,
        distNorm,
        dist1stNorm,
        totalVs,
        meetsRaceReq
    };
}

// Type for the totals/parts objects
type StatKey = "VR" | "RWIN" | "FIRSTS" | "DIST" | "DIST1ST";
type StatWeights = Record<StatKey, number>;

export function calculateNeededStats(license: RksysLicense): NeededStats {
    const cur = computeScore(license);
    const thr = nextThresholdFromScore(cur.score);
    
    if (thr == null) {
        return { threshold: null, M_req: 0, byStat: null };
    }

    const M_req = (thr - BETA) / ALPHA;
    const totals: StatWeights = { VR: W_VR, RWIN: W_RWIN, FIRSTS: W_FIRSTS, DIST: W_DIST, DIST1ST: W_DIST1ST };

    const otherSum = (omit: StatKey): number => {
        const parts: StatWeights = {
            VR: cur.vrNorm,
            RWIN: cur.winPct,
            FIRSTS: cur.firstsNorm,
            DIST: cur.distNorm,
            DIST1ST: cur.dist1stNorm
        };
        let s = 0;
        for (const k of Object.keys(parts) as StatKey[]) {
            if (k !== omit) s += totals[k] * parts[k];
        }
        return s;
    };

    const solveNorm = (omit: StatKey): number => {
        const sumOthers = otherSum(omit);
        const w = totals[omit];
        return (M_req - sumOthers) / w;
    };

    const vrNormReq = solveNorm("VR");
    const winPctReq = solveNorm("RWIN");
    const firstsNormReq = solveNorm("FIRSTS");
    const distNormReq = solveNorm("DIST");
    const dist1stNormReq = solveNorm("DIST1ST");

    const vrInternalRaw = clamp(Math.ceil(vrNormReq * 10.0), 0, 1000.0);
    const vrRaw = Math.round(vrInternalRaw * 100.0);

    const winPctRaw = clamp(Math.ceil(winPctReq * 100) / 100, 0, 100);
    const firstsRaw = clamp(Math.ceil(firstsNormReq * 25.0), 0, 2500);
    const distRaw = clamp(Math.ceil(distNormReq * 500.0), 0, 50000);
    const dist1Raw = clamp(Math.ceil(dist1stNormReq * 100.0), 0, 10000);

    const feas = (normReq: number): "ok" | "warn" | "bad" => 
        normReq <= 100 ? "ok" : (normReq <= 110 ? "warn" : "bad");

    const totalVs = license.vsWins + license.vsLosses;
    let extraWins = "—";
    if (totalVs > 0 && winPctRaw > cur.winPct) {
        const p = winPctRaw / 100.0;
        const w = license.vsWins;
        const t = totalVs;
        if (p >= 1) {
            extraWins = "unbounded";
        } else {
            const x = Math.ceil((p * t - w) / (1 - p));
            extraWins = String(x > 0 ? x : 0);
        }
    }

    return {
        threshold: thr,
        M_req,
        byStat: {
            VR: { neededNorm: vrNormReq, neededRaw: vrRaw, unit: "VR", feasibility: feas(vrNormReq) },
            WinPct: { neededNorm: winPctReq, neededRaw: winPctRaw, unit: "%", feasibility: feas(winPctReq), extraWins },
            Firsts: { neededNorm: firstsNormReq, neededRaw: firstsRaw, unit: "times", feasibility: feas(firstsNormReq) },
            Distance: { neededNorm: distNormReq, neededRaw: distRaw, unit: "m", feasibility: feas(distNormReq) },
            Dist1st: { neededNorm: dist1stNormReq, neededRaw: dist1Raw, unit: "m", feasibility: feas(dist1stNormReq) }
        }
    };
}

export function computeContributions(license: RksysLicense): Record<string, StatContribution> {
    const { score, vrNorm, winPct, firstsNorm, distNorm, dist1stNorm } = computeScore(license);
    
    const parts: Record<StatKey, { w: number; norm: number }> = {
        VR: { w: W_VR, norm: vrNorm },
        RWIN: { w: W_RWIN, norm: winPct },
        FIRSTS: { w: W_FIRSTS, norm: firstsNorm },
        DIST: { w: W_DIST, norm: distNorm },
        DIST1ST: { w: W_DIST1ST, norm: dist1stNorm }
    };

    const Mi: Record<string, number> = {};
    let sumMi = 0;
    for (const [k, v] of Object.entries(parts)) {
        Mi[k] = v.w * v.norm;
        sumMi += Mi[k];
    }

    const preSum = ALPHA * sumMi;
    const delta = score - preSum;

    const out: Record<string, StatContribution> = {};
    const keys = Object.keys(parts) as StatKey[];
    for (const k of keys) {
        const shareM = sumMi > 0 ? (Mi[k] / sumMi) : (1 / keys.length);
        const pointsTrue = (ALPHA * Mi[k]) + shareM * delta;
        const shareFinal = score > 0 ? 100 * (pointsTrue / score) : 0;
        out[k] = { points: pointsTrue, share: shareFinal };
    }
    return out;
}