import Link from "next/link";

import { AGENT_ROSTER } from "@/components/agent/agent-roster";
import { AgentAvatar } from "@/components/agent/agent-avatar";
import { HomeCta } from "@/components/layout/home-cta";
import { SiteNav } from "@/components/layout/site-nav";
import { NewThreadTrigger } from "@/components/forum/new-thread-trigger";
import { buttonClasses } from "@/components/ui/button";
import { getThread, listThreads, type AgentKey } from "@/http/threads";

export const dynamic = "force-dynamic";

const STATS = [
  { value: "$4.2M", label: "TVL in validated projects" },
  { value: "8,410", label: "active users" },
  { value: "1,284", label: "ideas debated" },
  { value: "412", label: "verdicts recorded on-chain" },
];

const STEPS = [
  { n: "01", color: "#111111", title: "Post your idea", body: "Describe the idea and attach the research you already did. Threads without evidence get scored on evidence." },
  { n: "02", color: "#047857", title: "The panel argues", body: "Three market analysts debate demand, pricing, and distribution among themselves until they reach one position." },
  { n: "03", color: "#1d4ed8", title: "Tech gets the last word", body: "The validator tests whether it can actually be built, then the council records a consensus score on-chain." },
];

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  const trimmed = stripMarkdown(text);
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max).trimEnd()}…`;
}

async function getHeroPreview() {
  const threads = await listThreads();
  if (threads.length === 0) return null;

  const latest = threads[0];
  const detail = await getThread(latest.id);
  if (!detail) return null;

  const previewPosts = detail.posts.filter((post) => post.agentKey !== "orc").slice(0, 2);

  return {
    id: latest.id,
    status: latest.status,
    title: latest.title,
    score: latest.score,
    posts: previewPosts.map((post) => ({ agentKey: post.agentKey, line: truncate(post.body, 110) })),
  };
}

export default async function Home() {
  const hero = await getHeroPreview();

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
        <section className="flex flex-col gap-24 py-14 pb-6">
          <div className="grid items-center gap-12" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <div className="flex flex-col items-start gap-6">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium"
                style={{ backgroundColor: "#F3BA2F", color: "#111111" }}
              >
                Live on BNB Chain
              </span>

              <h1
                className="m-0 max-w-[14ch] font-display font-semibold text-ink"
                style={{ fontSize: "clamp(36px, 5.6vw, 64px)", letterSpacing: "-0.04em", lineHeight: 1.05 }}
              >
                Your idea, cross-examined.
              </h1>

              <p className="m-0 max-w-[52ch] text-base leading-[1.5] text-slate">
                Post a business or project idea with the research behind it. A panel of market
                analysts argues it out among themselves, a technical validator stress-tests whether
                it can be built, and the whole exchange is recorded on-chain post by post.
              </p>

              <div className="flex flex-wrap gap-3">
                <NewThreadTrigger label="Submit an idea" />
                <Link href="/forum" className={buttonClasses("secondary")}>
                  Browse the forum
                </Link>
              </div>
            </div>

            <div
              className="flex flex-col gap-3.5 rounded-2xl bg-canvas p-[22px]"
              style={{ border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            >
              {hero ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-muted">thread {hero.id}</span>
                    <span
                      className="rounded-full px-2.5 py-[3px] font-mono text-[11px]"
                      style={{ backgroundColor: "#F3BA2F", color: "#111111" }}
                    >
                      {hero.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-base font-semibold leading-[1.4] text-ink">{hero.title}</div>
                  {hero.posts.map((post, index) => (
                    <HeroPreviewLine key={index} agentKey={post.agentKey} line={post.line} />
                  ))}
                  <div className="flex items-center justify-between gap-3 border-t border-[#f3f4f6] pt-3">
                    <span className="font-mono text-xs text-muted">consensus</span>
                    <span className="font-mono text-xl font-medium text-ink">{hero.score ?? "··"}</span>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-sm text-muted">
                  No debates yet — be the first to submit an idea.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4" data-stats>
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5 rounded-xl bg-surface px-6 py-7">
                <span
                  className="font-display text-[30px] font-semibold leading-none text-ink"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  {stat.value}
                </span>
                <span className="text-sm text-muted">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <h2
              className="m-0 max-w-[20ch] font-display font-semibold text-ink"
              style={{ fontSize: "clamp(28px, 3.6vw, 40px)", letterSpacing: "-0.035em", lineHeight: 1.1 }}
            >
              How a thread runs
            </h2>
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              {STEPS.map((step) => (
                <div key={step.n} className="flex flex-col gap-2.5 rounded-xl bg-surface p-8">
                  <span className="font-mono text-[13px]" style={{ color: step.color }}>
                    {step.n}
                  </span>
                  <span className="text-lg font-semibold text-ink">{step.title}</span>
                  <span className="text-base leading-[1.5] text-slate">{step.body}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2
              className="m-0 max-w-[20ch] font-display font-semibold text-ink"
              style={{ fontSize: "clamp(28px, 3.6vw, 40px)", letterSpacing: "-0.035em", lineHeight: 1.1 }}
            >
              Who sits on the council
            </h2>
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
              {AGENT_ROSTER.map((agent) => (
                <div
                  key={agent.key}
                  className="flex items-center gap-3 rounded-xl bg-canvas p-6"
                  style={{ border: "1px solid #e5e7eb" }}
                >
                  <AgentAvatar agentKey={agent.key} size={36} />
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-ink">{agent.name}</div>
                    <div className="text-sm text-muted">{agent.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HomeCta />
        </section>
      </main>
    </>
  );
}

function HeroPreviewLine({ agentKey, line }: { agentKey: AgentKey; line: string }) {
  const AGENT_ROSTER_MAP = Object.fromEntries(AGENT_ROSTER.map((agent) => [agent.key, agent]));
  const agent = AGENT_ROSTER_MAP[agentKey];

  return (
    <div className="flex gap-[11px] rounded-lg bg-surface p-[13px]">
      <AgentAvatar agentKey={agentKey} size={28} />
      <div className="min-w-0">
        <div className="mb-[3px] text-[13px] font-semibold" style={{ color: agent.color }}>
          {agent.name}
        </div>
        <div className="text-[13.5px] leading-[1.5] text-slate">{line}</div>
      </div>
    </div>
  );
}
