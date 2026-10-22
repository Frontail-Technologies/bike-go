"use client";

import { createPersistedStore } from "@/lib/persisted-store";
import { type LoanApplication, type LoanDraft, type DocumentId, type StoredFile, seedApplications } from "./data";

export const loansStore = createPersistedStore<LoanApplication[]>("rgo.loans.v2", seedApplications);

export const loanDraftStore = createPersistedStore<LoanDraft | null>("rgo.loan-draft.v2", null, "session");

/** Reference of the application just submitted. Lets Back from its status screen skip the finished flow. */
export const justAppliedStore = createPersistedStore<string | null>("rgo.just-applied.v1", null, "session");

export function addApplication(application: LoanApplication) {
  loansStore.update((all) => [application, ...all]);
}

/** Mock of the applicant sending back the documents a reviewer asked for. */
export function provideDocuments(reference: string, files: Partial<Record<DocumentId, StoredFile>>) {
  const now = new Date().toISOString();
  loansStore.update((all) =>
    all.map((a) =>
      a.reference === reference
        ? {
            ...a,
            status: "in-review",
            documents: { ...a.documents, ...files },
            requestedDocuments: [],
            history: [...a.history, { status: "in-review", at: now, note: "Thanks, we received the new documents." }],
          }
        : a,
    ),
  );
}

/** Mock of sending one extra document while the application is open. Recorded on the timeline. */
export function addAdditionalDocument(reference: string, file: StoredFile) {
  const now = new Date().toISOString();
  loansStore.update((all) =>
    all.map((a) =>
      a.reference === reference
        ? { ...a, history: [...a.history, { status: a.status, at: now, note: `Additional document received: ${file.name}` }] }
        : a,
    ),
  );
}
