# Shared UI Pipes

This directory contains reusable Angular pipes for the EatFit247 Admin application.

## Available Pipes

### 1. AddressPipe

Formats an `IMemberAddress` object into a human-readable address string.

**Pipe Name:** `address`

**Usage:**
```html
{{ addressObject | address }}
```

**Example:**
```typescript
// Input
const address: IMemberAddress = {
  addressId: 1,
  postalAddress: '123 Main Street',
  cityVillage: 'Mumbai',
  state: 'Maharashtra',
  pinCode: '400001',
  country: 'India',
  countryId: 1,
  stateId: 1
};

// Output
"123 Main Street, Mumbai, Maharashtra, 400001, India"
```

**Features:**
- Handles null/undefined addresses (returns "N/A")
- Automatically filters out empty fields
- Joins address parts with commas
- Works with partial address data

---

### 2. FormatCurrencyPipe

Formats currency values with proper locale formatting.

**Pipe Name:** `formatCurrency`

**Usage:**
```html
<!-- With default INR currency -->
{{ amount | formatCurrency }}

<!-- With custom currency code -->
{{ amount | formatCurrency:'USD' }}

<!-- With custom locale -->
{{ amount | formatCurrency:'USD':'en-US' }}
```

**Parameters:**
1. `amount` (required): The number to format
2. `currencyCode` (optional, default: 'INR'): The currency code
3. `locale` (optional, default: 'en-IN'): The locale for number formatting

**Examples:**
```typescript
// Input: 1234.56
// Output: "INR 1,234.56"

// Input: 1234.56, 'USD'
// Output: "USD 1,234.56"

// Input: null
// Output: "INR 0.00"
```

**Features:**
- Handles null/undefined values (returns "0.00")
- Uses locale-specific number formatting
- Always displays 2 decimal places
- Supports Indian numbering system (lakhs/crores) with en-IN locale
- Prefix currency code for clarity

---

## Integration with DatePipe

For date formatting, use Angular's built-in `DatePipe`:

```html
<!-- Import DatePipe in your component -->
import { DatePipe } from '@angular/common';

<!-- Use in template -->
{{ dateValue | date:'fullDate' }}
{{ dateValue | date:'short' }}
{{ dateValue | date:'dd/MM/yyyy' }}
```

**Common Date Formats:**
- `'short'`: 1/24/26, 3:30 PM
- `'medium'`: Jan 24, 2026, 3:30:00 PM
- `'long'`: January 24, 2026 at 3:30:00 PM GMT+5:30
- `'fullDate'`: Saturday, January 24, 2026
- `'dd/MM/yyyy'`: 24/01/2026

---

## Importing Pipes

All pipes are exported from the `@shared` module:

```typescript
import { AddressPipe, FormatCurrencyPipe } from '@shared';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    AddressPipe,
    FormatCurrencyPipe,
  ],
  // ...
})
export class YourComponent {}
```

---

## Testing

Each pipe includes comprehensive unit tests. Run tests with:

```bash
npm test
```

---

## Migration Guide

### Before (using component methods):

**TypeScript:**
```typescript
formatCurrency(currencyCode: string, amount: number): string {
  if (amount === null || amount === undefined) {
    return `${currencyCode} 0`;
  }
  return `${currencyCode} ${Number(amount).toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

formatAddress(address: IMemberAddress): string {
  if (!address) return 'N/A';
  const parts: string[] = [];
  if (address.postalAddress) parts.push(address.postalAddress);
  if (address.cityVillage) parts.push(address.cityVillage);
  if (address.pinCode) parts.push(address.pinCode);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
}
```

**HTML:**
```html
{{ formatCurrency(payment.currency || 'INR', payment.totalAmount) }}
{{ formatAddress(payment.memberAddress.address) }}
```

### After (using pipes):

**TypeScript:**
```typescript
// Import pipes in component
import { AddressPipe, FormatCurrencyPipe } from '@shared';
import { DatePipe } from '@angular/common';

@Component({
  imports: [
    DatePipe,
    AddressPipe,
    FormatCurrencyPipe,
  ],
  // ...
})
```

**HTML:**
```html
{{ payment.totalAmount | formatCurrency:(payment.currency || 'INR') }}
{{ payment.memberAddress.address | address }}
{{ payment.paymentDate | date:'fullDate' }}
```

**Benefits:**
- ✅ Cleaner templates
- ✅ Reusable across the application
- ✅ Better separation of concerns
- ✅ Easier to test
- ✅ More declarative code
- ✅ Built-in change detection optimization

---

## Best Practices

1. **Use pipes in templates** instead of component methods for formatting
2. **Import DatePipe** from `@angular/common` for date formatting
3. **Handle null/undefined** values - pipes include built-in safeguards
4. **Be consistent** with currency codes (use 'INR' for Indian Rupees)
5. **Test thoroughly** - use provided unit tests as examples

---

## Related Interfaces

### IMemberAddress
```typescript
interface IMemberAddress {
  addressId: number;
  postalAddress: string;
  cityVillage?: string;
  stateId: number;
  state: string;
  stateCode?: string;
  countryId: number;
  country: string;
  countryCode?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
}
```

