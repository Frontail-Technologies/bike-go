"use client";

import { BankIcon, PlusIcon } from "@phosphor-icons/react";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicationCard } from "./application-card";
import { loansStore } from "./store";

export function ApplicationsView() {
  const applications = loansStore.useValue();

  return (
    <>
      <AppBar leading="back" backFallback="/profile" title="My applications" />
      <Screen enter="slide" className="flex flex-col gap-4">
        <div className="hidden md:block">
          <Breadcrumbs items={[{ label: "Profile", href: "/profile" }, { label: "My applications" }]} />
        </div>
        <DesktopTitle title="My applications" subtitle="Expat loan applications and their status" />

        {applications.length === 0 ? (
          <EmptyState
            icon={<BankIcon size={28} />}
            title="No applications yet"
            description="Check your eligibility and apply in a few steps. You can follow every step here."
            action={
              <ButtonLink href="/loans/apply" size="lg">
                Apply for a loan
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
              New application
            </ButtonLink>
          </>
        )}
      </Screen>
    </>
  );
}
