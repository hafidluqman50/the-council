import { ethers } from 'ethers';

const USDT_TESTNET = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';
const RELAYER_ADDRESS = '0xd67eF16fa445101Ef1e1c6A9FB9F3014f1d60DE6';
const FACILITATOR_URL = 'http://localhost:3402';
const CHAIN_ID = 97;

async function main() {
  console.log('B402 Facilitator - BSC Testnet endpoint check');
  console.log('='.repeat(80));

  const payerWallet = ethers.Wallet.createRandom();
  const merchantAddress = ethers.Wallet.createRandom().address;

  console.log(`Payer wallet:    ${payerWallet.address} (fresh throwaway, zero balance)`);
  console.log(`Merchant:        ${merchantAddress}`);
  console.log(`Relayer contract:${RELAYER_ADDRESS}`);

  const now = Math.floor(Date.now() / 1000);
  const paymentAmount = ethers.parseUnits('1', 18);

  const authorization = {
    from: payerWallet.address,
    to: merchantAddress,
    value: paymentAmount.toString(),
    validAfter: now - 60,
    validBefore: now + 3600,
    nonce: ethers.hexlify(ethers.randomBytes(32)),
  };

  console.log(`Amount:          ${ethers.formatUnits(authorization.value, 18)} USDT`);

  const domain = {
    name: 'B402',
    version: '1',
    chainId: CHAIN_ID,
    verifyingContract: RELAYER_ADDRESS,
  };

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };

  const signature = await payerWallet.signTypedData(domain, types, authorization);

  const verifyPayload = {
    paymentPayload: {
      token: USDT_TESTNET,
      payload: { authorization, signature },
    },
    paymentRequirements: {
      relayerContract: RELAYER_ADDRESS,
      network: 'bsc-testnet',
    },
  };

  console.log('\n--- TEST 1: POST /verify (well-formed, valid signature) ---');
  const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyPayload),
  });
  console.log('HTTP status:', verifyRes.status);
  const verifyResult = await verifyRes.json();
  console.log('Response:', JSON.stringify(verifyResult, null, 2));

  console.log('\n--- TEST 2: POST /verify (tampered signature) ---');
  const invalidPayload = {
    ...verifyPayload,
    paymentPayload: {
      ...verifyPayload.paymentPayload,
      payload: {
        ...verifyPayload.paymentPayload.payload,
        signature: '0x' + '0'.repeat(130),
      },
    },
  };
  const invalidRes = await fetch(`${FACILITATOR_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidPayload),
  });
  console.log('HTTP status:', invalidRes.status);
  console.log('Response:', JSON.stringify(await invalidRes.json(), null, 2));

  console.log('\n--- TEST 3: POST /verify (malformed body) ---');
  const malformedRes = await fetch(`${FACILITATOR_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foo: 'bar' }),
  });
  console.log('HTTP status:', malformedRes.status);
  console.log('Response:', JSON.stringify(await malformedRes.json(), null, 2));

  console.log('\n--- TEST 4: POST /settle (zero-balance payer, zero-gas relayer) ---');
  const settleRes = await fetch(`${FACILITATOR_URL}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyPayload),
  });
  console.log('HTTP status:', settleRes.status);
  console.log('Response:', JSON.stringify(await settleRes.json(), null, 2));

  console.log('\nDone.');
}

main().catch((error) => {
  console.error('Test script crashed:', error);
  process.exit(1);
});
