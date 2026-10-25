export const supportTicketCategories = ["booking", "payment", "bike", "pickup", "app", "other"] as const;
export type SupportTicketCategory = (typeof supportTicketCategories)[number];

export const supportTicketStatuses = ["open", "resolved"] as const;
export type SupportTicketStatus = (typeof supportTicketStatuses)[number];

export type SupportTicketSort = "newest" | "oldest";

export type SupportTicketListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: SupportTicketStatus;
  category?: SupportTicketCategory;
  sort?: SupportTicketSort;
};
export type SupportTicketListMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type SupportTicket = {
  reference: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  message: string;
  adminNote: string | null;
  bookingReference: string | null;
  customer: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type SupportTicketUpdateInput = Partial<{ status: SupportTicketStatus; adminNote: string | null }>;
