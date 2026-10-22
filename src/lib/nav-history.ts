/**
 * Did the user navigate inside the app during this page load? Module state resets on a hard load or a
 * deep link, which is exactly when "back" must not leave the app. Updated by <NavTracker /> in the shells.
 */
let navigations = 0;

export function markNavigated() {
  navigations += 1;
}

export function hasInAppHistory() {
  return navigations > 0;
}
