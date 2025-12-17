import { getVRGainClass } from "../../utils";

interface VRStatsCardProps {
    value: number;
    label: string;
}

export default function VRStatsCard(props: VRStatsCardProps) {
    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 text-center">
            <div
                class={`text-3xl font-bold mb-2 ${getVRGainClass(props.value)}`}
            >
                {props.value >= 0 ? "+" : ""}
                {props.value}
            </div>
            <div class="text-gray-600 dark:text-gray-400 font-medium">
                {props.label}
            </div>
        </div>
    );
}