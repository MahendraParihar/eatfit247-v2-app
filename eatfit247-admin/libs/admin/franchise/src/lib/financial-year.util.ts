const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `mst_franchises.financial_year` is the 1-based start month of the financial year (4 = April to March). */
export const FINANCIAL_YEAR_OPTIONS: { value: number; label: string }[] = MONTHS.map((startMonth, i) => ({
  value: i + 1,
  label: `${startMonth} to ${MONTHS[(i + 11) % 12]}`,
}));

export function financialYearLabel(value: number | null | undefined): string {
  return FINANCIAL_YEAR_OPTIONS.find((o) => o.value === Number(value))?.label ?? '';
}
