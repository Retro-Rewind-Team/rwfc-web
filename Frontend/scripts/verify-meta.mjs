import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const pageMetaPath = path.join(rootDir, "src", "constants", "pageMeta.json");

const pageMeta = JSON.parse(readFileSync(pageMetaPath, "utf-8"));
const { domain, routes, aliases } = pageMeta;

// Matches the escaping generate-meta.mjs applies when writing titles into HTML
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function checkFile(routePath, expectedTitle, expectedDescription, expectedCanonical) {
    const filePath =
        routePath === "/" ? path.join(distDir, "index.html") : path.join(distDir, routePath, "index.html");

    assert.ok(existsSync(filePath), `Missing generated file for "${routePath}": ${filePath}`);

    const html = readFileSync(filePath, "utf-8");
    const escapedTitle = escapeHtml(expectedTitle); // Compare against the escaped form
    const escapedDescription = escapeHtml(expectedDescription);

    assert.ok(
        html.includes(`<title data-sm="pre">${escapedTitle}</title>`),
        `"${routePath}": expected <title data-sm="pre">${escapedTitle}</title>`,
    );
    assert.ok(
        html.includes(`<meta data-sm="pre-desc" name="description" content="${escapedDescription}" />`),
        `"${routePath}": expected description "${escapedDescription}"`,
    );
    assert.ok(
        html.includes(`property="og:title" content="${escapedTitle}"`),
        `"${routePath}": expected og:title "${escapedTitle}"`,
    );
    if (expectedCanonical) {
        assert.ok(
            html.includes(`rel="canonical" href="${expectedCanonical}"`),
            `"${routePath}": expected canonical "${expectedCanonical}"`,
        );
    }
    // Every page but Home is a lazy chunk. If App.tsx changes shape so generate-meta.mjs can no
    // longer match a route, direct visits silently go back to a download waterfall; fail instead.
    if (routePath !== "/") {
        assert.ok(html.includes('rel="modulepreload"'), `"${routePath}": expected a modulepreload hint for its page`);
    }
    for (const [, href] of html.matchAll(/rel="modulepreload" crossorigin href="([^"]+)"/g)) {
        assert.ok(existsSync(path.join(distDir, href)), `"${routePath}": preloaded ${href} does not exist`);
    }
}

for (const route of routes) {
    const canonicalUrl = route.path === "/" ? `${domain}/` : `${domain}${route.path}`;
    checkFile(route.path, route.title, route.description, canonicalUrl);
}

for (const alias of aliases) {
    const canonical = routes.find((route) => route.path === alias.canonicalPath);
    assert.ok(canonical, `Alias "${alias.path}" points to unknown canonicalPath "${alias.canonicalPath}"`);
    checkFile(alias.path, canonical.title, canonical.description, `${domain}${alias.canonicalPath}`);
}

const sitemapPath = path.join(distDir, "sitemap.xml");
assert.ok(existsSync(sitemapPath), "Missing sitemap.xml");
const sitemap = readFileSync(sitemapPath, "utf-8");
for (const route of routes) {
    assert.ok(
        sitemap.includes(`<loc>${domain}${route.path}</loc>`),
        `sitemap.xml is missing "${route.path}"`,
    );
}

console.log(`All page metadata checks passed (${routes.length} routes, ${aliases.length} aliases).`);
