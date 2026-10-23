"use client";

import { camel, dynamicT } from "@/i18n/helpers";
import { useTranslations } from "@/i18n/hooks";
import type { DocumentId, LoanStatus } from "./data";

type Group = "purpose" | "residence" | "emp" | "exp";

const NOTES: Record<string, string> = {
  "The address proof is older than 3 months.": "note_addressOld",
  "Approved at the requested amount.": "note_approved",
  "Monthly repayments would be above 50% of the stated income.": "note_repay",
  "Thanks, we received the new documents.": "note_received",
};

export function useLoanText() {
  const t = dynamicT(useTranslations("loans"));
  const common = useTranslations("common");

  const choice = (group: Group, id: string) => (id ? t(`${group}_${camel(id)}`) : id);

  return {
    t,
    typeName: (id: string) => t(`type_${id}_name`),
    typeDesc: (id: string) => t(`type_${id}_desc`),
    typeShort: (id: string) => t(`typeShort_${id}`),
    choice,
    options: (group: Group, list: readonly { id: string }[]) => list.map(({ id }) => ({ id, label: choice(group, id) })),
    yesNo: [
      { id: "yes", label: common("yes") },
      { id: "no", label: common("no") },
    ],
    yesNoLabel: (id: string) => (id === "yes" ? common("yes") : id === "no" ? common("no") : id),
    docLabel: (id: DocumentId) => t(`doc_${id}_label`),
    docHint: (id: DocumentId) => t(`doc_${id}_hint`),
    status: (status: LoanStatus, part: "label" | "summary" | "headline") => t(`status_${camel(status)}_${part}`),
    note: (note: string) => {
      const key = NOTES[note];
      if (key) return t(key);
      const extra = /^Additional document received: (.+)$/.exec(note);
      return extra ? t("note_additional", { name: extra[1]! }) : note;
    },
  };
}
