export type FaqItem = { id: string; question: string; answer: string };
export type FaqGroup = { id: string; title: string; items: FaqItem[] };

export const faqGroups: FaqGroup[] = [
  {
    id: "booking",
    title: "Booking",
    items: [
      {
        id: "how-to-book",
        question: "How do I book a bike?",
        answer:
          "Pick a bike, choose your pickup and drop dates, then follow the five short steps: dates, rider details, licence, review and payment. You will get a booking reference straight away.",
      },
      {
        id: "change-dates",
        question: "Can I change my dates after booking?",
        answer:
          "Yes, if the bike is free for the new dates. Open the booking, tap Chat with support and tell us the new dates. Changes made more than 24 hours before pickup are free.",
      },
      {
        id: "cancel",
        question: "How do I cancel, and will I get a refund?",
        answer:
          "Open My bookings, choose the booking and tap Cancel booking. Cancelling up to 24 hours before pickup is free and the full amount, including the deposit, returns to your original payment method within 5 to 7 working days.",
      },
      {
        id: "extend",
        question: "Can I extend a rental while riding?",
        answer:
          "Yes. Go to My bookings, open the Active tab and tap Extend rental. We confirm within 15 minutes, depending on whether the next rider has the bike.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments and deposit",
    items: [
      {
        id: "what-i-pay",
        question: "What am I charged at booking?",
        answer:
          "The rental, any add-ons, 18% taxes and a small platform fee, plus a refundable security deposit. The review step shows every line before you pay.",
      },
      {
        id: "deposit",
        question: "When do I get my security deposit back?",
        answer:
          "Within 48 hours of returning the bike, as long as there is no new damage, fine or fuel shortfall. We email you when the refund is on its way.",
      },
      {
        id: "methods",
        question: "Which payment methods can I use?",
        answer: "ABA KHQR only. Scan the KHQR code with ABA Mobile or any Bakong-enabled banking app.",
      },
    ],
  },
  {
    id: "pickup",
    title: "Pickup and return",
    items: [
      {
        id: "documents",
        question: "What should I bring to pickup?",
        answer:
          "Your original driving licence (a photo is not accepted) and the phone you booked with. Arrive about 15 minutes early so we can do the handover check together.",
      },
      {
        id: "late",
        question: "What if I return the bike late?",
        answer:
          "A late return is charged at $2 per hour. If you think you will be late, message us from the booking and we will tell you the options before the deadline.",
      },
      {
        id: "other-city",
        question: "Can I return the bike in a different city?",
        answer: "Not yet. Bikes are returned to the hub you picked them up from.",
      },
    ],
  },
  {
    id: "riding",
    title: "Riding and safety",
    items: [
      {
        id: "helmet",
        question: "Is a helmet included?",
        answer:
          "A helmet is an optional add-on at $2 per day, and it is free on rentals of three days or more. Riding gear such as a jacket is also available.",
      },
      {
        id: "breakdown",
        question: "What if the bike breaks down?",
        answer:
          "Stay safe, then call support from the booking. Our team arranges a repair or a replacement bike, and you are not charged for issues that are not your fault.",
      },
      {
        id: "km-limit",
        question: "Is there a distance limit?",
        answer: "100 km per day is included. Extra kilometres cost $0.10 each, charged when you return the bike.",
      },
    ],
  },
];

/** The handful shown on the Help home screen. */
export const popularFaqIds = ["how-to-book", "cancel", "deposit", "documents"];
