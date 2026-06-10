// Shared domain types. The item record is the spine: identity, condition,
// confidence, comps, band, listing, SOLD state, buyer — all persisted.

export type ItemStatus =
  | "draft"
  | "identifying"
  | "appraised"
  | "listed"
  | "sold"
  | "set_aside";

export interface Comp {
  title: string;
  price: number;
  url?: string;
  source: string; // "eBay active" | "reasoned" ...
}

export interface Item {
  id: string;
  shopSlug: string;
  status: ItemStatus;
  createdAt: number;

  // identity (from the VL model)
  title: string;
  category?: string;
  conditionGrade?: string; // "Good", "Very good", ...
  conditionNote?: string; // "light brassing on top plate"
  defects: string[];
  confidence: number; // 0..100
  question?: { text: string; options?: string[] } | null; // low-confidence branch

  // appraisal
  comps: Comp[];
  priceLow?: number;
  priceHigh?: number;
  why?: string;

  // listing / policy
  price?: number; // listed price
  reserve?: number; // floor
  description?: string;
  itemSpecifics?: Record<string, string>;
  ebayCategory?: string;

  // media (paths served via /api/blob/:id)
  photoSrc?: string; // scrubbed photo
  plateSrc?: string; // duotone halftone catalogue plate

  // lifecycle
  listedAt?: number;
  soldAt?: number;
  soldPrice?: number;
  buyer?: string;
  prohibited?: boolean;
  prohibitedReason?: string;

  // external publish (opt-in)
  ebayListingId?: string;
  ebayOfferId?: string;
  ebayError?: string;
}

export interface Shop {
  slug: string;
  name: string;
  blurb: string;
  createdAt: number;
  isDemo: boolean;
  claimed: boolean;
}

export type Actor = "squirrel" | "you" | "buyer";

export interface LedgerEntry {
  ts: number;
  actor: Actor;
  action: string; // "identified" | "appraised" | "composed" | "approved · list" | "offered" | "counter" | "sold" | "set aside" ...
  item?: string; // display label
  itemId?: string;
  amount?: number | null; // money, if any
  kind?: "id" | "price" | "message" | "sale" | "other";
  meta?: Record<string, unknown>;
}

export type MsgRole = "buyer" | "qm" | "system";
export interface Message {
  role: MsgRole;
  text: string;
  ts: number;
  amount?: number | null;
}
export type ThreadStatus = "open" | "accepted" | "declined" | "walked" | "closed";
export interface Thread {
  id: string;
  itemId: string;
  shopSlug: string;
  buyer: string;
  status: ThreadStatus;
  messages: Message[];
  draft?: { text: string; move: "counter" | "accept" | "decline"; amount: number | null; why: string } | null;
  agreedPrice?: number;
  rounds: number;
  createdAt: number;
}

export interface Settings {
  reserveFloorPct: number; // 0.60..1.00 of appraised low
  neverBelowReserve: true; // locked on
  autoAcceptPct: number | null; // null = off; else 0.90..1.00 of asking
  rounding: "none" | "5" | "9";
  tone: number; // 0 (friendly) .. 1 (firm)
  maxRounds: number; // 1..6
  openingCounterBias: number; // 0..1 (meet halfway .. hold near asking)
  suggestBundles: boolean;
  ignoreLowballPct: number | null; // null = off
  prohibitedExtra: string[]; // owner's own "never list" keywords
  askWhenUnsure: boolean;
  channel: "shop" | "telegram" | "email";
  quietHours: { on: boolean; from: string; to: string };
  exportPacks: boolean;
  ebayConnected: boolean;
  showFound: boolean;
  demoOn: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  reserveFloorPct: 0.85,
  neverBelowReserve: true,
  autoAcceptPct: null,
  rounding: "5",
  tone: 0.55,
  maxRounds: 3,
  openingCounterBias: 0.6,
  suggestBundles: true,
  ignoreLowballPct: null,
  prohibitedExtra: [],
  askWhenUnsure: true,
  channel: "shop",
  quietHours: { on: false, from: "22:00", to: "08:00" },
  exportPacks: true,
  ebayConnected: false,
  showFound: true,
  demoOn: false,
};
