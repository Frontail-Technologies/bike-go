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
import { favoritesStore, initials, profileStore } from "./store";

type ModalKey = "edit" | "licence" | "logout" | null;

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number."),
  email: z.email("Enter a valid email address."),
  address: z.string().trim().min(5, "Enter your address."),
});

const licenceSchema = z.object({
  number: z.string().regex(/^[A-Za-z]{2}\d{2}[\s-]?\d{4}[\s-]?\d{7}$/, "Use the format RJ14 2021 0012345."),
});

export function ProfileView() {
  const router = useRouter();
  const profile = profileStore.useValue();
  const savedCount = favoritesStore.useValue().length;
  const [modal, setModal] = useState<ModalKey>(null);
  const close = () => setModal(null);

  const details = useForm({ resolver: zodResolver(detailsSchema), mode: "onBlur", values: { name: profile.name, phone: profile.phone, email: profile.email, address: profile.address } });
  const licence = useForm({ resolver: zodResolver(licenceSchema), mode: "onBlur", values: { number: profile.licence?.number ?? "" } });

  return (
    <>
      <AppBar title="Profile" />
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title="Profile" />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-4">
          <Reveal y={8} blur={0}>
            <section aria-label="Your details" className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">{initials(profile.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{profile.name}</p>
                <p className="truncate text-sm text-subtle">{profile.email}</p>
                <div className="mt-1.5">
                  {profile.licence?.verified ? (
                    <StatusBadge tone="success" icon={<SealCheckIcon size={14} weight="fill" />}>Verified rider</StatusBadge>
                  ) : (
                    <StatusBadge tone="brand" icon={<WarningIcon size={14} weight="fill" />}>Not verified</StatusBadge>
                  )}
                </div>
              </div>
              <Button variant="secondary" size="sm" onPress={() => setModal("edit")} aria-label="Edit details">
                <PencilSimpleIcon size={20} />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </section>
          </Reveal>

          <SectionCard id="licence-title" title="Driving licence">
            {profile.licence ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
                    <IdentificationCardIcon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="tabular text-sm font-bold">{maskLicence(profile.licence.number)}</p>
                    <p className="text-xs text-subtle">Valid until {new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(profile.licence.expiry))}</p>
                  </div>
                  {profile.licence.verified ? <StatusBadge tone="success">Verified</StatusBadge> : <StatusBadge tone="brand">In review</StatusBadge>}
                </div>
                <Button variant="secondary" fullWidth onPress={() => setModal("licence")}>
                  Update licence
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-subtle">Add your licence once to speed up every booking.</p>
                <Button fullWidth onPress={() => setModal("licence")}>
                  Add licence
                </Button>
              </div>
            )}
          </SectionCard>

          <SectionCard id="saved-title" title="Saved details">
            <dl className="flex flex-col gap-3 py-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-subtle">Phone</dt>
                <dd className="tabular font-semibold">{profile.phone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-subtle">Address</dt>
                <dd className="text-right font-semibold">{profile.address}</dd>
              </div>
            </dl>
            <div className="mt-2 border-t border-line pt-2">
              <ListRow icon={<HeartIcon size={20} />} label="Saved bikes" href="/bikes?saved=1" trailing={<span className="tabular text-sm text-subtle">{savedCount}</span>} />
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard id="notifications-title" title="Notifications">
            <div className="flex flex-col">
              <Switch isSelected={profile.notifications.reminders} onChange={(reminders) => profileStore.update((p) => ({ ...p, notifications: { ...p.notifications, reminders } }))}>
                Booking reminders
              </Switch>
              <Switch isSelected={profile.notifications.updates} onChange={(updates) => profileStore.update((p) => ({ ...p, notifications: { ...p.notifications, updates } }))}>
                Trip updates
              </Switch>
              <Switch isSelected={profile.notifications.offers} onChange={(offers) => profileStore.update((p) => ({ ...p, notifications: { ...p.notifications, offers } }))}>
                Offers and news
              </Switch>
            </div>
          </SectionCard>

          <SectionCard id="help-title" title="Help and support">
            <ListRow icon={<LifebuoyIcon size={20} />} label="Help center" description="Chat, call or email us" href="/help" />
            <ListRow icon={<QuestionIcon size={20} />} label="Questions" description="Booking, payments, pickup and riding" href="/help/faq" />
            <ListRow icon={<WarningIcon size={20} />} label="Report an issue" href="/help/report" />
            <ListRow icon={<PhoneIcon size={20} />} label="Call support" href="tel:+911800000000" />
          </SectionCard>

          <SectionCard id="legal-title" title="Legal">
            <ListRow icon={<FileTextIcon size={20} />} label="Terms of service" href="/legal/terms" />
            <ListRow icon={<ShieldCheckIcon size={20} />} label="Privacy policy" href="/legal/privacy" />
            <ListRow icon={<ReceiptIcon size={20} />} label="Rental and cancellation policy" href="/legal/rental-policy" />
          </SectionCard>

          <Button variant="outline" fullWidth size="lg" onPress={() => setModal("logout")}>
            <SignOutIcon size={20} />
            Log out
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        isOpen={modal === "edit"}
        onOpenChange={(open) => !open && close()}
        title="Edit details"
        footer={
          <>
            <Button variant="secondary" slot="close" fullWidth>Cancel</Button>
            <Button type="submit" form="details-form" fullWidth>Save</Button>
          </>
        }
      >
        <form
          id="details-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={details.handleSubmit((values) => {
            profileStore.update((p) => ({ ...p, ...values }));
            toast.success("Details saved");
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
                  label={{ name: "Full name", phone: "Mobile number", email: "Email", address: "Address" }[field]}
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
        title={profile.licence ? "Update licence" : "Add licence"}
        footer={
          <>
            <Button variant="secondary" slot="close" fullWidth>Cancel</Button>
            <Button type="submit" form="licence-form" fullWidth>Submit</Button>
          </>
        }
      >
        <form
          id="licence-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={licence.handleSubmit(({ number }) => {
            profileStore.update((p) => ({ ...p, licence: { number, expiry: p.licence?.expiry ?? "2041-06-30", verified: false } }));
            toast.success("Submitted for verification", { description: "Usually done within a day." });
            close();
          })}
        >
          <Controller
            name="number"
            control={licence.control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Licence number"
                description="Photo upload is coming soon."
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
        title="Log out?"
        footer={
          <>
            <Button variant="secondary" slot="close">Stay signed in</Button>
            <Button
              slot="close"
              onPress={() => {
                authStore.set({ signedIn: false });
                toast.success("Logged out");
                router.push("/signin");
              }}
            >
              Log out
            </Button>
          </>
        }
      >
        <p className="text-sm text-subtle">Your bookings stay saved on this device in this preview.</p>
      </ModalDialog>
      </Screen>
    </>
  );
}
