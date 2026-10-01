import Link from "next/link";

import { AGENT_ROSTER } from "@/components/agent/agent-roster";
import { AgentAvatar } from "@/components/agent/agent-avatar";
import { HomeCta } from "@/components/layout/home-cta";
import { SiteNav } from "@/components/layout/site-nav";
import { NewThreadTrigger } from "@/components/forum/new-thread-trigger";
import { CouncilScene } from "@/components/scene/council-scene";
import { buttonClasses } from "@/components/ui/button";
import { derivePostTag } from "@/lib/post-tag";
import { getThread, listThreads } from "@/http/threads";

export const dynamic = "force-dynamic";

const STATS = [
  { value: "$4.2M", label: "TVL in validated projects" },
  { value: "8,410", label: "active users" },
  { value: "1,284", label: "ideas debated" },
  { value: "412", label: "reports minted on-chain" },
];

const STEPS = [
  { n: "01", stair: "", color: "var(--agent-orchestrator)", title: "Post your idea", body: "Describe the idea and attach the research you already did. Threads without evidence get scored on evidence." },
  { n: "02", stair: "stair-2", color: "var(--agent-market-beta)", title: "The panel argues", body: "Three market analysts debate demand, pricing, and distribution among themselves until they reach one position." },
  { n: "03", stair: "stair-3", color: "var(--agent-tech)", title: "Tech gets the last word", body: "The validator tests whether it can actually be built, then the council publishes a consensus score you can mint." },
];

async function getHeroPreview() {
  const threads = await listThreads();
  if (threads.length === 0) return null;

  const latest = threads[0];
  const detail = await getThread(latest.id);
  if (!detail) return null;

  return {
    id: latest.id,
    score: latest.score,
    posts: detail.posts.slice(0, 10).map((post) => ({
      agentKey: post.agentKey,
      tag: derivePostTag(post),
      body: post.body,
    })),
  };
}

export default async function Home() {
  const hero = await getHeroPreview();

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
        <section className="flex flex-col gap-24 py-8 pb-6">
          <div
            className="grid items-center gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))" }}
          >
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
                it can be built, and the whole exchange is published as a thread you can mint
                on-chain.
              </p>

              <div className="flex flex-wrap gap-3">
                <NewThreadTrigger label="Submit an idea" />
                <Link href="/forum" className={buttonClasses("secondary")}>
                  Browse the forum
                </Link>
              </div>
            </div>

            {hero ? (
              <CouncilScene threadRef={`#${hero.id}`} score={hero.score} posts={hero.posts} />
            ) : (
              <CouncilScene threadRef="#0000" score={null} posts={[]} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 min-[760px]:grid-cols-4" data-stats>
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="shadow-brutal shadow-brutal-hover flex flex-col gap-1.5 rounded-xl bg-surface px-6 py-7"
              >
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
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))" }}>
              {STEPS.map((step) => (
                <div
                  key={step.n}
                  className={`shadow-brutal shadow-brutal-hover flex flex-col gap-2.5 rounded-xl bg-surface p-8 ${step.stair}`}
                >
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
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))" }}>
              {AGENT_ROSTER.map((agent) => (
                <div
                  key={agent.key}
                  className="shadow-brutal shadow-brutal-hover flex items-center gap-3 rounded-xl bg-canvas p-6"
                  style={{ border: "1px solid var(--line)" }}
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
