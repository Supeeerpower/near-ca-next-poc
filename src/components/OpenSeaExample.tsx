"use client"
import { useState } from "react";
// Only for demo purposes!
import { MultichainContract, NearEthAdapter, nearAccountFromWallet } from "near-ca";
import { useMbWallet } from "@mintbase-js/react";
import { Buffer } from 'buffer'; 


async function signatureFromTxHash(txHash: string): Promise<[string, string]> {
  const url: string = 'https://rpc.testnet.near.org';

  const payload = {
    jsonrpc: "2.0",
    id: "dontcare",
    method: "EXPERIMENTAL_tx_status",
    params: {
      tx_hash: txHash,
      sender_account_id: "ethdenver2024.testnet"
    }
  };

  // Make the POST request with the fetch API
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const jsonResponse = await response.json();

  // Extract receipts_outcome
  const receiptsOutcome = jsonResponse.result.receipts_outcome;

  // Map to get SuccessValue
  // eslint-disable-next-line 
  const successValues = receiptsOutcome.map((outcome: any) => outcome.outcome.status.SuccessValue);

  // Select the middle element
  const middleIndex = Math.floor(successValues.length / 2) - 1;
  const middleSuccessValue = successValues[middleIndex];

  // Decode from base64
  const decodedValue = Buffer.from(middleSuccessValue, 'base64').toString('utf-8');

  console.log(decodedValue);
  return JSON.parse(decodedValue);
}

export const OpenSeaExample = () => {
  const [collectionSlug, setCollectionSlug] = useState('');
  const { selector } = useMbWallet();
  // Function to handle the button click
  // Add your logic to buy NFT from the collection here
  const handleBuyNFTClick = async () => {
    const wallet = await selector.wallet();
    const account = await nearAccountFromWallet(wallet);
    console.log('Buying NFT from collection:', collectionSlug);
    // TODO: replace this with MB Wallet connection!
    // process.env.NEAR_ACCOUNT_ID
    // const keyPair = KeyPair.fromString("");
    // const account = await nearAccountFromKeyPair({
    //   keyPair,
    //   accountId: "ethdenver2024.testnet",
    // });
    console.log("Near Account", account.accountId);

    // Near Config
    const near = {
        mpcContract: new MultichainContract(
            account,
            process.env.NEXT_PUBLIC_NEAR_MULTICHAIN_CONTRACT!
        ),
        derivationPath: "ethereum,1",
    };

    // EVM Config
    const evm = {
        providerUrl: process.env.NEXT_PUBLIC_NODE_URL!,
        scanUrl: process.env.NEXT_PUBLIC_SCAN_URL!,
        gasStationUrl: process.env.NEXT_PUBLIC_GAS_STATION_URL!,
    };

    const neareth = await NearEthAdapter.fromConfig({ near, evm });
    console.log("ETH Account Address", neareth.sender)
    const [big_r, big_s] = await signatureFromTxHash("61yJvH435vQBDr5CwEeaDLxvT33HMe5uLqNNHp6KbJ5Y")
    console.log(big_r, big_s);

    const {transaction, payload } = await neareth.createTxPayload({
        receiver: "0xdeADBeeF0000000000000000000000000b00B1e5",
        amount: 0.000001,
        // Optional Set nearGas (default is 200 TGAS - which still sometimes doesn't work!)
    })
    console.log("payload should go to Near MPC Contract", payload);
    const signedEthTx = neareth.reconstructSignature(transaction, big_r, big_s);
    const txHash = await neareth.relayTransaction(signedEthTx);
    console.log(txHash);

    // const payload = await neareth.getSignatureRequstPayload({
    //     receiver: "0xdeADBeeF0000000000000000000000000b00B1e5",
    //     amount: 0.000001,
    //     // Optional Set nearGas (default is 200 TGAS - which still sometimes doesn't work!)
    // })

    // const outcome = await wallet.signAndSendTransaction({
    //   // callbackUrl: "hello", 
    //   ...payload
    // });

    // console.log("Outcome", outcome);
    // console.log("Outcome", JSON.stringify(outcome));
    
  };

  return (
    <div className="mx-6 sm:mx-24 mt-4 mb-4">
          <div className="w-full flex flex-col justify-center items-center">
            <div className="w-full flex flex-col justify-center items-center space-y-8">
              <div className="flex flex-col justify-center items-center space-y-8 text-[40px]">
                Buy NFT From Collection Example
              </div>
              <div className="flex flex-col justify-center items-center space-y-4">
                {/* Text Field for Collection Slug */}
                <input
                  type="text"
                  value={collectionSlug}
                  onChange={(e) => setCollectionSlug(e.target.value)}
                  placeholder="wutangkillabeez-1"
                  className="text-center"
                />
                {/* Button to Buy NFT */}
                <button
                  onClick={handleBuyNFTClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
                >
                  Buy NFT
                </button>
              </div>
            </div>
          </div>
        </div>
  );
};
