"use client"
import { useState } from "react";
// Only for demo purposes!
import { MultichainContract, NearEthAdapter, nearAccountFromWallet } from "near-ca";
import { useMbWallet } from "@mintbase-js/react";
import { signatureFromTxHash } from "./util";

// EVM Config
const evm = {
  providerUrl: process.env.NEXT_PUBLIC_NODE_URL!,
  scanUrl: process.env.NEXT_PUBLIC_SCAN_URL!,
  gasStationUrl: process.env.NEXT_PUBLIC_GAS_STATION_URL!,
};


export const OpenSeaExample = () => {
  const [collectionSlug, setCollectionSlug] = useState('');
  const { selector } = useMbWallet();
  const handleBuyNFTClick = async () => {
    const wallet = await selector.wallet();
    const account = await nearAccountFromWallet(wallet);
    console.log('Buying NFT from collection:', collectionSlug);

    console.log("Near Account", account.accountId);
    
    const adapter = await NearEthAdapter.fromConfig({ 
      evm,
      near: {
        mpcContract: new MultichainContract(
            account,
            process.env.NEXT_PUBLIC_NEAR_MULTICHAIN_CONTRACT!
        ),
        derivationPath: "ethereum,1",
      }});
    
    console.log("ETH Account Address", adapter.sender)

    const {transaction, requestPayload } = await adapter.getSignatureRequestPayload({
        receiver: "0xdeADBeeF0000000000000000000000000b00B1e5",
        amount: 0.000001,
    })


    console.log("payload that should go to Near MPC Contract", requestPayload);
    // TODO - send request Payload to wallet and extract the signature { big_r, big_s }.
    // const outcome = await wallet.signAndSendTransaction({
    //   ...requestPayload
    // });
    // The following line should be replaced by the above "successValue" of outcome.
    const [big_r, big_s] = await signatureFromTxHash("61yJvH435vQBDr5CwEeaDLxvT33HMe5uLqNNHp6KbJ5Y")


    const signedEthTx = adapter.reconstructSignature(transaction, big_r, big_s);
    const txHash = await adapter.relayTransaction(signedEthTx);
    console.log("EVM Transaction Hash", txHash);
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
