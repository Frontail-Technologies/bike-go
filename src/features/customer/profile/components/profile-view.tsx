"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, Spinner } from "@heroui/react";
import {
  FileTextIcon,
  HeartIcon,
  IdentificationCardIcon,
  PencilSimpleIcon,
  PhoneIcon,
  LifebuoyIcon,
  QuestionIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SignOutIcon,
  UploadSimpleIcon,
  WarningIcon,
  BankIcon,
  FilesIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AppBar } from "@/components/shared/app-bar";
import { ListRow, SectionCard } from "@/components/shared/list-row";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { Button, IconButton } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Switch } from "@/components/ui/selection-controls";
import { BlockSkeleton } from "@/components/ui/skeleton";
import { TextInput } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
import { Reveal } from "@/components/motion/reveal";
import { useCustomerAuthMutations, useCustomerSessionQuery } from "@/features/customer/auth/hooks/use-customer-session-query";
import { maskLicence } from "@/features/customer/bookings/hooks/use-booking";
import { LanguageOptions } from "@/components/shared/language-switcher";
import { useTranslations } from "@/i18n/hooks";
import { ApplicationCard } from "@/features/customer/loans/components/application-card";
import { useLoansQuery } from "@/features/customer/loans/hooks/use-loans";
import { apiLoanToApplication } from "@/features/customer/loans/lib/loan-mapper";
import { favoritesStore, initials, profileStore } from "../stores/preferences-store";
import { useCustomerProfileQuery, useUpdateCustomerProfileMutation } from "../hooks/use-profile";
import { useSaveCustomerLicenceMutation } from "../hooks/use-licence";
import { enableBrowserNotifications } from "@/features/customer/notifications/lib/browser-notifications";
import { apiClient } from "@/lib/api/client";
import { compressImage } from "@/lib/image-compression";

type ModalKey = "edit" | "licence" | "logout" | null;

type Say = (key: "errName" | "errPhone" | "errEmail" | "errAddress" | "errLicence") => string;

const detailsSchema = (say: Say) =>
  z.object({
    name: z.string().trim().min(2, say("errName")),
    phone: z.string().regex(/^\+?[\d\s-]{7,20}$/, say("errPhone")),
    email: z.email(say("errEmail")),
    address: z.string().trim().min(3, say("errAddress")),
  });

const licenceSchema = (say: Say) =>
  z.object({
    number: z.string().regex(/^[A-Za-z]{2}\d{2}[\s-]?\d{4}[\s-]?\d{7}$/, say("errLicence")),
  });

function LicencePhotoInput({ label, file, existingUrl, onChange }: { label: string; file: File | null; existingUrl?: string; onChange: (file: File | null) => void }) {
  const preview = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  return (
    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-control border border-dashed border-line bg-canvas p-3 text-center outline-none focus-within:ring-2 focus-within:ring-ink">
      {preview ? <Image src={preview} alt="" width={320} height={160} unoptimized className="h-20 w-full rounded-lg object-cover" /> : existingUrl ? <PrivateLicenceImage src={existingUrl} alt={`${label} currently saved`} /> : <UploadSimpleIcon size={24} className="text-subtle" />}
      <span className="text-sm font-semibold">{existingUrl && !file ? `Replace ${label.toLowerCase()}` : label}</span>
      <span className="max-w-full truncate text-xs text-subtle">{file?.name ?? (existingUrl ? "Saved image — tap to replace" : "JPG, PNG or WebP")}</span>
      <input
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (!picked) { onChange(null); return; }
          void compressImage(picked).then(onChange);
        }}
      />
    </label>
  );
}

function PrivateLicenceImage({ src, alt }: { src: string; alt: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    void apiClient.get<Blob>(new URL(src, apiClient.defaults.baseURL).toString(), { responseType: "blob" })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        if (active) setImageUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) return <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-canvas px-2 text-center text-xs text-subtle">Image unavailable</div>;
  if (!imageUrl) return <div className="aspect-[4/3] animate-pulse rounded-lg bg-canvas" aria-label={`Loading ${alt}`} role="status" />;

  return <Image src={imageUrl} alt={alt} width={320} height={240} unoptimized className="aspect-[4/3] w-full rounded-lg border border-line object-cover" />;
}

