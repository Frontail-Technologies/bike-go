export type DynamicT = (key: string, values?: Record<string, string | number>) => string;

export const dynamicT = (t: unknown) => t as DynamicT;

export const camel = (id: string) => id.replace(/-(\w)/g, (_, char: string) => char.toUpperCase());
