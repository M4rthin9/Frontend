/** Thai national ID (X-XXXX-XXXXX-XX-X) or Passport (alnum 6-20). */
export function validateIdFormat(val: string): { valid: boolean; error?: string } {
  if (!val) return { valid: true };
  if (val.includes('-')) {
    const valid = /^\d{1}-\d{4}-\d{5}-\d{2}-\d{1}$/.test(val);
    return {
      valid,
      error: valid ? undefined : 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง (X-XXXX-XXXXX-XX-X)',
    };
  }
  const valid = /^[A-Za-z0-9]{6,20}$/.test(val);
  return {
    valid,
    error: valid ? undefined : 'รูปแบบ Passport ไม่ถูกต้อง (ตัวอักษร/ตัวเลข 6-20 หลัก)',
  };
}

export function normalizePhone(val: string): string {
  return val.replace(/[^0-9]/g, '');
}

/** Thai mobile numbers must have exactly 10 digits. */
export function validatePhone(val: string): { cleaned: string; valid: boolean; error?: string } {
  const cleaned = normalizePhone(val);
  return {
    cleaned,
    valid: cleaned.length === 10,
    error: 'เบอร์โทรศัพท์ต้องมี 10 ตัวเลข',
  };
}
