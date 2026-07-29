import { describe, expect, it } from "vitest";
import {
    getRouteMeta,
    HOME_META,
    PAGE_ALIASES,
    PAGE_ROUTES,
    VR_LEADERBOARD_META,
} from "../../constants/pageMeta";

describe("pageMeta", () => {
    it("returns metadata for a known route", () => {
        expect(getRouteMeta("/vr")).toEqual(VR_LEADERBOARD_META);
    });

    it("throws for an unknown route", () => {
        expect(() => getRouteMeta("/not-a-real-route")).toThrow(
            'No page metadata configured for route "/not-a-real-route"',
        );
    });

    it("includes the home route", () => {
        expect(HOME_META.path).toBe("/");
    });

    it("every alias points to a canonical path that exists in PAGE_ROUTES", () => {
        for (const alias of PAGE_ALIASES) {
            const canonical = PAGE_ROUTES.find((route) => route.path === alias.canonicalPath);
            expect(canonical, `alias ${alias.path} -> ${alias.canonicalPath}`).toBeDefined();
        }
    });
});
