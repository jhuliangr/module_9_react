import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { MainMenu } from './MainMenu';

describe('MainMenu component works as expected', () => {
  it('works', () => {
    render(<MainMenu />);
  });
});
