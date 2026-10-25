export type LegalSection = { id: string; key: string; paragraphs: number };
export type LegalDoc = { id: "terms" | "privacy" | "rental-policy"; key: "terms" | "privacy" | "rentalPolicy"; sections: LegalSection[] };

export const legalDocs: LegalDoc[] = [
  {
    id: "terms",
    key: "terms",
    sections: [
      { id: "using-ridego", key: "usingRidego", paragraphs: 2 },
      { id: "bookings", key: "bookings", paragraphs: 2 },
      { id: "rider-duties", key: "riderDuties", paragraphs: 2 },
      { id: "damage", key: "damage", paragraphs: 2 },
      { id: "ending", key: "ending", paragraphs: 1 },
    ],
  },
  {
    id: "privacy",
    key: "privacy",
    sections: [
      { id: "what-we-collect", key: "whatWeCollect", paragraphs: 2 },
      { id: "how-we-use-it", key: "howWeUseIt", paragraphs: 2 },
      { id: "sharing", key: "sharing", paragraphs: 1 },
      { id: "your-choices", key: "yourChoices", paragraphs: 1 },
      { id: "retention", key: "retention", paragraphs: 1 },
    ],
  },
  {
    id: "rental-policy",
    key: "rentalPolicy",
    sections: [
      { id: "deposit", key: "deposit", paragraphs: 1 },
      { id: "fuel-distance", key: "fuelDistance", paragraphs: 1 },
      { id: "late-return", key: "lateReturn", paragraphs: 1 },
      { id: "cancellation", key: "cancellation", paragraphs: 2 },
      { id: "documents", key: "documents", paragraphs: 1 },
    ],
  },
];

export function getLegalDoc(id: string) {
  return legalDocs.find((doc) => doc.id === id);
}
