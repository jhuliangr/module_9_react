import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '.';

describe('Button component works as expected', () => {
  it('works', () => {
    render(<Button>something</Button>);
  });
});
