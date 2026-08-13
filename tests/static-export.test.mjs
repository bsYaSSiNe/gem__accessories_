import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("the static export contains the complete concept entry point", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

  assert.match(html, /Gem Accessories/);
  assert.match(html, /<script[^>]+type="module"/);
  assert.match(html, /og\.jpg/);
});

test("critical local visual assets are included", async () => {
  const assets = [
    "../dist/gem/environment/boutique-interior.webp",
    "../dist/gem/products/shell-charm-necklace.webp",
    "../dist/gem/products/pearl-wire-ring-quartet.webp",
    "../dist/gem/products/vintage-amber-choker.webp",
    "../dist/gem/discover/coral-pearl-necklace.jpg",
    "../dist/gem/discover/wish-stone-rings.jpg",
    "../dist/gem/discover/pink-current-bracelet.jpg",
    "../dist/gem/discover/golden-garden-cuffs.jpg",
    "../dist/gem/discover/pearl-secret-necklace.jpg",
    "../dist/.nojekyll",
  ];

  await Promise.all(assets.map((asset) => access(new URL(asset, import.meta.url))));
});
