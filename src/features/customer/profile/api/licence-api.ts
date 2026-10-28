import { apiClient } from "@/lib/api/client";
import { unwrapData, type ApiEnvelope } from "@/lib/api/contracts";
import type { CustomerLicenceInput, CustomerProfile } from "../types";

export async function saveLicence(input: CustomerLicenceInput): Promise<CustomerProfile> {
  const data = new FormData();
  data.set("number", input.number);
  if (input.front) data.set("front", input.front);
  if (input.back) data.set("back", input.back);

  const response = await apiClient.request<ApiEnvelope<CustomerProfile>>({
    method: "POST",
    url: "/me/licence",
    data,
  });
  return unwrapData(response.data);
}
