import { NewThreadTrigger } from "@/components/forum/new-thread-trigger";

export function HomeCta() {
  return (
    <div className="flex flex-col items-center gap-[18px] rounded-xl bg-surface px-8 py-12 text-center">
      <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.03em] leading-[1.2] text-ink">
        Have an idea worth defending?
      </h2>
      <p className="m-0 max-w-[46ch] text-base leading-[1.5] text-slate">
        Bring your own research. The council is harder on claims without it.
      </p>
      <NewThreadTrigger label="Start a thread" />
    </div>
  );
}
