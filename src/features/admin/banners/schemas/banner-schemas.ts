import { z } from "zod";
import { adminError, adminT } from "@/features/admin/i18n/translate";
import { placements } from "../types/banner";

const ictToMs = (local: string) => Date.parse(`${local.length === 16 ? `${local}:00` : local}+07:00`);

export const bannerFormSchema = z
  .object({
    title: z.string().trim().min(2, adminError("validation.minChars")).max(80, adminError("validation.maxChars", { max: 80 })),
    subtitle: z.string().trim().max(120, adminError("validation.maxChars", { max: 120 })),
    ctaLabel: z.string().trim().min(2, adminError("banners.validation.ctaLabel")).max(24, adminError("validation.maxChars", { max: 24 })),
    ctaUrl: z.string().trim().regex(/^(\/[^\s]*|https?:\/\/[^\s.]+\.[^\s]+)$/, adminError("banners.validation.ctaUrl")),
    placement: z.enum(placements),
    displayOrder: z.string().regex(/^[0-9]{1,5}$/, adminError("banners.validation.displayOrder")),
    status: z.enum(["active", "scheduled", "inactive"]),
    startAt: z.string(),
    endAt: z.string(),
  })
  .superRefine((value, context) => {
    const start = value.startAt ? ictToMs(value.startAt) : null;
    const end = value.endAt ? ictToMs(value.endAt) : null;
    if (start !== null && end !== null && end <= start) context.addIssue({ code: "custom", path: ["endAt"], message: adminT("banners.validation.endAfterStart") });
    if (value.status === "scheduled" && (start === null || start <= Date.now())) context.addIssue({ code: "custom", path: ["startAt"], message: adminT("banners.validation.futureStart") });
  });
export type BannerFormValues = z.infer<typeof bannerFormSchema>;
