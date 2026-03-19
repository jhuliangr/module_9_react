import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { Box } from './';

describe('Box component works as expected', () => {
  it('works', () => {
    render(<Box>something</Box>);
  });
});
