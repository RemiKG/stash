// AppBar — the awning strip: the $ coin + wordmark, and the book (ledger) + gear
// (standing orders) at the right.
import Link from "next/link";
import Wordmark from "@/components/art/Wordmark";
import TailMark from "@/components/art/TailMark";
import { Book, Gear } from "@/components/art/Icons";
import { C } from "@/lib/art/kit";

export default function AppBar() {
  return (
    <>
      <div className="appbar">
        <Link href="/" aria-label="Stash home" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <TailMark badge size={26} />
          <Wordmark size={26} />
        </Link>
        <span className="grow" />
        <Link href="/ledger" className="icon-btn" aria-label="The Ledger"><Book color={C.ink70} /></Link>
        <Link href="/settings" className="icon-btn" aria-label="Standing Orders"><Gear color={C.ink70} /></Link>
      </div>
      <hr className="hr appbar-rule" />
    </>
  );
}
