import { BadgeId, badgeInfo } from "../../../constants/badgeData";
import Tooltip from "../../common/Tooltip";
import WhWzDevBadge from "./badges/WhWzDevBadge";
import RrDevBadge from "./badges/RrDevBadge";
import TranslatorBadge from "./badges/TranslatorBadge";
import ContributorBadge from "./badges/ContributorBadge";
import MajorContributorBadge from "./badges/MajorContributorBadge";
import RWFCModeratorBadge from "./badges/RWFCModeratorBadge";
import DiscordStaffBadge from "./badges/DiscordStaffBadge";
import SupporterBadge from "./badges/SupporterBadge";
import BetaTesterBadge from "./badges/BetaTesterBadge";
import HeartBadge from "./badges/HeartBadge";
import MedalBadge from "./badges/MedalBadge";

interface BadgeProps {
    variant: number;
    size?: "sm" | "md" | "lg";
}

function BadgeSVG(props: { variant: number }) {
    switch (props.variant) {
        case BadgeId.WheelWizardDeveloper:
            return <WhWzDevBadge />;
        case BadgeId.RetroRewindDeveloper:
            return <RrDevBadge />;
        case BadgeId.Translator:
            return <TranslatorBadge />;
        case BadgeId.Contributor:
            return <ContributorBadge />;
        case BadgeId.MajorContributor:
            return <MajorContributorBadge />;
        case BadgeId.RWFCModerator:
            return <RWFCModeratorBadge />;
        case BadgeId.DiscordStaff:
            return <DiscordStaffBadge />;
        case BadgeId.Supporter:
            return <SupporterBadge />;
        case BadgeId.BetaTester:
            return <BetaTesterBadge />;
        case BadgeId.Heart:
            return <HeartBadge />;
        default:
            return <MedalBadge tier={badgeInfo[props.variant].tier!} />;
    }
}

export default function Badge(props: BadgeProps) {
    const size = () => props.size || "sm";
    const info = () => badgeInfo[props.variant];

    const sizeClass = () => {
        switch (size()) {
            case "sm":
                return "w-7 h-7";
            case "md":
                return "w-9 h-9";
            case "lg":
                return "w-12 h-12";
        }
    };

    return (
        // The wrapper div and its `group` existed to lay out a label beside the badge. No caller
        // ever asked for that label, so the hover effects move onto the badge itself. Dropped with
        // it: cursor-pointer, which promised a click nothing handles, and hover:shadow-xl, which
        // drew a rectangular shadow around a transparent square.
        <Tooltip text={info().tooltip}>
            <div
                class={`${sizeClass()} flex-shrink-0 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5`}
            >
                <BadgeSVG variant={props.variant} />
            </div>
        </Tooltip>
    );
}
