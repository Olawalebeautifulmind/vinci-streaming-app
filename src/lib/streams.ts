export type CategorySlug =
  | "painting"
  | "sculpture"
  | "bead-making"
  | "textile"
  | "tailoring"
  | "furniture"
  | "ceramics"
  | "culinary";

export type Category = {
  slug: CategorySlug;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  disciplines: string[];
  accent: string; // hex for thumb accent
  base: string;   // hex for thumb bg
};

export const categories: Category[] = [
  {
    slug: "painting",
    name: "Painting",
    emoji: "🖌️",
    tagline: "Canvas, watercolour, oil, acrylic, digital",
    description: "Watch painters work wet-on-wet, layer glazes, and finish canvases live. Bid on originals as the last brushstroke lands.",
    disciplines: ["Canvas", "Watercolour", "Oil", "Acrylic", "Digital painting"],
    accent: "#e8a87c", base: "#1a1208",
  },
  {
    slug: "sculpture",
    name: "Sculpture",
    emoji: "🗿",
    tagline: "Clay modelling, stone carving, metal sculpting",
    description: "From rough block to finished form. Sculptors stream long-form sessions of carving, modelling, and welding.",
    disciplines: ["Clay modelling", "Stone carving", "Metal sculpting"],
    accent: "#c0c0c0", base: "#141414",
  },
  {
    slug: "bead-making",
    name: "Bead Making",
    emoji: "📿",
    tagline: "Jewellery, wearable art, decorative beadwork",
    description: "Hand-strung pieces, lampwork beads, and intricate wearable art — bid on one-of-one strands as they're finished.",
    disciplines: ["Jewellery", "Wearable art", "Decorative beadwork"],
    accent: "#f0d78c", base: "#15110a",
  },
  {
    slug: "textile",
    name: "Textile",
    emoji: "🧵",
    tagline: "Weaving, embroidery, macramé, knitwear",
    description: "Looms, needles, and natural dyes. Long, meditative streams from textile studios around the world.",
    disciplines: ["Weaving", "Embroidery", "Macramé", "Knitwear"],
    accent: "#c4654a", base: "#1a1208",
  },
  {
    slug: "tailoring",
    name: "Tailoring",
    emoji: "✂️",
    tagline: "Garment making, fashion design, hand-stitching",
    description: "Pattern cutting, drafting, and hand-finished garments. Commission custom pieces directly from the maker.",
    disciplines: ["Garment making", "Fashion design", "Hand-stitching"],
    accent: "#9bd0b0", base: "#0c1410",
  },
  {
    slug: "furniture",
    name: "Furniture",
    emoji: "🪑",
    tagline: "Woodworking, upcycling, handcrafted design",
    description: "Joinery, hand-planing, and one-of-one pieces from independent workshops.",
    disciplines: ["Woodworking", "Upcycling", "Handcrafted furniture"],
    accent: "#d4a574", base: "#150f08"
  },
  {
    slug: "ceramics",
    name: "Ceramics",
    emoji: "🏺",
    tagline: "Pottery, kiln work, glazing, hand-building",
    description: "Wheel-throwing, hand-building and kiln reveals. Bid on individual cups, vases or commissions.",
    disciplines: ["Pottery", "Kiln work", "Glazing", "Hand-building"],
    accent: "#c9a84c", base: "#1a1208",
  },
  {
    slug: "culinary",
    name: "Culinary",
    emoji: "🍳",
    tagline: "Pastry, fermentation, plating, knife work",
    description: "Chefs and home cooks streaming live from their kitchens. Watch a dish from raw ingredient to final plate — order tasting boxes, recipe cards, or commission a private menu.",
    disciplines: ["Pastry", "Fermentation", "Plating", "Knife work", "Bread"],
    accent: "#f0a868", base: "#1a1108",
  },
];

export const getCategory = (slug: string) => categories.find(c => c.slug === slug);