export function ProfileView() {
  const router = useRouter();
  const t = useTranslations("profile");
  const localProfile = profileStore.useValue();
  const session = useCustomerSessionQuery();
  const profileQuery = useCustomerProfileQuery();
  const updateProfile = useUpdateCustomerProfileMutation();
  const saveLicence = useSaveCustomerLicenceMutation();
  const auth = useCustomerAuthMutations();
  const remoteProfile = profileQuery.data;
  const profile = {
    name: remoteProfile?.fullName?.trim() || session.data?.user.name?.trim() || remoteProfile?.email || session.data?.user.email || "",
    email: remoteProfile?.email ?? session.data?.user.email ?? "",
    phone: remoteProfile?.phone ?? "",
    address: remoteProfile?.address ?? "",
    licence: remoteProfile?.licence ?? null,
    notifications: localProfile.notifications,
  };
  const loans = useLoansQuery({ page: 1, pageSize: 3 });
  const applications = (loans.data?.data ?? []).map(apiLoanToApplication);
  const savedCount = favoritesStore.useValue().length;
  const [modal, setModal] = useState<ModalKey>(null);
  const [licenceFront, setLicenceFront] = useState<File | null>(null);
  const [licenceBack, setLicenceBack] = useState<File | null>(null);
  const [licencePhotoError, setLicencePhotoError] = useState<string | null>(null);
  const close = () => setModal(null);
  const avatarUrl = remoteProfile?.avatarUrl || session.data?.user.image || null;
  const displayName = remoteProfile?.telegramUsername ? `@${remoteProfile.telegramUsername}` : profile.name;
  const secondaryLine = remoteProfile?.telegramUsername ? profile.name : profile.email;

  const details = useForm({ resolver: zodResolver(detailsSchema(t)), mode: "onBlur", values: { name: profile.name, phone: profile.phone, email: profile.email, address: profile.address } });
  const licence = useForm({ resolver: zodResolver(licenceSchema(t)), mode: "onBlur", values: { number: profile.licence?.number ?? "" } });

  return (
    <>
      <AppBar title={t("title")} actions={<IconButton label={t("logout")} icon={<SignOutIcon size={22} />} onPress={() => setModal("logout")} />} />
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <div className="hidden items-center justify-between md:flex">
          <DesktopTitle title={t("title")} />
          <IconButton label={t("logout")} icon={<SignOutIcon size={22} />} onPress={() => setModal("logout")} className="border border-line" />
        </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-4">
          <Reveal y={8} blur={0}>
            <section aria-label={t("yourDetails")} className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
              <Avatar size="lg" className="size-14 shrink-0">
                {avatarUrl ? <Avatar.Image src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
                <Avatar.Fallback className="bg-ink text-lg font-bold text-white">{profile.name ? initials(profile.name) : "?"}</Avatar.Fallback>
              </Avatar>
              {profileQuery.isPending ? (
                <div className="flex min-w-0 flex-1 flex-col gap-2" role="status" aria-label={t("yourDetails")}>
                  <BlockSkeleton className="h-5 w-2/3" />
                  <BlockSkeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">{displayName || "—"}</p>
                  {secondaryLine ? <p className="truncate text-sm text-subtle">{secondaryLine}</p> : null}
                </div>
              )}
              <Button variant="secondary" size="sm" onPress={() => setModal("edit")} aria-label={t("editDetails")}>
                <PencilSimpleIcon size={20} />
                <span className="hidden sm:inline">{t("edit")}</span>
              </Button>
            </section>
          </Reveal>

          <SectionCard id="licence-title" title={t("drivingLicence")}>
            {profileQuery.isPending ? (
              <BlockSkeleton className="h-24 w-full" />
            ) : profile.licence ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
                    <IdentificationCardIcon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="tabular text-sm font-bold">{maskLicence(profile.licence.number)}</p>
                    <p className="text-xs text-subtle">Driving licence uploaded</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <PrivateLicenceImage key={profile.licence.frontImageUrl} src={profile.licence.frontImageUrl} alt="Driving licence front" />
                  <PrivateLicenceImage key={profile.licence.backImageUrl} src={profile.licence.backImageUrl} alt="Driving licence back" />
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
                <dd className="tabular font-semibold">{profile.phone || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-subtle">{t("address")}</dt>
                <dd className="text-right font-semibold">{profile.address || "—"}</dd>
              </div>
            </dl>
            <div className="mt-2 border-t border-line pt-2">
              <ListRow icon={<HeartIcon size={20} />} label={t("savedBikes")} href="/saved-bikes" trailing={<span className="tabular text-sm text-subtle">{savedCount}</span>} />
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard id="language-title" title={t("language")}>
            <LanguageOptions />
          </SectionCard>

          <SectionCard id="notifications-title" title={t("notifications")}>
            <div className="flex flex-col">
              <Switch isSelected={profile.notifications.reminders} onChange={async (reminders) => {
                const allowed = !reminders || await enableBrowserNotifications();
                profileStore.update((p) => ({ ...p, notifications: { ...p.notifications, reminders: reminders && allowed } }));
              }}>
                {t("reminders")}
              </Switch>
              <Switch isSelected={profile.notifications.updates} onChange={async (updates) => {
                const allowed = !updates || await enableBrowserNotifications();
                profileStore.update((p) => ({ ...p, notifications: { ...p.notifications, updates: updates && allowed } }));
              }}>
                {t("updates")}
              </Switch>
            </div>
          </SectionCard>

          <SectionCard id="loans-title" title={t("loanApplications")}>
            {loans.isPending ? (
              <BlockSkeleton className="h-24 w-full" />
            ) : applications.length > 0 ? (
              <div className="flex flex-col gap-3">
                {applications.map((application) => (
                  <ApplicationCard key={application.reference} application={application} />
                ))}
                <ListRow icon={<FilesIcon size={20} />} label={t("allApplications")} description={t("inTotal", { count: loans.data?.meta.total ?? applications.length })} href="/loans/applications" />
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

        </div>
      </div>

      <ResponsiveDialog
        isOpen={modal === "edit"}
        onOpenChange={(open) => !open && close()}
        title={t("editDetails")}
        footer={
          <>
            <Button variant="secondary" slot="close" fullWidth>{t("cancel")}</Button>
            <Button type="submit" form="details-form" fullWidth isPending={updateProfile.isPending} isDisabled={updateProfile.isPending}>
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {t("save")}
                </>
              )}
            </Button>
          </>
        }
      >
        <form
          id="details-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={details.handleSubmit(async (values) => {
            try {
              await updateProfile.mutateAsync({ input: { fullName: values.name, phone: values.phone, address: values.address } });
              toast.success(t("detailsSaved"));
              close();
            } catch (error) {
              toast.danger(error instanceof Error ? error.message : "Your details could not be saved.");
            }
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
                  isReadOnly={field === "email"}
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
            <Button type="submit" form="licence-form" fullWidth isPending={saveLicence.isPending} isDisabled={saveLicence.isPending}>{t("submit")}</Button>
          </>
        }
      >
        <form
          id="licence-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={licence.handleSubmit(async ({ number }) => {
            if (!profile.licence && (!licenceFront || !licenceBack)) {
              setLicencePhotoError("Add clear photos of both sides of your licence.");
              return;
            }
            setLicencePhotoError(null);
            try {
              await saveLicence.mutateAsync({ number, front: licenceFront ?? undefined, back: licenceBack ?? undefined });
              toast.success("Driving licence saved");
              setLicenceFront(null);
              setLicenceBack(null);
              close();
            } catch (error) {
              toast.danger(error instanceof Error ? error.message : "Your licence could not be saved.");
            }
          })}
        >
          <Controller
            name="number"
            control={licence.control}
            render={({ field, fieldState }) => (
              <TextInput
                label={t("licenceNumber")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            )}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <LicencePhotoInput label="Licence front" file={licenceFront} existingUrl={profile.licence?.frontImageUrl} onChange={setLicenceFront} />
            <LicencePhotoInput label="Licence back" file={licenceBack} existingUrl={profile.licence?.backImageUrl} onChange={setLicenceBack} />
          </div>
          {licencePhotoError ? <p className="text-sm text-danger" role="alert">{licencePhotoError}</p> : null}
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
              isPending={auth.logout.isPending}
              isDisabled={auth.logout.isPending}
              onPress={() => {
                auth.clearSession();
                router.replace("/signin");
                toast.success(t("loggedOut"));
                void auth.logout.mutateAsync().catch((error) => toast.danger(error instanceof Error ? error.message : "Sign out could not be completed."));
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
