import { describe, expect, it } from "vitest";
import { BadgeId, badgeInfo } from "../../constants/badgeData";

describe("badgeData", () => {
    it("keeps BadgeId ordinals matching the wfc-bot registry", () => {
        expect(BadgeId.RetroRewindDeveloper).toBe(0);
        expect(BadgeId.WheelWizardDeveloper).toBe(1);
        expect(BadgeId.Contributor).toBe(2);
        expect(BadgeId.RWFCModerator).toBe(3);
        expect(BadgeId.DiscordStaff).toBe(4);
        expect(BadgeId.TranslatorLead).toBe(5);
        expect(BadgeId.Translator).toBe(6);
        expect(BadgeId.Supporter).toBe(7);
        expect(BadgeId.BetaTester).toBe(8);
        expect(BadgeId.Heart).toBe(9);
        expect(BadgeId.FireStarterGold).toBe(10);
        expect(BadgeId.FireStarterSilver).toBe(11);
        expect(BadgeId.FireStarterBronze).toBe(12);
        expect(BadgeId.LeafStruckGold).toBe(13);
        expect(BadgeId.LeafStruckSilver).toBe(14);
        expect(BadgeId.LeafStruckBronze).toBe(15);
        expect(BadgeId.SummitShowdownGold).toBe(16);
        expect(BadgeId.SummitShowdownSilver).toBe(17);
        expect(BadgeId.SummitShowdownBronze).toBe(18);
    });

    it("has a badgeInfo entry for every BadgeId value", () => {
        for (const id of Object.values(BadgeId)) {
            expect(badgeInfo[id], `badgeInfo[${id}]`).toBeDefined();
        }
    });

    it("assigns a tier to every tournament badge and no tier to non-tournament badges", () => {
        const tournamentIds: number[] = [
            BadgeId.FireStarterGold, BadgeId.FireStarterSilver, BadgeId.FireStarterBronze,
            BadgeId.LeafStruckGold, BadgeId.LeafStruckSilver, BadgeId.LeafStruckBronze,
            BadgeId.SummitShowdownGold, BadgeId.SummitShowdownSilver, BadgeId.SummitShowdownBronze,
        ];

        for (const id of tournamentIds) {
            expect(badgeInfo[id].tier, `badgeInfo[${id}].tier`).toBeDefined();
        }

        const nonTournamentIds = Object.values(BadgeId).filter((id) => !tournamentIds.includes(id));
        for (const id of nonTournamentIds) {
            expect(badgeInfo[id].tier, `badgeInfo[${id}].tier`).toBeUndefined();
        }
    });
});
