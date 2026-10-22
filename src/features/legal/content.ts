export type LegalSection = { id: string; heading: string; paragraphs: string[] };
export type LegalDoc = { id: string; title: string; summary: string; updated: string; sections: LegalSection[] };

/** Sample policy text for the preview. Replace with the company's reviewed legal copy before launch. */
export const legalDocs: LegalDoc[] = [
  {
    id: "terms",
    title: "Terms of service",
    summary: "The rules for using RideGo and renting a bike.",
    updated: "1 October 2026",
    sections: [
      {
        id: "using-ridego",
        heading: "Using RideGo",
        paragraphs: [
          "RideGo lets you book motorcycles and scooters from hubs in the cities we serve. You must be at least 18 years old and hold a driving licence that is valid for the bike you rent.",
          "You are responsible for keeping your account details accurate and for everything done through your account.",
        ],
      },
      {
        id: "bookings",
        heading: "Bookings and payment",
        paragraphs: [
          "A booking is confirmed once payment succeeds and you receive a booking reference. The total shown at the review step includes the rental, add-ons, taxes, the platform fee and the refundable deposit.",
          "Prices can change between bookings, but never for a booking that is already confirmed.",
        ],
      },
      {
        id: "rider-duties",
        heading: "Your responsibilities as a rider",
        paragraphs: [
          "Ride legally and safely, wear a helmet, and do not allow anyone else to ride the bike. Fines, tolls and penalties incurred during your rental are yours to pay.",
          "Do not use the bike for racing, towing, commercial delivery or off-road riding unless the listing says it is suitable.",
        ],
      },
      {
        id: "damage",
        heading: "Damage, theft and accidents",
        paragraphs: [
          "Tell us straight away about any accident, theft or damage. Repair costs for damage caused by you may be deducted from your deposit, up to the cost of repair.",
          "If the bike is lost or stolen because the keys or documents were not kept safe, you may be charged its replacement value.",
        ],
      },
      {
        id: "ending",
        heading: "Ending or suspending access",
        paragraphs: ["We may suspend an account that breaks these terms or puts people at risk. You can stop using RideGo at any time."],
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy policy",
    summary: "What we collect, why, and the choices you have.",
    updated: "1 October 2026",
    sections: [
      {
        id: "what-we-collect",
        heading: "What we collect",
        paragraphs: [
          "Details you give us: your name, phone number, email, address and driving licence information. Details from your use of the app: bookings, saved bikes and device information.",
          "Payment details are handled by our payment partner. We do not store your full card number.",
        ],
      },
      {
        id: "how-we-use-it",
        heading: "How we use it",
        paragraphs: [
          "To confirm and manage your bookings, verify that you can legally ride, process payments and refunds, keep our bikes and riders safe, and give you support.",
          "With your permission we also send offers. You can turn these off in Profile under Notifications.",
        ],
      },
      {
        id: "sharing",
        heading: "Who we share it with",
        paragraphs: [
          "Payment providers, our hub staff for handovers, and authorities when the law requires it. We do not sell your personal information.",
        ],
      },
      {
        id: "your-choices",
        heading: "Your choices",
        paragraphs: [
          "You can see and edit your details in Profile. To ask for a copy of your data or to delete your account, contact support and we will respond within 30 days.",
        ],
      },
      {
        id: "retention",
        heading: "How long we keep it",
        paragraphs: ["Booking and payment records are kept for the period tax and safety rules require. Other data is deleted when you close your account."],
      },
    ],
  },
  {
    id: "rental-policy",
    title: "Rental and cancellation policy",
    summary: "Deposit, fuel, distance, late return and cancellation, in one place.",
    updated: "1 October 2026",
    sections: [
      {
        id: "deposit",
        heading: "Security deposit",
        paragraphs: [
          "A refundable deposit is held when you book and shown separately in your price summary. It is returned within 48 hours of the bike coming back, less any damage, fines or fuel shortfall.",
        ],
      },
      {
        id: "fuel-distance",
        heading: "Fuel and distance",
        paragraphs: [
          "Return the bike with the same fuel level you started with, or we will charge the difference. 100 km per day is included; extra distance is $0.10 per km.",
        ],
      },
      {
        id: "late-return",
        heading: "Late returns",
        paragraphs: [
          "Late returns are charged at $2 per hour. If the bike is more than 6 hours late without contact, we treat it as an extension at the daily rate.",
        ],
      },
      {
        id: "cancellation",
        heading: "Cancellation and refunds",
        paragraphs: [
          "Cancel up to 24 hours before pickup for a full refund, including the deposit. Cancelling within 24 hours of pickup forfeits the first day's rental. A no-show is treated as a cancellation within 24 hours.",
          "Refunds go back to your original payment method within 5 to 7 working days.",
        ],
      },
      {
        id: "documents",
        heading: "Documents at pickup",
        paragraphs: ["Bring your original driving licence. We cannot hand over a bike without it, and the booking will be treated as a late cancellation."],
      },
    ],
  },
];

export function getLegalDoc(id: string) {
  return legalDocs.find((doc) => doc.id === id);
}
