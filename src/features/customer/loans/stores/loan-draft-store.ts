"use client";

import { createPersistedStore } from "@/lib/persisted-store";
import { type LoanDraft } from "../lib/data";

export const loanDraftStore = createPersistedStore<LoanDraft | null>("rgo.loan-draft.v2", null, "session");

export const justAppliedStore = createPersistedStore<string | null>("rgo.just-applied.v1", null, "session");

