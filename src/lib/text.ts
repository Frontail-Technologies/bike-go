export const initials = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");

export const titleCase = (value: string) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
