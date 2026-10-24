import { z } from "zod";
import { placements } from "../types/banner";

const ictToMs = (local: string) => Date.parse(`${local.length === 16 ? `${local}:00` : local}+07:00`);

export const bannerFormSchema = z
  .object({
    title: z.string().trim().min(2, "Enter at least 2 characters.").max(80, "Use at most 80 characters."),
    subtitle: z.string().trim().max(120, "Use at most 120 characters."),
    ctaLabel: z.string().trim().min(2, "CTA label is required.").max(24, "Use at most 24 characters."),
    ctaUrl: z.string().trim().regex(/^(\/[^\s]*|https?:\/\/[^\s.]+\.[^\s]+)$/, "Use an internal path like /bikes or a full http(s):// URL."),
    placement: z.enum(placements),
    displayOrder: z.string().regex(/^[0-9]{1,5}$/, "Enter a whole number, 0 or more."),
    status: z.enum(["active", "scheduled", "inactive"]),
    startAt: z.string(),
    endAt: z.string(),
  })
  .superRefine((value, context) => {
    const start = value.startAt ? ictToMs(value.startAt) : null;
    const end = value.endAt ? ictToMs(value.endAt) : null;
    if (start !== null && end !== null && end <= start) context.addIssue({ code: "custom", path: ["endAt"], message: "End must be after the start." });
    if (value.status === "scheduled" && (start === null || start <= Date.now())) context.addIssue({ code: "custom", path: ["startAt"], message: "A scheduled banner needs a start date in the future." });
  });
export type BannerFormValues = z.infer<typeof bannerFormSchema>;
