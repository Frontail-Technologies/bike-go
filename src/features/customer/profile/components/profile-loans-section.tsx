"use client";

import { BankIcon, FilesIcon } from "@phosphor-icons/react/ssr";
import { ListRow, SectionCard } from "@/components/shared/list-row";
import { BlockSkeleton } from "@/components/ui/skeleton";
import { ApplicationCard } from "@/features/customer/loans/components/application-card";
import { useLoansQuery } from "@/features/customer/loans/hooks/use-loans";
import { apiLoanToApplication } from "@/features/customer/loans/lib/loan-mapper";
import { useTranslations } from "@/i18n/hooks";

export function ProfileLoansSection() {
  const t = useTranslations("profile");
  const loans = useLoansQuery({ page: 1, pageSize: 3 });
  const applications = (loans.data?.data ?? []).map(apiLoanToApplication);

  return (
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
  );
}
