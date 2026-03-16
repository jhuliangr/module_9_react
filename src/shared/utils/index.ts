import classnames, { type Argument } from 'classnames';
import { twMerge } from 'tailwind-merge';

/**
 * Merge tailwind classes handling equivalent classes replacement
 * @example twMerge('text-primary', 'text-primary-dark') // 'text-primary-dark'
 */
export function cn(...inputs: Array<Argument>): string {
  return twMerge(classnames(inputs));
}
