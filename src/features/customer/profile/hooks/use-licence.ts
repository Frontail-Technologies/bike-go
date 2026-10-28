"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveLicence } from "../api/licence-api";
import { customerProfileKeys } from "../query-keys";
import type { CustomerLicenceInput } from "../types";

export function useSaveCustomerLicenceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CustomerLicenceInput) => saveLicence(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(customerProfileKeys.getProfile(), profile);
      return queryClient.invalidateQueries({ queryKey: customerProfileKeys.root() });
    },
  });
}
