export interface PublicBookingCapacity {
  perDay: number;
  previousPerDay: number;
  effectiveFrom: string;
}

export const DEFAULT_PUBLIC_BOOKING: PublicBookingCapacity = {
  perDay: 25,
  previousPerDay: 20,
  effectiveFrom: '2026-11-09',
};

export function publicCapacityForDate(config: PublicBookingCapacity, date: string): number {
  return date >= config.effectiveFrom ? config.perDay : config.previousPerDay;
}
