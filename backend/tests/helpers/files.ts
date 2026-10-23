import { fakeS3 } from "./fake-s3";

export const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
export const EXE = Uint8Array.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xff, 0xff, 0, 0]);
export const TEXT = new TextEncoder().encode("this is plainly not an image");

const PNG_BASE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89];
const JPEG_BASE = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0];
const WEBP_BASE = [0x52, 0x49, 0x46, 0x46, 0x1a, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 0x0e, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let serial = 0;
const distinct = (base: number[], tail: number[] = []) => {
  serial += 1;
  return Uint8Array.from([...base, serial & 0xff, (serial >> 8) & 0xff, ...tail]);
};

export const png = () => distinct(PNG_BASE);
export const jpeg = () => distinct(JPEG_BASE, [0xff, 0xd9]);
export const webp = () => distinct(WEBP_BASE);

export const asFile = (bytes: Uint8Array, name: string, type?: string) => new File([bytes as BlobPart], name, type ? { type } : {});

type FieldValue = string | number | boolean | File | undefined | (string | File)[];

export function formOf(fields: Record<string, FieldValue>) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) for (const item of value) form.append(name, item);
    else form.append(name, value instanceof File ? value : String(value));
  }
  return form;
}

export const storedKeys = (prefix = "") => [...fakeS3().objects.keys()].filter((key) => key.startsWith(prefix));

export const storedBytes = (key: string) => fakeS3().objects.get(key)?.bytes;
