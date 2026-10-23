import { loans } from "@/components/admin/loans/loan-data";
import { allDocumentTypes, type DocumentType } from "@/components/admin/loans/loan-types";

export { allDocumentTypes, type DocumentType };
export const NOW = Date.parse("2026-10-23T03:00:00.000Z");

export type ReviewStatus = "uploaded" | "verified" | "needs-review" | "rejected";
export const reviewStatuses: ReviewStatus[] = ["uploaded", "verified", "needs-review", "rejected"];
export const reviewLabels: Record<ReviewStatus, string> = { uploaded: "Uploaded", verified: "Verified", "needs-review": "Needs review", rejected: "Rejected" };

export type DocumentEvent = { id: string; title: string; detail?: string; at: string };
export type ReviewDocument = {
  id: string; type: DocumentType; fileName: string; format: "image" | "pdf"; status: ReviewStatus; uploadedAt: string; reviewedBy: string | null;
  applicant: { customerId: string; reference: string; name: string; nationality: string }; loanReference: string; loanType: string; history: DocumentEvent[];
};

const reviewers = ["Sophea Admin", "Dara Chhun", "Vireak Sok"];
const pdfTypes = new Set<DocumentType>(["Employment proof", "Salary / income proof", "Bank statement"]);
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plus = (iso: string, hours: number) => new Date(Date.parse(iso) + hours * 3_600_000).toISOString();

export const documents: ReviewDocument[] = loans.flatMap((loan, loanIndex) =>
  loan.documents.flatMap((doc, index) => {
    if (doc.status === "missing" || !doc.uploadedAt) return [];
    const format = pdfTypes.has(doc.type) ? "pdf" : "image";
    const status = doc.status as ReviewStatus;
    const reviewer = status === "uploaded" ? null : reviewers[(loanIndex + index) % reviewers.length];
    const history: DocumentEvent[] = [{ id: "up", title: "Uploaded", detail: "Submitted with the loan application.", at: doc.uploadedAt }];
    if (status === "needs-review") history.push({ id: "nr", title: "Marked needs review", detail: "The file should be checked again.", at: plus(doc.uploadedAt, 5) });
    if (status === "rejected") history.push({ id: "rj", title: "Rejected", detail: "Image is blurred. Please upload a clearer copy.", at: plus(doc.uploadedAt, 6) });
    if (status === "verified") history.push({ id: "vf", title: "Verified", at: plus(doc.uploadedAt, 4) });
    return [{
      id: doc.detailId, type: doc.type, fileName: `${slug(doc.type)}-${slug(loan.applicant.name)}.${format === "pdf" ? "pdf" : "jpg"}`, format, status, uploadedAt: doc.uploadedAt, reviewedBy: reviewer,
      applicant: { customerId: loan.applicant.customerId, reference: loan.applicant.customerReference, name: loan.applicant.name, nationality: loan.applicant.nationality }, loanReference: loan.reference, loanType: loan.loanType, history,
    }];
  }),
);

export const getDocument = (id: string) => documents.find((doc) => doc.id === id);

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", ...options }).format(new Date(iso));
export const fmtDateTime = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtShort = (iso: string) => fmt(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
