export function formatTHB(n: number | string | null | undefined): string {
  return Number(n || 0).toLocaleString('th-TH');
}
