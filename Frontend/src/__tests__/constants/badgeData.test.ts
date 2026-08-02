import { describe, expect, it } from "vitest";
import { BadgeId, badgeInfo } from "../../constants/badgeData";

describe("badgeData", () => {
    it("keeps BadgeId ordinals matching the wfc-bot registry", () => {
        expect(BadgeId.RetroRewindDeveloper).toBe(0);
        expect(BadgeId.WheelWizardDeveloper).toBe(1);
        expect(BadgeId.MajorContributor).toBe(2);
        expect(BadgeId.RWFCModerator).toBe(100);
        expect(BadgeId.DiscordStaff).toBe(101);
        expect(BadgeId.Contributor).toBe(1000);
        expect(BadgeId.Translator).toBe(1001);
        expect(BadgeId.Supporter).toBe(1002);
        expect(BadgeId.BetaTester).toBe(1003);
        expect(BadgeId.Heart).toBe(1004);
        expect(BadgeId.FireStarterGold).toBe(2000);
        expect(BadgeId.FireStarterSilver).toBe(2001);
        expect(BadgeId.FireStarterBronze).toBe(2002);
        expect(BadgeId.LeafStruckGold).toBe(2003);
        expect(BadgeId.LeafStruckSilver).toBe(2004);
        expect(BadgeId.LeafStruckBronze).toBe(2005);
        expect(BadgeId.SummitShowdownGold).toBe(2006);
        expect(BadgeId.SummitShowdownSilver).toBe(2007);
        expect(BadgeId.SummitShowdownBronze).toBe(2008);
        expect(BadgeId.HorizonGold).toBe(2009);
        expect(BadgeId.HorizonSilver).toBe(2010);
        expect(BadgeId.HorizonBronze).toBe(2011);
        expect(BadgeId.SunblossomGold).toBe(2012);
        expect(BadgeId.SunblossomSilver).toBe(2013);
        expect(BadgeId.SunblossomBronze).toBe(2014);
        expect(BadgeId.EarthboundGold).toBe(2015);
        expect(BadgeId.EarthboundSilver).toBe(2016);
        expect(BadgeId.EarthboundBronze).toBe(2017);
        expect(BadgeId.BotBGold).toBe(2018);
        expect(BadgeId.BotBSilver).toBe(2019);
        expect(BadgeId.BotBBronze).toBe(2020);
    });

    it("has a badgeInfo entry for every BadgeId value", () => {
        for (const id of Object.values(BadgeId).filter((v): v is number => typeof v === "number")) {
            expect(badgeInfo[id], `badgeInfo[${id}]`).toBeDefined();
        }
    });

    it("assigns a tier to every tournament badge and no tier to non-tournament badges", () => {
        const tournamentIds: number[] = [
            BadgeId.FireStarterGold,
            BadgeId.FireStarterSilver,
            BadgeId.FireStarterBronze,
            BadgeId.LeafStruckGold,
            BadgeId.LeafStruckSilver,
            BadgeId.LeafStruckBronze,
            BadgeId.SummitShowdownGold,
            BadgeId.SummitShowdownSilver,
            BadgeId.SummitShowdownBronze,
            BadgeId.HorizonGold,
            BadgeId.HorizonSilver,
            BadgeId.HorizonBronze,
            BadgeId.SunblossomGold,
            BadgeId.SunblossomSilver,
            BadgeId.SunblossomBronze,
            BadgeId.EarthboundGold,
            BadgeId.EarthboundSilver,
            BadgeId.EarthboundBronze,
            BadgeId.BotBGold,
            BadgeId.BotBSilver,
            BadgeId.BotBBronze,
        ];

        for (const id of tournamentIds) {
            expect(badgeInfo[id].tier, `badgeInfo[${id}].tier`).toBeDefined();
        }

        const nonTournamentIds = Object.values(BadgeId)
            .filter((v): v is number => typeof v === "number")
            .filter((id) => !tournamentIds.includes(id));
        for (const id of nonTournamentIds) {
            expect(badgeInfo[id].tier, `badgeInfo[${id}].tier`).toBeUndefined();
        }
    });
});
