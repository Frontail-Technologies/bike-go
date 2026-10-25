export type CustomerSession = {
  session: {
    id: string;
    userId: string;
    expiresAt: string | Date;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role?: string;
  };
};

export type TelegramLoginPayload = Record<string, string | number> & {
  id: number;
  auth_date: number;
  hash: string;
};
