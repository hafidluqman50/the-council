import { useQuery } from "@tanstack/react-query";

import { getPaymentRequirements, type PaymentRequirements } from "@/http/threads";

export function usePaymentRequirementsQuery(initialData?: PaymentRequirements) {
  return useQuery({
    queryKey: ["payment-requirements"],
    queryFn: getPaymentRequirements,
    staleTime: 60_000,
    initialData,
  });
}
