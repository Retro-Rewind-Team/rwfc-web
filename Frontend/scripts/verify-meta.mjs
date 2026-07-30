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

function checkFile(routePath, expectedTitle, expectedCanonical) {
    const filePath =
        routePath === "/" ? path.join(distDir, "index.html") : path.join(distDir, routePath, "index.html");

    assert.ok(existsSync(filePath), `Missing generated file for "${routePath}": ${filePath}`);

    const html = readFileSync(filePath, "utf-8");
    const escapedTitle = escapeHtml(expectedTitle); // Compare against the escaped form

    assert.ok(
        html.includes(`<title>${escapedTitle}</title>`),
        `"${routePath}": expected <title>${escapedTitle}</title>`,
    );
    assert.ok(
        html.includes(`property="og:title" content="${escapedTitle}"`),
        `"${routePath}": expected og:title "${escapedTitle}"`,
    );
    assert.ok(
        html.includes(`rel="canonical" href="${expectedCanonical}"`),
        `"${routePath}": expected canonical "${expectedCanonical}"`,
    );
}

for (const route of routes) {
    const canonicalUrl = route.path === "/" ? `${domain}/` : `${domain}${route.path}`;
    checkFile(route.path, route.title, canonicalUrl);
}

for (const alias of aliases) {
    const canonical = routes.find((route) => route.path === alias.canonicalPath);
    assert.ok(canonical, `Alias "${alias.path}" points to unknown canonicalPath "${alias.canonicalPath}"`);
    checkFile(alias.path, canonical.title, `${domain}${alias.canonicalPath}`);
}

console.log(`All page metadata checks passed (${routes.length} routes, ${aliases.length} aliases).`);
