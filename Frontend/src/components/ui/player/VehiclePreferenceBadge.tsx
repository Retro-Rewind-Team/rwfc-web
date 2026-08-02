import { Bike, Car, type LucideIcon, Shuffle } from "lucide-solid";
import { Dynamic } from "solid-js/web";
import { Tooltip } from "../../common";

interface VehiclePreferenceBadgeProps {
    vehiclePreference: "kart" | "bike" | null;
    vehicleRank: number | null;
}

function configFor(vehiclePreference: "kart" | "bike" | null): {
    icon: LucideIcon;
    label: string;
    class: string;
} {
    switch (vehiclePreference) {
        case "kart":
            return {
                icon: Car,
                label: "Kart Main",
                class: "bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
            };
        case "bike":
            return {
                icon: Bike,
                label: "Bike Main",
                class: "bg-orange-200 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
            };
        default:
            return {
                icon: Shuffle,
                label: "Mixed",
                class: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
            };
    }
}

function tooltipFor(vehiclePreference: "kart" | "bike" | null, vehicleRank: number | null): string {
    if (vehiclePreference === "kart") {
        return vehicleRank !== null
            ? `Ranked #${vehicleRank} among Kart Mains`
            : "This player mainly races karts";
    }
    if (vehiclePreference === "bike") {
        return vehicleRank !== null
            ? `Ranked #${vehicleRank} among Bike Mains`
            : "This player mainly races bikes";
    }
    return "This player races karts and bikes about equally";
}

export default function VehiclePreferenceBadge(props: VehiclePreferenceBadgeProps) {
    const config = () => configFor(props.vehiclePreference);
    const label = () =>
        props.vehicleRank !== null ? `${config().label} #${props.vehicleRank}` : config().label;
    const tooltip = () => tooltipFor(props.vehiclePreference, props.vehicleRank);

    return (
        <Tooltip text={tooltip()}>
            <span
                class={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap cursor-help ${config().class}`}
            >
                <Dynamic component={config().icon} size={14} />
                {label()}
            </span>
        </Tooltip>
    );
}
