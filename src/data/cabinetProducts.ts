import { assetPath } from "../lib/assetPath";

export type CabinetProduct = {
  id: string;
  name: string;
  category: string;
  image: string;
  story: string;
  palette: string;
  sourceUrl: string;
};

const SUMMER_COLLECTION_URL =
  "https://www.instagram.com/gem__accessories_/p/DKM3QiAMdgx/";

export const cabinetProducts: CabinetProduct[] = [
  {
    id: "GA-NCK-001",
    name: "Coral Reverie",
    category: "Layered summer necklace",
    image: assetPath("gem/discover/coral-pearl-necklace.jpg"),
    story: "A sun-warmed cascade of pearl light, coral stars and tiny golden shells.",
    palette: "Coral · Pearl · Sun gold",
    sourceUrl: SUMMER_COLLECTION_URL,
  },
  {
    id: "GA-RNG-005",
    name: "Wish Stone",
    category: "Personalized wire ring",
    image: assetPath("gem/discover/wish-stone-rings.jpg"),
    story: "A colour chosen for you, held inside a hand-wrapped golden orbit.",
    palette: "Rose quartz · Gold · Your colour",
    sourceUrl: SUMMER_COLLECTION_URL,
  },
  {
    id: "GA-BRC-003",
    name: "Pink Current",
    category: "Beaded chain bracelet",
    image: assetPath("gem/discover/pink-current-bracelet.jpg"),
    story: "Soft pink beads drift around the wrist like a tiny current of candy light.",
    palette: "Baby pink · Pearl · Fine gold",
    sourceUrl: SUMMER_COLLECTION_URL,
  },
  {
    id: "GA-ARM-FAMILY",
    name: "Golden Garden",
    category: "Wire cuff family",
    image: assetPath("gem/discover/golden-garden-cuffs.jpg"),
    story: "Scrolls, leaves and winged lines shaped into wearable little sculptures.",
    palette: "Warm gold · Sea blue · Pearl",
    sourceUrl: SUMMER_COLLECTION_URL,
  },
  {
    id: "GA-NCK-002",
    name: "Pearl Secret",
    category: "Baroque pearl necklace",
    image: assetPath("gem/discover/pearl-secret-necklace.jpg"),
    story: "One luminous centre pearl with two delicate drops—quiet, romantic, unexpected.",
    palette: "Blush · Baroque pearl · Gold",
    sourceUrl: SUMMER_COLLECTION_URL,
  },
];
