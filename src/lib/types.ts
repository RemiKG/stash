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
