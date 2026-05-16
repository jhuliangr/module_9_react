export type {
  CharacterDefinition,
  RenderContext,
  PlayerRenderContext,
} from './types';
export { characterRegistry } from './registry';

// Side-effect imports: register all built-in characters
import './knight/knight';
import './mage/mage';
import './rogue/rogue';
import './golem/golem';
