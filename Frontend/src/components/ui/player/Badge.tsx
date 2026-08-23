import { Show } from "solid-js";
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
    showLabel?: boolean;
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
        <div class="inline-flex items-center gap-2 group">
            <Tooltip text={info().tooltip}>
                <div
                    class={`${sizeClass()} flex-shrink-0 transition-all duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-0.5 hover:shadow-xl cursor-pointer`}
                >
                    <BadgeSVG variant={props.variant} />
                </div>
            </Tooltip>

            {/* Label */}
            <Show when={props.showLabel}>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-tight">
                    {info().label}
                </span>
            </Show>
        </div>
    );
}
