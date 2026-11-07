/** A plain JSON object: not null, not an array. For reading untrusted JSON (saves, ledger rows). */
export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
