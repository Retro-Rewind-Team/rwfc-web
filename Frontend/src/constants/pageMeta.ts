import pageMetaJson from "./pageMeta.json";

export interface RouteMeta {
    path: string;
    title: string;
    description: string;
}

interface AliasMeta {
    path: string;
    canonicalPath: string;
}

interface DynamicMeta {
    title: string;
    description: string;
}

export const SITE_NAME: string = pageMetaJson.siteName;
export const SITE_DOMAIN: string = pageMetaJson.domain;
export const DEFAULT_OG_IMAGE: string = pageMetaJson.imagePath;

export const PAGE_ROUTES: RouteMeta[] = pageMetaJson.routes;
export const PAGE_ALIASES: AliasMeta[] = pageMetaJson.aliases;

export function getRouteMeta(path: string): RouteMeta {
    const found = PAGE_ROUTES.find((route) => route.path === path);
    if (!found) {
        throw new Error(`No page metadata configured for route "${path}"`);
    }
    return found;
}

export const HOME_META = getRouteMeta("/");
export const VR_LEADERBOARD_META = getRouteMeta("/vr");
export const TT_LEADERBOARD_META = getRouteMeta("/tt");
export const TT_RANKINGS_META = getRouteMeta("/timetrial/rankings");
export const ROOM_BROWSER_META = getRouteMeta("/rooms");
export const DOWNLOADS_META = getRouteMeta("/downloads");
export const TEAM_META = getRouteMeta("/team");
export const RULES_META = getRouteMeta("/rules");
export const PRIVACY_META = getRouteMeta("/privacy");
export const RACE_STATS_META = getRouteMeta("/stats");
export const RACES_META = getRouteMeta("/races");
export const TOOLS_META = getRouteMeta("/tools");
export const FONT_PATCHER_META = getRouteMeta("/tools/font-patcher");
export const RATING_EDITOR_META = getRouteMeta("/tools/rating-editor");
export const VR_CALCULATOR_META = getRouteMeta("/tools/vr-calculator");
export const RANK_HELPER_META = getRouteMeta("/tools/rank-helper");

export const NOT_FOUND_META: RouteMeta = { path: "*", ...pageMetaJson.notFound };

export const DYNAMIC_META_DEFAULTS: Record<
    "leaderboardPlayer" | "ttPlayerProfile" | "ttTrackDetail",
    DynamicMeta
> = pageMetaJson.dynamicDefaults;
