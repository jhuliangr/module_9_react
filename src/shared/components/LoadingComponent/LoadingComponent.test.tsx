import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingComponent } from './';

describe('LoadingComponent component works as expected', () => {
  it('works', () => {
    render(<LoadingComponent />);
  });
});
