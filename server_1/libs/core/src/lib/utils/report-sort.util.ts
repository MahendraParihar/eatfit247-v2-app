type Coerced =
  | { kind: 'null' }
  | { kind: 'number'; n: number }
  | { kind: 'date'; t: number }
  | { kind: 'string'; s: string };

/**
 * Stable server-side sorting for report rows already loaded into memory.
 */
export class ReportSortUtil {
  static sortInMemory<T>(
    rows: T[],
    sortBy: string | undefined,
    sortOrder: string | undefined,
    accessors: Record<string, (row: T) => unknown>,
  ): T[] {
    if (!sortBy || !accessors[sortBy]) {
      return rows;
    }
    const dir = String(sortOrder ?? 'asc').toLowerCase() === 'desc' ? -1 : 1;
    const get = accessors[sortBy];
    const copy = [...rows];
    copy.sort((a, b) => ReportSortUtil.compare(get(a), get(b), dir));
    return copy;
  }

  private static compare(a: unknown, b: unknown, dir: number): number {
    const ca = ReportSortUtil.coerce(a);
    const cb = ReportSortUtil.coerce(b);
    if (ca.kind === 'null' && cb.kind === 'null') {
      return 0;
    }
    if (ca.kind === 'null') {
      return 1;
    }
    if (cb.kind === 'null') {
      return -1;
    }
    if (ca.kind === 'number' && cb.kind === 'number') {
      return ca.n < cb.n ? -dir : ca.n > cb.n ? dir : 0;
    }
    if (ca.kind === 'date' && cb.kind === 'date') {
      return ca.t < cb.t ? -dir : ca.t > cb.t ? dir : 0;
    }
    const sa = ca.kind === 'string' ? ca.s : ReportSortUtil.fallbackString(a);
    const sb = cb.kind === 'string' ? cb.s : ReportSortUtil.fallbackString(b);
    return sa < sb ? -dir : sa > sb ? dir : 0;
  }

  private static fallbackString(v: unknown): string {
    return String(v ?? '').toLowerCase();
  }

  private static coerce(v: unknown): Coerced {
    if (v === null || v === undefined || v === '') {
      return { kind: 'null' };
    }
    if (typeof v === 'number' && Number.isFinite(v)) {
      return { kind: 'number', n: v };
    }
    if (typeof v === 'boolean') {
      return { kind: 'number', n: v ? 1 : 0 };
    }
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      return { kind: 'date', t: v.getTime() };
    }
    if (typeof v === 'string') {
      const ts = Date.parse(v);
      if (!Number.isNaN(ts) && /\d{4}-\d{2}-\d{2}/.test(v)) {
        return { kind: 'date', t: ts };
      }
      const n = Number(v);
      if (v.trim() !== '' && Number.isFinite(n)) {
        return { kind: 'number', n };
      }
      return { kind: 'string', s: v.toLowerCase() };
    }
    return { kind: 'string', s: String(v).toLowerCase() };
  }
}
