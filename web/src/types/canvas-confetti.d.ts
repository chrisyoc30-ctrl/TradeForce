/**
 * Ambient types for `canvas-confetti` — always available in this package (avoids
 * CI/Railway workspace installs where `@types/canvas-confetti` is not linked into
 * `web/node_modules` after Nixpacks' follow-up `npm install -w web ...`).
 */
declare module "canvas-confetti" {
  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    zIndex?: number;
    colors?: string[];
    [key: string]: unknown;
  }

  type ConfettiFn = (options?: Options) => void;
  const confetti: ConfettiFn;
  export default confetti;
}
