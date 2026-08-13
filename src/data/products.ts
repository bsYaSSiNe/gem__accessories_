import { assetPath } from "../lib/assetPath";

export type FeaturedProduct = {
  id: string;
  name: string;
  shortName: string;
  category: string;
  image: string;
  story: string;
  palette: string;
  sourceUrl: string;
};

export const featuredProducts: FeaturedProduct[] = [
  {
    id: "GA-NCK-014",
    name: "Pearl Choker & Shell-Starfish Layered Set",
    shortName: "Pearl Tide",
    category: "Layered necklace",
    image: assetPath("gem/products/shell-charm-necklace.webp"),
    story: "Pearl light, sea treasures and a little piece of summer worn close.",
    palette: "Pearl · Shell · Rose gold",
    sourceUrl: "https://www.instagram.com/gem__accessories_/p/DLNp3A_MFR_/",
  },
  {
    id: "GA-RNG-FAMILY",
    name: "Pearl Wire Ring Quartet",
    shortName: "Pearl Orbit",
    category: "Hand-formed rings",
    image: assetPath("gem/products/pearl-wire-ring-quartet.webp"),
    story: "Four tiny constellations, shaped by hand from wire and pearl-like light.",
    palette: "Warm gold · Pearl",
    sourceUrl: "https://www.instagram.com/gem__accessories_/p/DEIfXGHMP6t/",
  },
  {
    id: "GA-NCK-006",
    name: "Arabian Layered Coin Necklace",
    shortName: "Golden Echo",
    category: "Statement necklace",
    image: assetPath("gem/products/arabian-coin-necklace.webp"),
    story: "A rhythmic fall of golden discs with an old-world glow.",
    palette: "Antique gold",
    sourceUrl: "https://www.instagram.com/gem__accessories_/p/DMf4vvSs8ro/",
  },
  {
    id: "GA-BRC-004",
    name: "Crystal Hand-Chain Bracelet",
    shortName: "Starlit Hand",
    category: "Hand jewellery",
    image: assetPath("gem/products/crystal-hand-chain.webp"),
    story: "A delicate line of light connecting the wrist to the fingertip.",
    palette: "Crystal · Fine gold",
    sourceUrl: "https://www.instagram.com/gem__accessories_/p/DLp51WuMygW/",
  },
  {
    id: "GA-NCK-004",
    name: "Cream & Pink Beaded Starfish Collar",
    shortName: "Pink Starfish",
    category: "Beaded necklace",
    image: assetPath("gem/products/beaded-starfish-collar.webp"),
    story: "Playful starfish petals in cream and blush, made for sunlit days.",
    palette: "Baby pink · Cream",
    sourceUrl: "https://www.instagram.com/gem__accessories_/p/DKM3QiAMdgx/",
  },
  {
    id: "GA-ARM-001",
    name: "Scrollwork Upper-Arm Cuff",
    shortName: "Golden Scroll",
    category: "Arm cuff",
    image: assetPath("gem/products/scrollwork-arm-cuff.webp"),
    story: "A hand-shaped spiral tracing the arm like a golden signature.",
    palette: "Sun gold",
    sourceUrl: "https://www.instagram.com/gem__accessories_/reel/DK1nHwuMw5B/",
  },
  {
    id: "GA-NCK-FAMILY",
    name: "Gem-Drop Fringe Necklace Colour Family",
    shortName: "Gem Rain",
    category: "Colour collection",
    image: assetPath("gem/products/gem-drop-fringe-family.webp"),
    story: "A fringe of tiny drops in pink, pearl and blue-grey moods.",
    palette: "Blush · Pearl · Powder blue",
    sourceUrl: "https://www.instagram.com/gem__accessories_/p/DL4uZEAsRpy/",
  },
  {
    id: "GA-NCK-005",
    name: "Vintage Amber Layered Draped Choker",
    shortName: "Amber Spell",
    category: "Handcrafted choker",
    image: assetPath("gem/products/vintage-amber-choker.webp"),
    story: "Warm amber, cascading chains and a romantic starburst finish.",
    palette: "Amber · Vintage gold",
    sourceUrl: "https://www.instagram.com/gem__accessories_/reel/Db5s-gzMXr1/",
  },
];
