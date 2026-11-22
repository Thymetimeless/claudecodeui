import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { ClaudeAccount } from './claude-accounts.js';

export type ClaudePlanUsageWindow = { pct: number; resetsAt: string };

export type ClaudePlanUsage =
  | { state: 'ok'; fiveHour: ClaudePlanUsageWindow | null; sevenDay: ClaudePlanUsageWindow | null; sevenDayOpus: ClaudePlanUsageWindow | null }
  | { state: 'unavailable' | 'nologin' | 'expired' | 'error'; status?: number };

const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; data: ClaudePlanUsage }>();

const toWindow = (bucket: { utilization?: unknown; resets_at?: unknown } | null | undefined): ClaudePlanUsageWindow | null => (
  bucket && typeof bucket.utilization === 'number'
    ? { pct: Math.round(bucket.utilization), resetsAt: String(bucket.resets_at ?? '') }
    : null
);

/**
 * 5-hour and weekly plan usage of a Claude login, read from the CLI's own
 * credentials file. Read-only: an expired token is reported, never refreshed
 * here (a refresh racing the CLI's own can revoke the login). Uses the same
 * unofficial endpoint as the CLI's /usage; it may change.
 */
export async function readClaudePlanUsage(account: ClaudeAccount | null): Promise<ClaudePlanUsage> {
  const accountEnv = account?.env || {};
  if (accountEnv.ANTHROPIC_BASE_URL || accountEnv.ANTHROPIC_API_KEY || accountEnv.ANTHROPIC_AUTH_TOKEN) {
    return { state: 'unavailable' };
  }
  let oauth: { accessToken?: string; expiresAt?: number } | null = null;
  if (accountEnv.CLAUDE_CODE_OAUTH_TOKEN) {
    oauth = { accessToken: accountEnv.CLAUDE_CODE_OAUTH_TOKEN };
  } else {
    const configDir = account?.configDir
      || (process.env.CLAUDE_CONFIG_DIR || '').trim()
      || path.join(os.homedir(), '.claude');
    try {
      oauth = JSON.parse(await fs.readFile(path.join(configDir, '.credentials.json'), 'utf8'))?.claudeAiOauth ?? null;
    } catch {
      oauth = null;
    }
  }
  if (!oauth?.accessToken) {
    return { state: 'nologin' };
  }
  if (Number(oauth.expiresAt || 0) && Number(oauth.expiresAt) < Date.now()) {
    return { state: 'expired' };
  }
  try {
    const res = await fetch('https://api.anthropic.com/api/oauth/usage', {
      headers: { Authorization: 'Bearer ' + oauth.accessToken },
    });
    if (!res.ok) {
      return { state: 'error', status: res.status };
    }
    type Bucket = { utilization?: unknown; resets_at?: unknown } | null;
    const usage = (await res.json()) as { five_hour?: Bucket; seven_day?: Bucket; seven_day_opus?: Bucket } | null;
    return {
      state: 'ok',
      fiveHour: toWindow(usage?.five_hour),
      sevenDay: toWindow(usage?.seven_day),
      sevenDayOpus: toWindow(usage?.seven_day_opus),
    };
  } catch {
    return { state: 'error' };
  }
}

/** Same as readClaudePlanUsage, cached for a minute per account (the composer polls it). */
export async function readClaudePlanUsageCached(account: ClaudeAccount | null): Promise<ClaudePlanUsage> {
  const key = account?.id ?? '';
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.data;
  }
  const data = await readClaudePlanUsage(account);
  cache.set(key, { at: Date.now(), data });
  return data;
}

const STATE_TEXT: Record<string, string> = {
  unavailable: 'Not available for this account',
  nologin: 'No Claude login found',
  expired: 'Login expired: run claude once to refresh it',
};

/** Rows for the /usage card. */
export function planUsageRows(usage: ClaudePlanUsage): { label: string; value: string }[] {
  if (usage.state !== 'ok') {
    const text = STATE_TEXT[usage.state] ?? (usage.status ? `Unavailable (HTTP ${usage.status})` : 'Unavailable');
    return [{ label: 'Plan usage', value: text }];
  }
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, window: ClaudePlanUsageWindow | null) => {
    if (!window) return;
    const reset = new Date(window.resetsAt);
    const resetText = Number.isNaN(reset.getTime()) ? '' : ' · resets ' + reset.toLocaleString();
    rows.push({ label, value: window.pct + '%' + resetText });
  };
  add('Current session (5h)', usage.fiveHour);
  add('This week (all models)', usage.sevenDay);
  add('This week (Opus)', usage.sevenDayOpus);
  return rows.length ? rows : [{ label: 'Plan usage', value: 'No active limits' }];
}
