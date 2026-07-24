// Single source of truth for order pricing. These MUST match the backend
// (com.dishaspora.order.service.OrderService: FEE_RATE and DELIVERY_MINOR) or
// the total shown in the app won't equal what Paystack charges.
export const FEE_RATE = 0.07; // 7% platform fee
export const DELIVERY_MINOR = 300; // flat delivery, in minor units

/** Compute the order breakdown from a subtotal (minor units). */
export function orderTotals(subtotalMinor: number) {
  const feeMinor = Math.round(subtotalMinor * FEE_RATE);
  const totalMinor = subtotalMinor + feeMinor + DELIVERY_MINOR;
  return { subtotalMinor, feeMinor, deliveryMinor: DELIVERY_MINOR, totalMinor };
}