export type Stream = {
  id: string;
  title: string;
  craft: string;          // short label shown on thumb (e.g. "Kintsugi")
  category: CategorySlug;
  creator: {
    handle: string;
    name: string;
    location: string;
    verified: boolean;
    avatar: string;
  };
  viewers: number;
  startedMinutesAgo: number;
  currentBidCowries: number;
  topBidder?: string;
  thumbColor: string;
  thumbAccent: string;
  tags: string[];
  description: string;
};

const grad = (a: string, b: string) => `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;

export const streams: Stream[] = [
  // Ceramics
  {
    id: "kintsugi-bowl",
    title: "Repairing a 200-year-old bowl in gold",
    craft: "Kintsugi", category: "ceramics",
    creator: { handle: "akira.studio", name: "Akira Mori", location: "Kyoto, JP", verified: true, avatar: grad("#c9a84c","#3a2a14") },
    viewers: 2143, startedMinutesAgo: 47, currentBidCowries: 18400, topBidder: "0x4a…91d",
    thumbColor: "#2a1a0a", thumbAccent: "#c9a84c",
    tags: ["restoration","gold leaf","edition of 1"],
    description: "Live restoration of an Edo-period rice bowl using urushi lacquer and 24k gold. Auctioned at the end of stream with on-chain provenance.",
  },
  {
    id: "wheel-throwing",
    title: "Throwing six matcha cups — open commissions",
    craft: "Wheel", category: "ceramics",
    creator: { handle: "elena.clay", name: "Elena Vasquez", location: "Oaxaca, MX", verified: true, avatar: grad("#e8a87c","#4a2a1a") },
    viewers: 894, startedMinutesAgo: 22, currentBidCowries: 4200,
    thumbColor: "#1a1410", thumbAccent: "#e8a87c",
    tags: ["stoneware","commission"],
    description: "Hand-throwing six matcha chawan. Bid on individual pieces or commission a custom glaze.",
  },
  // Painting
  {
    id: "oil-portrait",
    title: "Alla prima oil portrait — single sitting",
    craft: "Oil", category: "painting",
    creator: { handle: "marin.oil", name: "Marin Halász", location: "Budapest, HU", verified: true, avatar: grad("#e8a87c","#2a1a14") },
    viewers: 1320, startedMinutesAgo: 38, currentBidCowries: 7800, topBidder: "0x9c…12a",
    thumbColor: "#1a0e08", thumbAccent: "#e8a87c",
    tags: ["portrait","alla prima","30×40cm"],
    description: "A complete oil portrait painted wet-on-wet in a single sitting. Original ships with stream footage as provenance.",
  },
  {
    id: "watercolour-tokyo",
    title: "Watercolour study — rainy Shinjuku",
    craft: "Watercolour", category: "painting",
    creator: { handle: "yuki.aqua", name: "Yuki Tanabe", location: "Tokyo, JP", verified: false, avatar: grad("#9bd0b0","#1a1a1a") },
    viewers: 372, startedMinutesAgo: 18, currentBidCowries: 1200,
    thumbColor: "#0e1418", thumbAccent: "#9bd0b0",
    tags: ["watercolour","cityscape"],
    description: "Loose watercolour cityscape painted from a Shinjuku window on a rainy night.",
  },
  // Sculpture
  {
    id: "marble-bust",
    title: "Roughing a Carrara marble bust",
    craft: "Stone", category: "sculpture",
    creator: { handle: "lorenzo.carve", name: "Lorenzo Bianchi", location: "Carrara, IT", verified: true, avatar: grad("#dcdcdc","#2a2a2a") },
    viewers: 2870, startedMinutesAgo: 95, currentBidCowries: 36000, topBidder: "0x77…ab1",
    thumbColor: "#15161a", thumbAccent: "#dcdcdc",
    tags: ["marble","carving","one-of-one"],
    description: "Live roughing pass on a Carrara marble bust. The finished work will be auctioned at the end of the multi-day stream.",
  },
  {
    id: "bronze-pour",
    title: "Bronze pour — lost wax casting reveal",
    craft: "Bronze", category: "sculpture",
    creator: { handle: "akin.foundry", name: "Akin Bello", location: "Lagos, NG", verified: true, avatar: grad("#c9a84c","#1a1208") },
    viewers: 1860, startedMinutesAgo: 12, currentBidCowries: 11000,
    thumbColor: "#1a1208", thumbAccent: "#f0c060",
    tags: ["bronze","lost wax","reveal"],
    description: "Lost-wax bronze pour followed by a live reveal and chasing of the surface.",
  },
  // Bead Making
  {
    id: "lampwork-beads",
    title: "Lampworking glass beads at the torch",
    craft: "Lampwork", category: "bead-making",
    creator: { handle: "ines.flame", name: "Inés Romero", location: "Lisbon, PT", verified: true, avatar: grad("#f0d78c","#1a1208") },
    viewers: 612, startedMinutesAgo: 21, currentBidCowries: 2200,
    thumbColor: "#15110a", thumbAccent: "#f0d78c",
    tags: ["glass","torchwork","one-of-one"],
    description: "Forming a series of lampwork glass beads at the torch. Each finished bead is auctioned individually.",
  },
  {
    id: "beadweaving",
    title: "Beadweaving a Zulu-inspired collar",
    craft: "Beadwork", category: "bead-making",
    creator: { handle: "thandi.bead", name: "Thandi Khumalo", location: "Durban, ZA", verified: true, avatar: grad("#c4654a","#1a1208") },
    viewers: 488, startedMinutesAgo: 64, currentBidCowries: 3400,
    thumbColor: "#180f08", thumbAccent: "#f0a060",
    tags: ["wearable","heritage","collar"],
    description: "Hand-beaded collar inspired by traditional Zulu beadwork patterns.",
  },
  // Textile
  {
    id: "weaving",
    title: "Backstrap weaving a wool wall piece",
    craft: "Weaving", category: "textile",
    creator: { handle: "isla.tela", name: "Isla Quispe", location: "Cusco, PE", verified: false, avatar: grad("#c4654a","#1a1a1a") },
    viewers: 421, startedMinutesAgo: 130, currentBidCowries: 3100,
    thumbColor: "#1a1208", thumbAccent: "#c4654a",
    tags: ["wool","heritage"],
    description: "Traditional Andean backstrap weaving with hand-dyed alpaca wool.",
  },
  {
    id: "embroidery-hoop",
    title: "Goldwork embroidery on silk",
    craft: "Embroidery", category: "textile",
    creator: { handle: "rohan.thread", name: "Rohan Mehta", location: "Lucknow, IN", verified: true, avatar: grad("#f0d78c","#2a1a08") },
    viewers: 754, startedMinutesAgo: 41, currentBidCowries: 4700,
    thumbColor: "#170f08", thumbAccent: "#f0d78c",
    tags: ["goldwork","silk","heirloom"],
    description: "Goldwork embroidery on hand-dyed silk — slow, meditative stitching from the studio.",
  },
  // Tailoring
  {
    id: "savile-jacket",
    title: "Drafting a hand-padded jacket lapel",
    craft: "Tailoring", category: "tailoring",
    creator: { handle: "edmund.cloth", name: "Edmund Caldwell", location: "London, UK", verified: true, avatar: grad("#9bd0b0","#0d0d0d") },
    viewers: 980, startedMinutesAgo: 58, currentBidCowries: 0,
    thumbColor: "#0c1410", thumbAccent: "#9bd0b0",
    tags: ["bespoke","commission","wool"],
    description: "Hand-padding a notch lapel on a bespoke jacket. Commissions are open during the stream.",
  },
  {
    id: "kimono",
    title: "Hand-stitching a contemporary kimono",
    craft: "Kimono", category: "tailoring",
    creator: { handle: "aiko.tsuru", name: "Aiko Tsuru", location: "Kanazawa, JP", verified: true, avatar: grad("#e8a87c","#1a1208") },
    viewers: 442, startedMinutesAgo: 17, currentBidCowries: 6000,
    thumbColor: "#170f08", thumbAccent: "#e8a87c",
    tags: ["kimono","hand-stitched","silk"],
    description: "A contemporary kimono entirely hand-stitched in indigo silk.",
  },
  // Furniture
  {
    id: "chair-joinery",
    title: "Cutting hand-mortised joinery for a lounge chair",
    craft: "Joinery", category: "furniture",
    creator: { handle: "noa.workshop", name: "Noa Berg", location: "Oslo, NO", verified: true, avatar: grad("#d4a574","#15100a") },
    viewers: 1310, startedMinutesAgo: 84, currentBidCowries: 12000, topBidder: "0xab…3c2",
    thumbColor: "#150f08", thumbAccent: "#d4a574",
    tags: ["oak","hand-cut","lounge chair"],
    description: "Hand-mortised joinery for a one-of-one oak lounge chair. The finished piece is auctioned at the end.",
  },
  {
    id: "upcycle-credenza",
    title: "Upcycling a 70s credenza in burl walnut",
    craft: "Upcycle", category: "furniture",
    creator: { handle: "kasi.grain", name: "Kasi Owusu", location: "Berlin, DE", verified: false, avatar: grad("#c9a84c","#1a1208") },
    viewers: 360, startedMinutesAgo: 33, currentBidCowries: 5500,
    thumbColor: "#181208", thumbAccent: "#c9a84c",
    tags: ["upcycle","walnut","mid-century"],
    description: "Refinishing and re-veneering a 70s credenza with burl walnut.",
  },
  // Culinary
  {
    id: "sourdough-laminated",
    title: "Laminating a 36-hour sourdough croissant dough",
    craft: "Pastry", category: "culinary",
    creator: { handle: "chef.amara", name: "Amara Okonkwo", location: "Paris, FR", verified: true, avatar: grad("#f0a868","#2a1a08") },
    viewers: 1540, startedMinutesAgo: 26, currentBidCowries: 3200, topBidder: "ophelia",
    thumbColor: "#1a1108", thumbAccent: "#f0a868",
    tags: ["pastry","viennoiserie","tasting box"],
    description: "Laminating, shaping and baking croissants live from a Paris kitchen. Bid on a fresh tasting box shipped overnight or a recipe card with signed notes.",
  },
  {
    id: "omakase-knife",
    title: "Omakase prep — single-piece nigiri course",
    craft: "Knife", category: "culinary",
    creator: { handle: "kenji.itamae", name: "Kenji Sato", location: "Osaka, JP", verified: true, avatar: grad("#c0c0c0","#141414") },
    viewers: 980, startedMinutesAgo: 12, currentBidCowries: 5400,
    thumbColor: "#15161a", thumbAccent: "#c0c0c0",
    tags: ["sushi","knife work","commission"],
    description: "Cutting and shaping a full omakase course live. Commission a private menu or order a digital recipe scroll signed by the chef.",
  },
];

export const getStream = (id: string) => streams.find(s => s.id === id);
export const streamsByCategory = (slug: CategorySlug) => streams.filter(s => s.category === slug);

export const liveChatSeed = [
  { user: "collector_94", msg: "The line work on the rim is unreal.", color: "#f0d78c" },
  { user: "ophelia.eth", msg: "Bidding 5,000 🐚 now — congrats on the new piece earlier.", color: "#c9a84c" },
  { user: "marcus", msg: "Stream quality is buttery tonight 🔥", color: "#e8a87c" },
  { user: "studio_vault", msg: "Will the provenance NFT include the studio footage?", color: "#9bd0b0" },
  { user: "rae", msg: "first time here — wow", color: "#c4654a" },
  { user: "0x4a…91d", msg: "+500 🐚", color: "#f0d78c" },
];

// ---------- Creator profiles ----------

export type SkillLevel = "Emerging" | "Established" | "Master";

export type PortfolioWork = {
  id: string;
  title: string;
  year: number;
  medium: string;
  status: "Collected" | "Available" | "Archived";
  priceCowries?: number;
  collector?: string;
  tokenId: string;
  thumbColor: string;
  thumbAccent: string;
};

export type Creator = {
  handle: string;
  name: string;
  avatar: string;
  artistId: string;
  country: string;
  countryCode: string;
  city: string;
  continent: "Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania";
  verified: boolean;
  skillLevel: SkillLevel;
  disciplines: CategorySlug[];
  bio: string;
  joinedYear: number;
  followers: number;
  walletShort: string;
  registryAddress: string;
  socials?: { label: string; url?: string }[];
  portfolio: PortfolioWork[];
};

const continentByCC: Record<string, Creator["continent"]> = {
  JP: "Asia", IN: "Asia",
  MX: "North America",
  HU: "Europe", IT: "Europe", PT: "Europe", UK: "Europe", DE: "Europe", NO: "Europe",
  NG: "Africa", ZA: "Africa",
  PE: "South America",
};

const countryByCC: Record<string, string> = {
  JP: "Japan", MX: "Mexico", HU: "Hungary", IT: "Italy", PT: "Portugal",
  UK: "United Kingdom", DE: "Germany", NO: "Norway", NG: "Nigeria",
  ZA: "South Africa", PE: "Peru", IN: "India",
};

type Seed = {
  handle: string;
  artistId: string;
  skillLevel: SkillLevel;
  disciplines: CategorySlug[];
  bio: string;
  joinedYear: number;
  followers: number;
  walletShort: string;
  registryAddress: string;
  socials?: Creator["socials"];
  portfolio: PortfolioWork[];
};

const seeds: Seed[] = [
  {
    handle: "akira.studio", artistId: "ART-JP-00421",
    skillLevel: "Master", disciplines: ["ceramics"],
    bio: "Fourth-generation Kyoto ceramicist specialising in kintsugi restoration. Every repaired piece carries the memory of its break.",
    joinedYear: 2023, followers: 18420, walletShort: "0x9aF2…41cD",
    registryAddress: "0x4a91…ART.kintsugi",
    socials: [{ label: "akira.studio" }, { label: "kyoto-ceramics.jp" }],
    portfolio: [
      { id: "w1", title: "Edo rice bowl, repaired", year: 2026, medium: "Urushi + 24k gold", status: "Collected", priceCowries: 21000, collector: "0x4a…91d", tokenId: "#0001", thumbColor: "#2a1a0a", thumbAccent: "#c9a84c" },
      { id: "w2", title: "Tea caddy, golden seam", year: 2025, medium: "Lacquer + gold", status: "Collected", priceCowries: 16000, collector: "studio_vault", tokenId: "#0002", thumbColor: "#1a1208", thumbAccent: "#f0d78c" },
      { id: "w3", title: "Moon-phase chawan series I", year: 2025, medium: "Stoneware, silver", status: "Available", priceCowries: 9000, tokenId: "#0003", thumbColor: "#15110a", thumbAccent: "#dcdcdc" },
      { id: "w4", title: "Cracked vessel, full moon", year: 2024, medium: "Urushi + gold", status: "Archived", tokenId: "#0004", thumbColor: "#1a1208", thumbAccent: "#c9a84c" },
    ],
  },
  {
    handle: "elena.clay", artistId: "ART-MX-00188",
    skillLevel: "Established", disciplines: ["ceramics"],
    bio: "Wheel-thrown stoneware from a small studio in Oaxaca. Open commissions for matcha and coffee ware.",
    joinedYear: 2024, followers: 6210, walletShort: "0x2bC1…77aE",
    registryAddress: "0x77ab…ART.clay",
    portfolio: [
      { id: "w1", title: "Matcha set of six", year: 2025, medium: "Stoneware, ash glaze", status: "Collected", priceCowries: 6000, collector: "0xab…3c2", tokenId: "#0001", thumbColor: "#1a1410", thumbAccent: "#e8a87c" },
      { id: "w2", title: "Pour-over carafe", year: 2025, medium: "Stoneware", status: "Available", priceCowries: 3200, tokenId: "#0002", thumbColor: "#181208", thumbAccent: "#d4a574" },
      { id: "w3", title: "Wabi cup, iron glaze", year: 2024, medium: "Stoneware", status: "Available", priceCowries: 1800, tokenId: "#0003", thumbColor: "#15110a", thumbAccent: "#c9a84c" },
    ],
  },
  {
    handle: "marin.oil", artistId: "ART-HU-00077",
    skillLevel: "Master", disciplines: ["painting"],
    bio: "Alla prima oil portraits from a Budapest atelier. Trained at the Hungarian Academy of Fine Arts.",
    joinedYear: 2023, followers: 9930, walletShort: "0x4f10…aa92",
    registryAddress: "0x9c12…ART.oil",
    portfolio: [
      { id: "w1", title: "Portrait of A.K., single sitting", year: 2026, medium: "Oil on linen, 30×40cm", status: "Collected", priceCowries: 9500, collector: "0x9c…12a", tokenId: "#0008", thumbColor: "#1a0e08", thumbAccent: "#e8a87c" },
      { id: "w2", title: "Self portrait, late winter", year: 2025, medium: "Oil on panel", status: "Available", priceCowries: 5500, tokenId: "#0009", thumbColor: "#0e1418", thumbAccent: "#9bd0b0" },
      { id: "w3", title: "The violinist", year: 2024, medium: "Oil on linen", status: "Archived", tokenId: "#0010", thumbColor: "#180f08", thumbAccent: "#f0d78c" },
    ],
  },
  {
    handle: "yuki.aqua", artistId: "ART-JP-00302",
    skillLevel: "Emerging", disciplines: ["painting"],
    bio: "Watercolour cityscapes painted from windows around Tokyo. Mostly rainy nights.",
    joinedYear: 2025, followers: 1840, walletShort: "0x77eA…0c12",
    registryAddress: "0x0c12…ART.aqua",
    portfolio: [
      { id: "w1", title: "Shinjuku, rain", year: 2026, medium: "Watercolour on cold-press", status: "Available", priceCowries: 1400, tokenId: "#0001", thumbColor: "#0e1418", thumbAccent: "#9bd0b0" },
      { id: "w2", title: "Yanaka morning", year: 2025, medium: "Watercolour", status: "Collected", priceCowries: 1000, collector: "rae", tokenId: "#0002", thumbColor: "#1a1208", thumbAccent: "#e8a87c" },
    ],
  },
  {
    handle: "lorenzo.carve", artistId: "ART-IT-00045",
    skillLevel: "Master", disciplines: ["sculpture"],
    bio: "Carrara-born sculptor working exclusively in local marble. Multi-day streams from quarry to studio.",
    joinedYear: 2022, followers: 24110, walletShort: "0x77AB…3c21",
    registryAddress: "0x77ab…ART.carve",
    portfolio: [
      { id: "w1", title: "Bust no.14", year: 2025, medium: "Carrara marble", status: "Collected", priceCowries: 42000, collector: "0x77…ab1", tokenId: "#0014", thumbColor: "#15161a", thumbAccent: "#dcdcdc" },
      { id: "w2", title: "Torso study, unfinished", year: 2024, medium: "Carrara marble", status: "Available", priceCowries: 28000, tokenId: "#0015", thumbColor: "#141414", thumbAccent: "#c0c0c0" },
    ],
  },
  {
    handle: "akin.foundry", artistId: "ART-NG-00421",
    skillLevel: "Established", disciplines: ["sculpture"],
    bio: "Lost-wax bronze pours from a Lagos foundry. Live reveals and surface chasing on stream.",
    joinedYear: 2024, followers: 7320, walletShort: "0xbE54…12FA",
    registryAddress: "0x12fa…ART.foundry",
    portfolio: [
      { id: "w1", title: "Ori — first cast", year: 2025, medium: "Bronze, lost wax", status: "Collected", priceCowries: 14000, collector: "ophelia.eth", tokenId: "#0001", thumbColor: "#1a1208", thumbAccent: "#f0c060" },
      { id: "w2", title: "Mask II", year: 2025, medium: "Bronze, patinated", status: "Available", priceCowries: 11000, tokenId: "#0002", thumbColor: "#150f08", thumbAccent: "#c9a84c" },
    ],
  },
  {
    handle: "ines.flame", artistId: "ART-PT-00133",
    skillLevel: "Established", disciplines: ["bead-making"],
    bio: "Lampwork glass bead artist working at the torch. Each bead a one-of-one miniature.",
    joinedYear: 2024, followers: 4120, walletShort: "0x33Aa…91Cd",
    registryAddress: "0x91cd…ART.flame",
    portfolio: [
      { id: "w1", title: "Aurora set of five", year: 2025, medium: "Lampwork glass", status: "Available", priceCowries: 2800, tokenId: "#0005", thumbColor: "#15110a", thumbAccent: "#f0d78c" },
      { id: "w2", title: "Tide pool bead", year: 2024, medium: "Lampwork glass", status: "Collected", priceCowries: 1600, collector: "marcus", tokenId: "#0006", thumbColor: "#1a1208", thumbAccent: "#9bd0b0" },
    ],
  },
  {
    handle: "thandi.bead", artistId: "ART-ZA-00219",
    skillLevel: "Master", disciplines: ["bead-making"],
    bio: "Hand-beaded collars and wearable art rooted in Zulu beadwork traditions, made in Durban.",
    joinedYear: 2023, followers: 5870, walletShort: "0x88Ff…01aa",
    registryAddress: "0x01aa…ART.bead",
    portfolio: [
      { id: "w1", title: "Indlamu collar", year: 2025, medium: "Glass beads, leather", status: "Collected", priceCowries: 4200, collector: "studio_vault", tokenId: "#0007", thumbColor: "#180f08", thumbAccent: "#f0a060" },
      { id: "w2", title: "Sunrise cuff", year: 2024, medium: "Glass beads", status: "Available", priceCowries: 2100, tokenId: "#0008", thumbColor: "#1a1208", thumbAccent: "#c4654a" },
    ],
  },
  {
    handle: "isla.tela", artistId: "ART-PE-00064",
    skillLevel: "Established", disciplines: ["textile"],
    bio: "Backstrap weaver working with hand-dyed alpaca wool from the Sacred Valley.",
    joinedYear: 2024, followers: 3210, walletShort: "0x12Cc…aa54",
    registryAddress: "0xaa54…ART.tela",
    portfolio: [
      { id: "w1", title: "Pachamama wall piece", year: 2025, medium: "Alpaca wool, natural dye", status: "Available", priceCowries: 3600, tokenId: "#0001", thumbColor: "#1a1208", thumbAccent: "#c4654a" },
    ],
  },
  {
    handle: "rohan.thread", artistId: "ART-IN-00781",
    skillLevel: "Master", disciplines: ["textile"],
    bio: "Goldwork embroidery on hand-dyed silk. Heirloom pieces from a Lucknow studio.",
    joinedYear: 2023, followers: 8120, walletShort: "0xa1B2…4fE0",
    registryAddress: "0x4fe0…ART.thread",
    portfolio: [
      { id: "w1", title: "Mughal panel", year: 2025, medium: "Silk, gold thread", status: "Collected", priceCowries: 5800, collector: "0xab…3c2", tokenId: "#0011", thumbColor: "#170f08", thumbAccent: "#f0d78c" },
      { id: "w2", title: "Lotus, half-finished", year: 2025, medium: "Silk, gold thread", status: "Available", priceCowries: 3400, tokenId: "#0012", thumbColor: "#1a1208", thumbAccent: "#c9a84c" },
    ],
  },
  {
    handle: "edmund.cloth", artistId: "ART-UK-00029",
    skillLevel: "Master", disciplines: ["tailoring"],
    bio: "Savile Row–trained bespoke tailor. Hand-padded canvases and hand-finished buttonholes.",
    joinedYear: 2023, followers: 12440, walletShort: "0xC0d3…99aB",
    registryAddress: "0x99ab…ART.cloth",
    portfolio: [
      { id: "w1", title: "Two-piece, midnight worsted", year: 2025, medium: "Wool, hand-finished", status: "Collected", priceCowries: 18000, collector: "ophelia.eth", tokenId: "#0003", thumbColor: "#0c1410", thumbAccent: "#9bd0b0" },
      { id: "w2", title: "Notch lapel jacket", year: 2024, medium: "Wool, hand-padded", status: "Available", priceCowries: 12000, tokenId: "#0004", thumbColor: "#15161a", thumbAccent: "#dcdcdc" },
    ],
  },
  {
    handle: "aiko.tsuru", artistId: "ART-JP-00159",
    skillLevel: "Established", disciplines: ["tailoring"],
    bio: "Contemporary kimono entirely hand-stitched in indigo silk, made in Kanazawa.",
    joinedYear: 2024, followers: 4940, walletShort: "0x5577…aaBB",
    registryAddress: "0xaabb…ART.tsuru",
    portfolio: [
      { id: "w1", title: "Indigo kimono no.3", year: 2025, medium: "Silk, hand-stitched", status: "Available", priceCowries: 7200, tokenId: "#0001", thumbColor: "#170f08", thumbAccent: "#e8a87c" },
    ],
  },
  {
    handle: "noa.workshop", artistId: "ART-NO-00088",
    skillLevel: "Master", disciplines: ["furniture"],
    bio: "Oslo workshop making one-of-one furniture in Norwegian oak. Hand-cut joinery, no screws.",
    joinedYear: 2023, followers: 9810, walletShort: "0xab53…3c21",
    registryAddress: "0x3c21…ART.workshop",
    portfolio: [
      { id: "w1", title: "Lounge chair no.1", year: 2025, medium: "White oak, leather", status: "Collected", priceCowries: 15000, collector: "0xab…3c2", tokenId: "#0001", thumbColor: "#150f08", thumbAccent: "#d4a574" },
      { id: "w2", title: "Side table", year: 2024, medium: "Oak, hand-finished", status: "Available", priceCowries: 7000, tokenId: "#0002", thumbColor: "#181208", thumbAccent: "#c9a84c" },
    ],
  },
  {
    handle: "kasi.grain", artistId: "ART-DE-00214",
    skillLevel: "Emerging", disciplines: ["furniture"],
    bio: "Berlin-based upcycler restoring mid-century furniture with reclaimed burl veneers.",
    joinedYear: 2025, followers: 1240, walletShort: "0x7799…01Aa",
    registryAddress: "0x01aa…ART.grain",
    portfolio: [
      { id: "w1", title: "70s credenza, burl walnut", year: 2026, medium: "Walnut burl, oil finish", status: "Available", priceCowries: 5500, tokenId: "#0001", thumbColor: "#181208", thumbAccent: "#c9a84c" },
    ],
  },
];

const baseByHandle = new Map<string, Stream["creator"]>();
for (const s of streams) baseByHandle.set(s.creator.handle, s.creator);

export const creators: Creator[] = seeds.map(seed => {
  const base = baseByHandle.get(seed.handle)!;
  const [city, cc] = base.location.split(",").map(s => s.trim());
  return {
    handle: seed.handle,
    name: base.name,
    avatar: base.avatar,
    artistId: seed.artistId,
    countryCode: cc,
    country: countryByCC[cc] ?? cc,
    city,
    continent: continentByCC[cc] ?? "Europe",
    verified: base.verified,
    skillLevel: seed.skillLevel,
    disciplines: seed.disciplines,
    bio: seed.bio,
    joinedYear: seed.joinedYear,
    followers: seed.followers,
    walletShort: seed.walletShort,
    registryAddress: seed.registryAddress,
    socials: seed.socials,
    portfolio: seed.portfolio,
  };
});

export const getCreator = (handle: string) => creators.find(c => c.handle === handle);
export const streamsByCreator = (handle: string) => streams.filter(s => s.creator.handle === handle);

