export type Coordinates = { latitude: number; longitude: number };

const valid = (latitude: number, longitude: number): Coordinates | null =>
  Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;

const pair = /(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/;

/** Reads coordinates out of a pasted map link (or plain "lat, lng"). Short links can't be resolved offline. */
export function parseMapLink(input: string): Coordinates | null {
  const text = input.trim();
  if (!text) return null;
  const decoded = (() => { try { return decodeURIComponent(text); } catch { return text; } })();
  const place = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place) return valid(Number(place[1]), Number(place[2]));
  const at = decoded.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (at) return valid(Number(at[1]), Number(at[2]));
  const query = decoded.match(/[?&](?:q|ll|query|destination|center)=([^&#]+)/);
  const fromQuery = query?.[1].match(pair);
  if (fromQuery) return valid(Number(fromQuery[1]), Number(fromQuery[2]));
  if (!/^https?:\/\//i.test(decoded)) {
    const plain = decoded.match(new RegExp(`^${pair.source}$`));
    if (plain) return valid(Number(plain[1]), Number(plain[2]));
  }
  return null;
}

export const isShortMapLink = (input: string) => /^(https?:\/\/)?(maps\.app\.goo\.gl|goo\.gl\/maps|bit\.ly)\//i.test(input.trim());

export function mapLinkError(input: string) {
  if (isShortMapLink(input)) return "Short links can’t be read here. Open the link, then copy the full address from the browser.";
  return "Couldn’t find coordinates in that link. Paste a full Google Maps link or “latitude, longitude”.";
}
