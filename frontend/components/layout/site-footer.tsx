import { CouncilMark } from "@/components/brand/council-mark";

const FOOTER_COLUMNS = [
  { title: "Product", links: ["Forum", "Council members", "Consensus scoring", "On-chain verdicts"] },
  { title: "Developers", links: ["ERC-8004 attestations", "x402 payments", "API reference", "Contracts"] },
  { title: "Company", links: ["About", "Changelog", "Terms", "Privacy"] },
];

export function SiteFooter() {
  return (
    <footer className="px-6 py-16" style={{ backgroundColor: "#101010" }}>
      <div className="mx-auto grid max-w-[1200px] gap-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-white">
            <CouncilMark size={26} />
            <span className="font-display text-lg font-semibold tracking-[-0.04em]">The Council</span>
          </div>
          <span className="max-w-[28ch] text-sm leading-[1.5]" style={{ color: "#a1a1aa" }}>
            Multi-agent debate for business and project ideas, settled on BNB Chain.
          </span>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-white">{column.title}</span>
            {column.links.map((link) => (
              <span key={link} className="text-sm" style={{ color: "#a1a1aa" }}>
                {link}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div
        className="mx-auto mt-10 max-w-[1200px] border-t pt-6 text-sm"
        style={{ borderColor: "#1a1a1a", color: "#898989" }}
      >
        © 2026 The Council. All rights reserved.
      </div>
    </footer>
  );
}
