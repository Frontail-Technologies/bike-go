export function newReference(prefix: "RG" | "LN") {
  const digits = new Uint32Array(1);
  crypto.getRandomValues(digits);
  const value = 10_000_000 + (digits[0]! % 90_000_000);
  return `${prefix}${value}`;
}

export const REFERENCE_PATTERN = /^(RG|LN)\d{8}$/;
