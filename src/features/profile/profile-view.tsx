"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileTextIcon,
  HeartIcon,
  IdentificationCardIcon,
  PencilSimpleIcon,
  PhoneIcon,
  LifebuoyIcon,
  QuestionIcon,
  ReceiptIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  SignOutIcon,
  WarningIcon,
  BankIcon,
  FilesIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AppBar } from "@/components/shared/app-bar";
import { ListRow, SectionCard } from "@/components/shared/list-row";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Switch } from "@/components/ui/selection-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
import { Reveal } from "@/components/motion/reveal";
import { authStore } from "@/features/auth/store";
import { maskLicence } from "@/features/bookings/use-booking";
import { LanguageOptions } from "@/components/shared/language-switcher";
import { useTranslations } from "@/i18n/hooks";
import { intlLocale } from "@/i18n/hooks";
import { ApplicationCard } from "@/features/loans/application-card";
import { loansStore } from "@/features/loans/store";
import { favoritesStore, initials, profileStore } from "./store";

type ModalKey = "edit" | "licence" | "logout" | null;

type Say = (key: "errName" | "errPhone" | "errEmail" | "errAddress" | "errLicence") => string;

const detailsSchema = (say: Say) =>
  z.object({
    name: z.string().trim().min(2, say("errName")),
    phone: z.string().regex(/^[6-9]\d{9}$/, say("errPhone")),
    email: z.email(say("errEmail")),
    address: z.string().trim().min(5, say("errAddress")),
  });

const licenceSchema = (say: Say) =>
  z.object({
    number: z.string().regex(/^[A-Za-z]{2}\d{2}[\s-]?\d{4}[\s-]?\d{7}$/, say("errLicence")),
  });

