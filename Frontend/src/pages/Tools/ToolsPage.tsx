import { A } from "@solidjs/router";
import { Calculator, ChevronRight, PenTool, Settings, Trophy } from "lucide-solid";
import { Meta, Title } from "@solidjs/meta";
import { AlertBox } from "../../components/common";
import { JSX } from "solid-js";
import { TOOLS_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";
import RankGlyphs from "../../components/ui/tools/RankGlyphs";

const tools: {
    id: string;
    title: string;
    icon: () => JSX.Element;
    description: string;
    path: string;
    /** What the visitor needs to bring, so they can tell at a glance whether a tool fits. */
    needs: string;
}[] = [
    {
        id: "font-patcher",
        title: "Font patcher",
        icon: () => <PenTool size={22} />,
        description:
            "Use a custom Font.szs without losing Retro Rewind's rank badges by copying in Retro Rewind's tt_kart_extension_font.brfnt.",
        path: "/tools/font-patcher",
        needs: "Your Font.szs",
    },
    {
        id: "rating-editor",
        title: "Rating editor",
        icon: () => <Settings size={22} />,
        description: "Edit the VR and BR your RRRating.pul file stores for each profile.",
        path: "/tools/rating-editor",
        needs: "Your RRRating.pul",
    },
    {
        id: "vr-calculator",
        title: "VR calculator",
        icon: () => <Calculator size={22} />,
        description:
            "Simulate a race with 2–12 players to see exact VR deltas, with modifier support.",
        path: "/tools/vr-calculator",
        needs: "Nothing, it runs on its own",
    },
    {
        id: "rank-helper",
        title: "Rank helper",
        icon: () => <Trophy size={22} />,
        description:
            "Load your rksys.dat to see your rank score and what stats you need for the next rank.",
        path: "/tools/rank-helper",
        needs: "Your rksys.dat save file",
    },
];

export default function ToolsPage() {
    return (
        <>
            <PageHeader
                page="tools"
                title="Community tools"
                description="Utilities made by the Retro Rewind community, from a VR calculator to save file editors. They run in your browser."
                visual={<RankGlyphs />}
            />
            <div class="space-y-8">
                <Title>{TOOLS_META.title}</Title>
                <Meta name="description" content={TOOLS_META.description} />
                {/* Header */}

                <ul class="grid gap-4 md:grid-cols-2">
                    {tools.map((tool) => (
                        <li>
                            <A
                                href={tool.path}
                                class="group flex h-full gap-4 rounded-lg border border-line bg-canvas p-5 transition-colors hover:border-line-strong hover:bg-surface sm:p-6"
                            >
                                <span
                                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line text-fg-muted transition-colors group-hover:text-accent-text"
                                    aria-hidden="true"
                                >
                                    {tool.icon()}
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center justify-between gap-3">
                                        <h2 class="type-heading text-fg">{tool.title}</h2>
                                        <ChevronRight
                                            size={18}
                                            aria-hidden="true"
                                            class="shrink-0 text-fg-subtle transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-fg"
                                        />
                                    </div>
                                    <p class="mt-1 text-sm text-fg-muted">{tool.description}</p>
                                    <p class="mt-3 text-xs text-fg-subtle">
                                        <span class="font-medium text-fg-muted">You need:</span>{" "}
                                        {tool.needs}
                                    </p>
                                </div>
                            </A>
                        </li>
                    ))}
                </ul>

                {/* Info */}
                <AlertBox type="info">
                    <p>
                        Made by community members for the Retro Rewind community. Have a tool to
                        contribute? Reach out on Discord!
                    </p>
                </AlertBox>
            </div>
        </>
    );
}
