import { env } from "@/env";

export const apiUrl = (path: string) => `${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;
