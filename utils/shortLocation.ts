/**
 * Shortens a full geocoded address to its "barangay, city, province" form for
 * the community feed card, e.g.
 *
 *   "2nd floor zenlex bldg, MK Lina St, brgy. 1, Lipa City, Batangas"
 *     → "Brgy. 1, Lipa City, Batangas"
 *
 * The feed card shows this short form (per the mockup); tapping it opens the
 * Map tab, which keeps showing the post's FULL location_name. Purely
 * cosmetic — the stored address is never modified.
 */
export function shortLocation(
  address: string | null | undefined
): string | null {
  if (!address) return null;
  const trimmed = address.trim();
  if (!trimmed) return null;

  // Preferred: cut everything before the barangay segment ("brgy." / "Barangay").
  const brgyIndex = trimmed.search(/\b(brgy|barangay)\b/i);

  let short: string;
  if (brgyIndex >= 0) {
    short = trimmed.slice(brgyIndex);
  } else {
    // No barangay in the address — fall back to the last three segments,
    // which are typically neighborhood/city/province for PH addresses.
    const segments = trimmed
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean);
    short = segments.slice(-3).join(", ") || trimmed;
  }

  // Match the mockup's capitalized start ("Brgy. 1, ...").
  return short.charAt(0).toUpperCase() + short.slice(1);
}
