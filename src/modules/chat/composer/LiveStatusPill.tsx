import { useEffect, useState } from 'react';

import { authenticatedFetch } from '@/shared/api';

type LiveTask = { taskType?: string; description?: string };
export type LiveStatus = { live: boolean; busy: boolean; expiresAt: number | null; tasks: LiveTask[] };

const POLL_MS = 5_000;

/** "Live", "Live · 1 shell · 2 tasks" or "Sleeping". */
export function liveStatusText(status: LiveStatus | null): string {
  if (!status?.live) return 'Sleeping';
  const tasks = status.tasks || [];
  const shells = tasks.filter((task) => task.taskType === 'local_bash').length;
  const others = tasks.length - shells;
  return 'Live'
    + (shells ? ` · ${shells} shell${shells > 1 ? 's' : ''}` : '')
    + (others ? ` · ${others} task${others > 1 ? 's' : ''}` : '');
}

/** Tooltip: what the process is doing, or when an idle one closes. */
export function liveStatusTitle(status: LiveStatus, now = Date.now()): string {
  if (!status.live) return 'No live process: the next message starts one';
  if (status.busy) return 'Live process: working';
  if (status.tasks.length) return 'Live process: background work running';
  const minutes = Math.max(1, Math.round(((status.expiresAt || now) - now) / 60_000));
  return `Live process: closes after ${minutes} min idle`;
}

/**
 * Whether the chat's Claude CLI process is still up (it is kept between turns,
 * so the next message starts at once and background work keeps running).
 * Polled while the tab is visible; the label is hidden on phones (dot only).
 */
export function LiveStatusPill({ sessionId }: { sessionId: string | null }) {
  const [status, setStatus] = useState<LiveStatus | null>(null);

  useEffect(() => {
    let active = true;
    setStatus(null);
    if (!sessionId) return undefined;
    const load = async () => {
      try {
        const response = await authenticatedFetch(`/api/providers/claude/live?sessionId=${encodeURIComponent(sessionId)}`);
        const data = response.ok ? (await response.json())?.data ?? null : null;
        if (active) setStatus(data);
      } catch {
        if (active) setStatus(null);
      }
    };
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [sessionId]);

  if (!status) return null;
  const title = liveStatusTitle(status);
  return (
    <span
      title={title}
      aria-label={title}
      className={`flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-2 text-xs font-medium ${status.live ? 'text-emerald-500' : 'text-muted-foreground'}`}
    >
      {'●'}
      <span className="hidden sm:inline">{liveStatusText(status)}</span>
    </span>
  );
}
