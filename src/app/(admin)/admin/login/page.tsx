"use client";

import Image from "next/image";
import { AdminLoginForm } from "@/features/admin/auth/components/admin-login-form";
import { AdminLanguageSwitcher } from "@/features/admin/i18n/components/admin-language-switcher";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export default function AdminLoginPage() {
  const t = useAdminTranslations();
  return (
    <main data-admin-ui className="relative isolate flex min-h-dvh overflow-hidden bg-[#07131c] text-white md:flex-row-reverse">
      <div className="absolute inset-0 md:relative md:min-h-dvh md:flex-1">
        <Image
          src="/hero/welcome.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-[62%_top]"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-[#07131c] via-[#07131c]/85 to-transparent md:hidden" />
      </div>
      <div className="absolute inset-x-0 top-0 z-10 px-6 pt-7 md:px-12">
        <div className="absolute right-6 top-6 md:right-12"><AdminLanguageSwitcher inverse /></div>
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[#111820]">◈</span>
          RideGo
        </div>
        <p className="mt-1 text-xs text-white/70">{t("shell.portal")}</p>
      </div>
      <section className="relative z-10 mt-auto flex w-full flex-col justify-center px-6 pb-10 pt-28 md:mt-0 md:w-[520px] md:shrink-0 md:bg-[#fbfaf7] md:px-12 md:pb-12 md:text-[#111820]">
        <div className="mb-6 md:hidden">
          <h1 className="text-4xl font-extrabold tracking-tight">{t("auth.welcome")}</h1>
          <p className="mt-2 text-white/80">{t("auth.welcomeDescription")}</p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
