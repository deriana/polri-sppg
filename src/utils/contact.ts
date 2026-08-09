// Converts a local Indonesian phone number (e.g. "0812-1000-0001") into the
// digits-only, country-code-prefixed form wa.me expects (e.g. "6281210000001").
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}
