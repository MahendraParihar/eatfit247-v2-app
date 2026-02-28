# Admin Shipment Flow – API Integration Validation

## Overview

This document validates the admin shipment flow (`lib-shipment-flow`) against the server delivery API and confirms integration points.

## Flow Summary (per SHIPMENT_FLOW_VALIDATION.md)

| Step | Admin Action | API Call | Server Endpoint | Status |
|------|--------------|----------|-----------------|--------|
| 1 | Load order for review | `getProductOrder(memberId, memberProductId)` | `GET /member/:id/product/:productId` | ✅ Aligned |
| 2a | Create draft + items | `createDraft({ memberProductId, items })` | `POST /delivery/create-draft` | ✅ Aligned |
| 2b | Add/update items on draft | `addItems(shipmentId, { items })` | `POST /delivery/:id/items` | ✅ Aligned |
| 3 | Get rate quotes | `getRates(shipmentId)` | `POST /delivery/:id/rates` | ✅ Aligned |
| 4 | Book shipment | `bookShipment(shipmentId, { rateQuoteId })` | `POST /delivery/:id/book` | ✅ Aligned |
| 5 | Get tracking | `getTracking(shipmentId)` | `GET /delivery/:id/tracking` | ✅ Aligned |

## API Contract Validation

### Request Payloads

- **CreateDraft**: `{ memberProductId: number; items: { memberProductOrderItemId: number; quantity: number }[] }`
- **AddItems**: `{ items: { memberProductOrderItemId: number; quantity: number }[] }`
- **BookShipment**: `{ rateQuoteId?: number; providerId?: number }`

### Response Handling

- Server wraps all responses in `IResponse<T>` (`{ code, message, data }`).
- Admin `DeliveryApiService` correctly uses `res.data` for typed responses.

### Shipment Status Flow

- `DRAFT` → `RATE_REQUESTED` (after getRates) → `RATE_SELECTED` (after book with rateQuoteId) → `BOOKED` / `FAILED`
- Admin `navigateToStepByStatus()` correctly maps statuses to stepper steps.

## Entry Points

1. **Member Product Orders** – "Start Shipment" opens `ShipmentFlowComponent` with `{ memberId, memberProductId }`.
2. **Member Product Report** – Same dialog with `{ memberId, memberProductId }`.
3. **Route** – `/delivery/shipment/:memberId/:memberProductId` for direct navigation.

## Legacy / Unused Methods

The following `DeliveryApiService` methods are not used in the current flow and may be deprecated:

- `createShipmentForOrder(orderId)` – Uses old `POST /delivery/shipments` with `orderId`; new flow uses `createDraft` with `memberProductId`.
- `getShipmentByOrderId(orderId)` – Uses `ids` search; flow uses `getShipmentDetails(id)` and order data from `getProductOrder`.
- `selectRate(id, rateQuoteId)` – Redundant; `bookShipment` selects rate when `rateQuoteId` is provided.

## Integration Checklist

- [x] `getProductOrder` → Member module `GET /member/:id/product/:productId`
- [x] `getShipmentDetails` → `GET /delivery/shipments/:id`
- [x] `createDraft` → `POST /delivery/create-draft`
- [x] `addItems` → `POST /delivery/:id/items`
- [x] `getRates` → `POST /delivery/:id/rates`
- [x] `bookShipment` → `POST /delivery/:id/book`
- [x] `getTracking` → `GET /delivery/:id/tracking`
- [x] `retryBooking` → `POST /delivery/:id/book` (same as book, for FAILED status)
