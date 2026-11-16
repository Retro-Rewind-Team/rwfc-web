import pageMeta from "../../constants/pageMeta.json";
import { apiRequest } from "./client";

export interface SearchResult {
    title: string;
    subtitle: string;
    href: string;
    category: "Pages" | "Tools" | "Players" | "Tracks";
}

const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

export function searchPages(query: string): SearchResult[] {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    return pageMeta.routes
        .map((route) => ({
            title: route.path === "/" ? "Home" : route.title.split(" | ")[0],
            subtitle: route.description,
            href: route.path,
            category: (route.path.startsWith("/tools/")
                ? "Tools"
                : "Pages") as SearchResult["category"],
        }))
        .filter((result) =>
            words.every((word) =>
                normalize(`${result.title} ${result.subtitle} ${result.href}`).includes(word),
            ),
        )
        .sort((a, b) => {
            const titleScore = (result: SearchResult) =>
                words.filter((word) => normalize(result.title).includes(word)).length;
            return titleScore(b) - titleScore(a);
        })
        .slice(0, words.length ? 8 : pageMeta.routes.length);
}

export function searchContent(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    return apiRequest(`/search?q=${encodeURIComponent(query)}`, { signal });
}