export function ProfileView() {
  const router = useRouter();
  const t = useTranslations("profile");
  const profile = profileStore.useValue();
  const applications = loansStore.useValue();
  const savedCount = favoritesStore.useValue().length;
  const [modal, setModal] = useState<ModalKey>(null);
  const close = () => setModal(null);

  const details = useForm({ resolver: zodResolver(detailsSchema(t)), mode: "onBlur", values: { name: profile.name, phone: profile.phone, email: profile.email, address: profile.address } });
  const licence = useForm({ resolver: zodResolver(licenceSchema(t)), mode: "onBlur", values: { number: profile.licence?.number ?? "" } });

  return (
    <>
      <AppBar title={t("title")} />
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title={t("title")} />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-4">
          <Reveal y={8} blur={0}>
            <section aria-label={t("yourDetails")} className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">{initials(profile.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{profile.name}</p>
                <p className="truncate text-sm text-subtle">{profile.email}</p>
                <div className="mt-1.5">
                  {profile.licence?.verified ? (
                    <StatusBadge tone="success" icon={<SealCheckIcon size={14} weight="fill" />}>{t("verifiedRider")}</StatusBadge>
                  ) : (
                    <StatusBadge tone="brand" icon={<WarningIcon size={14} weight="fill" />}>{t("notVerified")}</StatusBadge>
                  )}
                </div>
              </div>
              <Button variant="secondary" size="sm" onPress={() => setModal("edit")} aria-label={t("editDetails")}>
                <PencilSimpleIcon size={20} />
                <span className="hidden sm:inline">{t("edit")}</span>
              </Button>
            </section>
          </Reveal>

          <SectionCard id="licence-title" title={t("drivingLicence")}>
            {profile.licence ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
                    <IdentificationCardIcon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="tabular text-sm font-bold">{maskLicence(profile.licence.number)}</p>
                    <p className="text-xs text-subtle">{t("validUntil", { date: new Intl.DateTimeFormat(intlLocale(), { month: "short", year: "numeric" }).format(new Date(profile.licence.expiry)) })}</p>
                  </div>
                  {profile.licence.verified ? <StatusBadge tone="success">{t("verified")}</StatusBadge> : <StatusBadge tone="brand">{t("inReview")}</StatusBadge>}
                </div>
                <Button variant="secondary" fullWidth onPress={() => setModal("licence")}>
                  {t("updateLicence")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-subtle">{t("addLicenceHint")}</p>
                <Button fullWidth onPress={() => setModal("licence")}>
                  {t("addLicence")}
                </Button>
              </div>
            )}
          </SectionCard>

          <SectionCard id="saved-title" title={t("savedDetails")}>
            <dl className="flex flex-col gap-3 py-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-subtle">{t("phone")}</dt>
                <dd className="tabular font-semibold">{profile.phone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-subtle">{t("address")}</dt>
                <dd className="text-right font-semibold">{profile.address}</dd>
              </div>
            </dl>
            <div className="mt-2 border-t border-line pt-2">
              <ListRow icon={<HeartIcon size={20} />} label={t("savedBikes")} href="/bikes?saved=1" trailing={<span className="tabular text-sm text-subtle">{savedCount}</span>} />
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard id="language-title" title={t("language")}>
            <LanguageOptions />
          </SectionCard>

          <SectionCard id="notifications-title" title={t("notifications")}>
            <div className="flex flex-col">
              <Switch isSelected={profile.notifications.reminders} onChange={(reminders) => profileStore.update((p) => ({ ...p, notifications: { ...p.notifications, reminders } }))}>
                {t("reminders")}
              </Switch>
              <Switch isSelected={profile.notifications.updates} onChange={(updates) => profileStore.update((p) => ({ ...p, notifications: { ...p.notifications, updates } }))}>
                {t("updates")}
              </Switch>
              <Switch isSelected={profile.notifications.offers} onChange={(offers) => profileStore.update((p) => ({ ...p, notifications: { ...p.notifications, offers } }))}>
                {t("offers")}
              </Switch>
            </div>
          </SectionCard>

          <SectionCard id="loans-title" title={t("loanApplications")}>
            {applications.length > 0 ? (
              <div className="flex flex-col gap-3">
                {applications.slice(0, 3).map((application) => (
                  <ApplicationCard key={application.reference} application={application} />
                ))}
                <ListRow icon={<FilesIcon size={20} />} label={t("allApplications")} description={t("inTotal", { count: applications.length })} href="/loans/applications" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-subtle">{t("noLoans")}</p>
                <ListRow icon={<BankIcon size={20} />} label={t("loansForExpats")} description={t("loansHint")} href="/loans" />
              </div>
            )}
          </SectionCard>

          <SectionCard id="help-title" title={t("helpSupport")}>
            <ListRow icon={<LifebuoyIcon size={20} />} label={t("helpCenter")} description={t("helpHint")} href="/help" />
            <ListRow icon={<QuestionIcon size={20} />} label={t("questions")} description={t("questionsHint")} href="/help/faq" />
            <ListRow icon={<WarningIcon size={20} />} label={t("reportIssue")} href="/help/report" />
            <ListRow icon={<PhoneIcon size={20} />} label={t("callSupport")} href="tel:+911800000000" />
          </SectionCard>

          <SectionCard id="legal-title" title={t("legal")}>
            <ListRow icon={<FileTextIcon size={20} />} label={t("terms")} href="/legal/terms" />
            <ListRow icon={<ShieldCheckIcon size={20} />} label={t("privacy")} href="/legal/privacy" />
            <ListRow icon={<ReceiptIcon size={20} />} label={t("rentalPolicy")} href="/legal/rental-policy" />
          </SectionCard>

          <Button variant="outline" fullWidth size="lg" onPress={() => setModal("logout")}>
            <SignOutIcon size={20} />
            {t("logout")}
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        isOpen={modal === "edit"}
        onOpenChange={(open) => !open && close()}
        title={t("editDetails")}
        footer={
          <>
            <Button variant="secondary" slot="close" fullWidth>{t("cancel")}</Button>
            <Button type="submit" form="details-form" fullWidth>{t("save")}</Button>
          </>
        }
      >
        <form
          id="details-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={details.handleSubmit((values) => {
            profileStore.update((p) => ({ ...p, ...values }));
            toast.success(t("detailsSaved"));
            close();
          })}
        >
          {(["name", "phone", "email", "address"] as const).map((field) => (
            <Controller
              key={field}
              name={field}
              control={details.control}
              render={({ field: f, fieldState }) => (
                <TextInput
                  label={{ name: t("fullName"), phone: t("mobile"), email: t("email"), address: t("addressLabel") }[field]}
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  inputMode={field === "phone" ? "numeric" : field === "email" ? "email" : undefined}
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  isInvalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              )}
            />
          ))}
        </form>
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={modal === "licence"}
        onOpenChange={(open) => !open && close()}
        title={profile.licence ? t("updateLicence") : t("addLicence")}
        footer={
          <>
            <Button variant="secondary" slot="close" fullWidth>{t("cancel")}</Button>
            <Button type="submit" form="licence-form" fullWidth>{t("submit")}</Button>
          </>
        }
      >
        <form
          id="licence-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={licence.handleSubmit(({ number }) => {
            profileStore.update((p) => ({ ...p, licence: { number, expiry: p.licence?.expiry ?? "2041-06-30", verified: false } }));
            toast.success(t("licenceSubmitted"), { description: t("licenceSubmittedDesc") });
            close();
          })}
        >
          <Controller
            name="number"
            control={licence.control}
            render={({ field, fieldState }) => (
              <TextInput
                label={t("licenceNumber")}
                description={t("photoSoon")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            )}
          />
        </form>
      </ResponsiveDialog>

      <ModalDialog
        isOpen={modal === "logout"}
        onOpenChange={(open) => !open && close()}
        title={t("logoutTitle")}
        footer={
          <>
            <Button variant="secondary" slot="close">{t("stay")}</Button>
            <Button
              slot="close"
              onPress={() => {
                authStore.set({ signedIn: false });
                toast.success(t("loggedOut"));
                router.push("/signin");
              }}
            >
              {t("logout")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-subtle">{t("logoutBody")}</p>
      </ModalDialog>
      </Screen>
    </>
  );
}
