/**
 * UK postcode pattern. Accepts a full postcode (e.g. G1 1AA, EH10 5JB) OR an
 * outward code on its own (e.g. G42, PA4, M1) — the inward half is optional.
 * Outward-only is sufficient for our area-based matching (backend derives the
 * area from the outward code), and many homeowners type only their area.
 */
export const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?(\s*\d[A-Z]{2})?$/i;
