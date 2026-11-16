import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const pageMetaPath = path.join(rootDir, "src", "constants", "pageMeta.json");

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const manifestDir = path.join(distDir, ".vite");
const appPath = path.join(rootDir, "src", "App.tsx");

/*
 * The largest image above the fold, per route. Without a hint the browser only finds it after
 * the main bundle has downloaded and run. Keep in sync with Hero.tsx and pageHeaders.ts.
 */
const LCP_IMAGES = {
    "/": "/RetroRewindLogo.webp",
    "/downloads": "/RetroRewindLogo.webp",
};

/*
 * Maps each route path in App.tsx to the source file of its lazy page, e.g.
 * "/team" -> "src/pages/Team/TeamPage.tsx". Read from App.tsx so a new route needs no extra
 * config; verify-meta.mjs fails the build if a lazy route ends up with no hint.
 */
export function lazyRouteSources(appSource) {
    const sources = new Map();
    for (const m of appSource.matchAll(/const (\w+) = lazy\(\s*\(\) => import\("\.\/([^"]+)"\)/g)) {
        sources.set(m[1], `src/${m[2]}.tsx`);
    }
    const routes = new Map();
    for (const m of appSource.matchAll(/<Route\s+path="([^"]+)"\s+component=\{(\w+)\}/g)) {
        const source = sources.get(m[2]);
        if (source) routes.set(m[1].startsWith("/") ? m[1] : `/${m[1]}`, source);
    }
    return routes;
}

/*
 * The page's own chunk plus every chunk it statically imports, excluding the entry (which the
 * HTML already loads). With these in the head, a direct visit downloads the page's code in
 * parallel with the main bundle instead of after it.
 */
export function chunkFiles(manifest, source) {
    const files = [];
    const seen = new Set();
    const visit = (key) => {
        const chunk = manifest[key];
        if (!chunk || seen.has(key) || chunk.isEntry) return;
        seen.add(key);
        files.push(chunk.file);
        for (const dep of chunk.imports ?? []) visit(dep);
    };
    visit(source);
    return files;
}

export function buildPageHtml(templateHtml, { title, description, canonicalUrl, imageUrl, siteName, preloads = [] }) {
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);

    let html = templateHtml
        .replace(/<title[^>]*>.*?<\/title>/s, `<title data-sm="pre">${safeTitle}</title>`)
        .replace(/\s*<meta[^>]*name="description"[^>]*\/?>/s, "");

    const canonicalTag = canonicalUrl ? `    <link rel="canonical" href="${canonicalUrl}" />\n` : "";
    const ogUrlTag = canonicalUrl ? `    <meta property="og:url" content="${canonicalUrl}" />\n` : "";

    const preloadTags = preloads.map((tag) => `    ${tag}\n`).join("");

    const metaBlock = `${preloadTags}${canonicalTag}    <meta data-sm="pre-desc" name="description" content="${safeDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
${ogUrlTag}    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(siteName)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>`;

    return html.replace("</head>", metaBlock);
}

/*
 * Only canonical routes go in the sitemap. Aliases point at their canonical page, and dynamic
 * pages (players, tracks) are discovered by crawling the leaderboards.
 */
function writeSitemap(domain, routes) {
    const urls = routes
        .map((route) => `  <url><loc>${domain}${route.path === "/" ? "/" : route.path}</loc></url>`)
        .join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
    writeFileSync(path.join(distDir, "sitemap.xml"), xml, "utf-8");
    console.log("Wrote sitemap.xml");
}

function main() {
    if (!existsSync(distDir)) {
        throw new Error(`dist directory not found at ${distDir}. Run "vite build" first.`);
    }

    const pageMeta = JSON.parse(readFileSync(pageMetaPath, "utf-8"));
    const { siteName, domain, imagePath, routes, aliases } = pageMeta;
    const imageUrl = `${domain}${imagePath}`;

    const templatePath = path.join(distDir, "index.html");
    const template = readFileSync(templatePath, "utf-8");

    const homeRoute = routes.find((route) => route.path === "/");
    if (!homeRoute) {
        throw new Error('pageMeta.json must include a route with path "/"');
    }

    const manifestPath = path.join(manifestDir, "manifest.json");
    const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf-8")) : {};
    const routeSources = lazyRouteSources(readFileSync(appPath, "utf-8"));

    function preloadsFor(routePath) {
        const tags = [];
        const image = LCP_IMAGES[routePath];
        if (image) tags.push(`<link rel="preload" as="image" href="${image}" fetchpriority="high" />`);
        const source = routeSources.get(routePath);
        for (const file of source ? chunkFiles(manifest, source) : []) {
            tags.push(`<link rel="modulepreload" crossorigin href="/${file}" />`);
        }
        return tags;
    }

    function writeRouteFile(routePath, meta, canonicalUrl) {
        const html = buildPageHtml(template, {
            title: meta.title,
            description: meta.description,
            canonicalUrl,
            imageUrl,
            siteName,
            preloads: preloadsFor(routePath),
        });

        const outPath = routePath === "/" ? templatePath : path.join(distDir, routePath, "index.html");

        mkdirSync(path.dirname(outPath), { recursive: true });
        writeFileSync(outPath, html, "utf-8");
        console.log(`Wrote ${path.relative(distDir, outPath) || "index.html"}`);
    }

    // The home page gets a canonical too: without one, "/" and "/index.html" (and any tracking
    // query strings) can be indexed as separate pages.
    writeRouteFile("/", homeRoute, `${domain}/`);

    for (const route of routes) {
        if (route.path === "/") continue;
        writeRouteFile(route.path, route, `${domain}${route.path}`);
    }

    for (const alias of aliases) {
        const canonical = routes.find((route) => route.path === alias.canonicalPath);
        if (!canonical) {
            throw new Error(`Alias ${alias.path} points to unknown canonicalPath ${alias.canonicalPath}`);
        }
        writeRouteFile(alias.path, canonical, `${domain}${alias.canonicalPath}`);
    }

    writeSitemap(domain, routes);

    // Build-time input only; no reason to publish the map of source files to chunks.
    rmSync(manifestDir, { recursive: true, force: true });

    console.log(`Generated metadata for ${routes.length} routes and ${aliases.length} aliases.`);
}

main();
