import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { authenticatedFetch } from '@/shared/api';
import { useComposerMenuAnchor } from '@/modules/chat/hooks/useComposerMenuAnchor';
import {
  ComposerMenuHeading,
  ComposerMenuItem,
  ComposerMenuSurface,
} from '@/modules/chat/composer/ComposerMenuPrimitives';

type UsageWindow = { pct: number; resetsAt: string };
type PlanUsage =
  | { state: 'ok'; fiveHour: UsageWindow | null; sevenDay: UsageWindow | null; sevenDayOpus: UsageWindow | null }
  | { state: 'unavailable' | 'nologin' | 'expired' | 'error'; status?: number };

const POLL_MS = 90_000;

const STATE_TEXT: Record<string, string> = {
  nologin: 'No Claude login for this account.',
  expired: 'Login token expired. It refreshes on the next turn of this account (or run /usage).',
};

/** "HH:MM" today, "Ddd HH:MM" on another day, in local time. */
export function formatPlanReset(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return date.toDateString() === now.toDateString()
    ? clock
    : `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${clock}`;
}

const pctClass = (pct: number) => (pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-emerald-500');
const windowText = (window: UsageWindow | null) => (window ? `${window.pct}% · resets ${formatPlanReset(window.resetsAt)}` : '--');

function Pct({ window, prefix }: { window: UsageWindow | null; prefix: string }) {
  if (!window) return <span>{prefix}--</span>;
  return (
    <span>
      {prefix}
      <span className={`tabular-nums ${pctClass(window.pct)}`}>{window.pct}%</span>
    </span>
  );
}

/**
 * Plan usage of the composer's Claude account (5-hour and weekly limits with
 * their reset times), like the terminal status line. Polled while the tab is
 * visible; hidden for accounts without a Claude login (API key / other base URL).
 */
export function PlanUsageMenu({ model }: { model: string }) {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const { triggerRef, menuRef, anchor, updateAnchor } = useComposerMenuAnchor(isOpen, close);

  const load = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`/api/providers/claude/plan-usage?model=${encodeURIComponent(model)}`);
      setUsage(response.ok ? (await response.json())?.data ?? null : null);
    } catch {
      setUsage(null);
    }
  }, [model]);

  useEffect(() => {
    setUsage(null);
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!usage || usage.state === 'unavailable') return null;

  const label = 'Plan usage';
  const rows: [string, UsageWindow | null][] | null = usage.state === 'ok'
    ? [
        ['Current session (5h)', usage.fiveHour],
        ['This week (all models)', usage.sevenDay],
        ...(usage.sevenDayOpus ? [['This week (Opus)', usage.sevenDayOpus] as [string, UsageWindow]] : []),
      ]
    : null;
  const problem = usage.state === 'ok'
    ? ''
    : STATE_TEXT[usage.state] ?? `Usage unavailable${usage.status ? ` (HTTP ${usage.status})` : ''}.`;
  const fiveHour = usage.state === 'ok' ? usage.fiveHour : null;
  const sevenDay = usage.state === 'ok' ? usage.sevenDay : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          updateAnchor();
          void load();
          setIsOpen((open) => !open);
        }}
        className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        title={rows ? `5h: ${windowText(fiveHour)}\n7d: ${windowText(sevenDay)}` : problem}
      >
        {rows ? (
          <>
            <span className="sm:hidden"><Pct window={fiveHour} prefix="" /></span>
            <span className="hidden gap-1 sm:flex">
              <Pct window={fiveHour} prefix="5h " />
              {fiveHour && <span className="text-muted-foreground">{'↻'}{formatPlanReset(fiveHour.resetsAt)}</span>}
              <span className="text-muted-foreground">{'·'}</span>
              <Pct window={sevenDay} prefix="7d " />
            </span>
          </>
        ) : '--'}
      </button>
      {isOpen && anchor && createPortal(
        <ComposerMenuSurface anchor={anchor} menuRef={menuRef} ariaLabel={label}>
          <ComposerMenuHeading>{label}</ComposerMenuHeading>
          {rows
            ? rows.map(([name, window]) => (
              <ComposerMenuItem key={name} label={name} description={windowText(window)} isSelected={false} onSelect={close} />
            ))
            : <ComposerMenuItem label="Not available" description={problem} isSelected={false} onSelect={close} />}
        </ComposerMenuSurface>,
        document.body,
      )}
    </>
  );
}
