import { FormatCurrencyPipe } from './currency.pipe';

describe('FormatCurrencyPipe', () => {
  let pipe: FormatCurrencyPipe;

  beforeEach(() => {
    pipe = new FormatCurrencyPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format currency with default INR', () => {
    const result = pipe.transform(1234.56);
    expect(result).toBe('INR 1,234.56');
  });

  it('should format currency with custom currency code', () => {
    const result = pipe.transform(1234.56, 'USD');
    expect(result).toBe('USD 1,234.56');
  });

  it('should format currency with no decimals', () => {
    const result = pipe.transform(1000);
    expect(result).toBe('INR 1,000.00');
  });

  it('should format large numbers correctly', () => {
    const result = pipe.transform(1234567.89);
    expect(result).toBe('INR 12,34,567.89');
  });

  it('should handle null values', () => {
    const result = pipe.transform(null);
    expect(result).toBe('INR 0.00');
  });

  it('should handle undefined values', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('INR 0.00');
  });

  it('should handle zero values', () => {
    const result = pipe.transform(0);
    expect(result).toBe('INR 0.00');
  });

  it('should format negative values', () => {
    const result = pipe.transform(-1234.56);
    expect(result).toBe('INR -1,234.56');
  });

  it('should handle custom locale', () => {
    const result = pipe.transform(1234.56, 'USD', 'en-US');
    expect(result).toBe('USD 1,234.56');
  });
});

