import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { semanticValues } from '@/lib/semantic-labels';

describe('M9 semantic badge design contract', () => {
  it('maps every implemented status, priority and type to a labeled style token', () => {
    for (const kind of ['status', 'priority', 'type']) for (const value of semanticValues[kind]) {
      const { unmount } = render(<SemanticBadge kind={kind} value={value}/>);
      expect(screen.getByText(value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()))).toHaveAttribute('data-value', value);
      unmount();
    }
  });
  it('has visible text fallback for future unknown enum values', () => {
    render(<SemanticBadge kind="status" value="SOMETHING_NEW"/>);
    expect(screen.getByText('Something New')).toHaveAttribute('data-value', 'UNKNOWN');
  });
});
