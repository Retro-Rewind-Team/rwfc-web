import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

export function buildPageHtml(templateHtml, { title, description, canonicalUrl, imageUrl, siteName }) {
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);

    let html = templateHtml
        .replace(/<title[^>]*>.*?<\/title>/s, `<title data-sm="pre">${safeTitle}</title>`)
        .replace(/\s*<meta[^>]*name="description"[^>]*\/?>/s, "");

    const canonicalTag = canonicalUrl ? `    <link rel="canonical" href="${canonicalUrl}" />\n` : "";
    const ogUrlTag = canonicalUrl ? `    <meta property="og:url" content="${canonicalUrl}" />\n` : "";

    const metaBlock = `${canonicalTag}    <meta data-sm="pre-desc" name="description" content="${safeDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
${ogUrlTag}    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>`;

    return html.replace("</head>", metaBlock);
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

    function writeRouteFile(routePath, meta, canonicalUrl) {
        const html = buildPageHtml(template, {
            title: meta.title,
            description: meta.description,
            canonicalUrl,
            imageUrl,
            siteName,
        });

        const outPath = routePath === "/" ? templatePath : path.join(distDir, routePath, "index.html");

        mkdirSync(path.dirname(outPath), { recursive: true });
        writeFileSync(outPath, html, "utf-8");
        console.log(`Wrote ${path.relative(distDir, outPath) || "index.html"}`);
    }

    writeRouteFile("/", homeRoute, null);

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

    console.log(`Generated metadata for ${routes.length} routes and ${aliases.length} aliases.`);
}

main();
