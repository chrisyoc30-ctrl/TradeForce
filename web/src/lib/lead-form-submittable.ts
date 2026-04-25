/** Pure rule for when the homeowner lead form may be submitted (mirrors LeadCapture). */
export function isLeadFormSubmittable(f: {
  name: string;
  phone: string;
  projectType: string;
  description: string;
}): boolean {
  return Boolean(
    f.name.trim() &&
      f.phone.trim() &&
      f.projectType.trim() &&
      f.description.trim(),
  );
}
