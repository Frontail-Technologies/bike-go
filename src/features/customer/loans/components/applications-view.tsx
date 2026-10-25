"use client";

import { BankIcon, PlusIcon } from "@phosphor-icons/react";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslations } from "@/i18n/hooks";
import { ApplicationCard } from "./application-card";
import { useLoansQuery } from "../hooks/generated";
import { apiLoanToApplication } from "../lib/loan-mapper";

export function ApplicationsView() {
  const loans = useLoansQuery({ page: 1, pageSize: 100 });
  const applications = (loans.data?.data ?? []).map(apiLoanToApplication);
  const t = useTranslations("profile");

  return (
    <>
      <AppBar leading="back" backFallback="/profile" title={t("applicationsTitle")} />
      <Screen enter="slide" className="flex flex-col gap-4">
        <div className="hidden md:block">
          <Breadcrumbs items={[{ label: t("title"), href: "/profile" }, { label: t("applicationsTitle") }]} />
        </div>
        <DesktopTitle title={t("applicationsTitle")} subtitle={t("applicationsSub")} />

        {applications.length === 0 ? (
          <EmptyState
            icon={<BankIcon size={28} />}
            title={t("applicationsEmptyTitle")}
            description={t("applicationsEmptyText")}
            action={
              <ButtonLink href="/loans/apply" size="lg">
                {t("applyForLoan")}
              </ButtonLink>
            }
          />
        ) : (
          <>
            <ul className="flex flex-col gap-3 md:grid md:grid-cols-2">
              {applications.map((application) => (
                <li key={application.reference}>
                  <ApplicationCard application={application} />
                </li>
              ))}
            </ul>
            <ButtonLink href="/loans/apply" variant="secondary" size="lg" className="md:self-start">
              <PlusIcon size={18} weight="bold" />
              {t("newApplication")}
            </ButtonLink>
          </>
        )}
      </Screen>
    </>
  );
}
