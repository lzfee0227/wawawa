import type { Diagnostic } from './types.js';
export class GameError extends Error {
  constructor(public status: number, public code: string, message: string, public diagnostics?: Diagnostic[]) { super(message); }
}
