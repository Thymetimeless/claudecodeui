import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '@/modules/i18n';
import { ToolRenderer } from '@/modules/chat/tools/ToolRenderer';

describe('PowerShell tool row', () => {
  it('uses the collapsible shell row like Bash: collapsed first, output on expand', () => {
    const { container } = render(
      <ToolRenderer
        toolName="PowerShell"
        toolInput={JSON.stringify({ command: 'Get-Content a.txt; Get-Content b.txt', description: 'Read two files' })}
        toolResult={{ content: 'alpha-line\nbeta-line', isError: false }}
        toolId="toolu_ps1"
        mode="input"
      />,
    );
    const toggle = container.querySelector('[aria-expanded]') as HTMLElement;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).not.toContain('beta-line');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('beta-line');
  });
});
