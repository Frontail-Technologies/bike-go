let navigations = 0;

export function markNavigated() {
  navigations += 1;
}

export function hasInAppHistory() {
  return navigations > 0;
}
