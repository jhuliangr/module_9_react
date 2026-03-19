import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { ErrorComponent } from './';

describe('ErrorComponent component works as expected', () => {
  it('works', () => {
    render(<ErrorComponent />);
  });
});
