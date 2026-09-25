import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAccount, usePublicClient, useSignTypedData, useWriteContract } from "wagmi";

import { createThread, getPaymentRequirements, type PaymentPayload } from "@/http/threads";

const ERC20_ABI = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function randomNonce(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export type CreateThreadStage = "idle" | "approving" | "signing" | "submitting";

/** On-chain first, then the backend — in that order, entirely inside this hook.
 * Checks allowance, sends a real approve() if needed, signs the EIP-712 authorization,
 * and only then calls POST /threads. The component using this never touches any of that
 * — it just reads {stage, mutate, isPending, error}. */
export function useCreateThreadMutation() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [stage, setStage] = useState<CreateThreadStage>("idle");

  const mutation = useMutation({
    mutationFn: async (input: { idea: string; research: string }) => {
      if (!address) throw new Error("Wallet not connected");

      const requirements = await getPaymentRequirements();
      let payment: PaymentPayload | undefined;

      if (requirements.enabled) {
        if (!publicClient) throw new Error("No wallet client available");

        const allowance = await publicClient.readContract({
          address: requirements.assetAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, requirements.relayerAddress as `0x${string}`],
        });

        if (allowance < BigInt(requirements.priceAtomic)) {
          setStage("approving");
          const approveHash = await writeContractAsync({
            address: requirements.assetAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [requirements.relayerAddress as `0x${string}`, BigInt(requirements.priceAtomic)],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        const now = Math.floor(Date.now() / 1000);
        const authorization = {
          from: address,
          to: requirements.payToAddress,
          value: requirements.priceAtomic,
          validAfter: now - 60,
          validBefore: now + 3600,
          nonce: randomNonce(),
        };

        setStage("signing");
        const signature = await signTypedDataAsync({
          domain: {
            name: "B402",
            version: "1",
            chainId: requirements.chainId,
            verifyingContract: requirements.relayerAddress as `0x${string}`,
          },
          types: {
            TransferWithAuthorization: [
              { name: "from", type: "address" },
              { name: "to", type: "address" },
              { name: "value", type: "uint256" },
              { name: "validAfter", type: "uint256" },
              { name: "validBefore", type: "uint256" },
              { name: "nonce", type: "bytes32" },
            ],
          },
          primaryType: "TransferWithAuthorization",
          message: {
            from: authorization.from as `0x${string}`,
            to: authorization.to as `0x${string}`,
            value: BigInt(authorization.value),
            validAfter: BigInt(authorization.validAfter),
            validBefore: BigInt(authorization.validBefore),
            nonce: authorization.nonce,
          },
        });

        payment = { token: requirements.assetAddress, payload: { authorization, signature } };
      }

      setStage("submitting");
      const result = await createThread({ idea: input.idea, research: input.research, authorAddress: address, payment });
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
    onSettled: () => {
      setStage("idle");
    },
  });

  return { ...mutation, stage };
}
