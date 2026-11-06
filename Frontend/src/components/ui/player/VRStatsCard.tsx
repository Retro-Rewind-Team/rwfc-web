import { getVRGainClass } from "../../../utils";

interface VRStatsCardProps {
    value: number;
    label: string;
}

export default function VRStatsCard(props: VRStatsCardProps) {
    return (
        <div class="bg-canvas rounded-lg border border-line p-6 text-center">
            <div class={`text-3xl font-semibold mb-2 ${getVRGainClass(props.value)}`}>
                {props.value >= 0 ? "+" : ""}
                {props.value}
            </div>
            <div class="text-fg-muted font-medium">{props.label}</div>
        </div>
    );
}
