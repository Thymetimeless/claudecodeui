import { describe, expect, it } from 'vitest';

import { liveStatusText, liveStatusTitle, type LiveStatus } from '@/modules/chat/composer/LiveStatusPill';

const status = (over: Partial<LiveStatus>): LiveStatus => ({ live: true, busy: false, expiresAt: null, tasks: [], ...over });

describe('live status pill', () => {
  it('names the process state and its background work', () => {
    expect(liveStatusText(null)).toBe('Sleeping');
    expect(liveStatusText(status({ live: false }))).toBe('Sleeping');
    expect(liveStatusText(status({}))).toBe('Live');
    expect(liveStatusText(status({ tasks: [{ taskType: 'local_bash' }] }))).toBe('Live · 1 shell');
    expect(liveStatusText(status({ tasks: [{ taskType: 'local_bash' }, { taskType: 'local_bash' }, { taskType: 'local_agent' }] })))
      .toBe('Live · 2 shells · 1 task');
  });

  it('says when an idle process closes', () => {
    const now = 1_000_000;
    expect(liveStatusTitle(status({ live: false }), now)).toBe('No live process: the next message starts one');
    expect(liveStatusTitle(status({ busy: true }), now)).toBe('Live process: working');
    expect(liveStatusTitle(status({ tasks: [{ taskType: 'local_bash' }] }), now)).toBe('Live process: background work running');
    expect(liveStatusTitle(status({ expiresAt: now + 29 * 60_000 }), now)).toBe('Live process: closes after 29 min idle');
  });
});
