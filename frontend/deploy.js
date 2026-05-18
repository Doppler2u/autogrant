import { readFileSync } from "fs";
import path from "path";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// The private key from the .env file with '0x' prefix
const privateKey = "0x98368d919f311eb7dec219254a56e2d6d16b80da711b6beb8a79d051425bb834";
const account = createAccount(privateKey);

const client = createClient({
  chain: studionet,
  account: account,
});

async function main() {
  const filePath = path.resolve(process.cwd(), "../contracts/autogrant.py");
  console.log(`Reading contract from ${filePath}...`);
  const contractCode = new Uint8Array(readFileSync(filePath));

  console.log("Deploying AutoGrant to GenLayer Bradbury Testnet...");

  try {
    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [70],
    });

    console.log("Transaction Hash:", deployTransaction);
    console.log("Waiting for validators to confirm the transaction...");

    // Depending on the version of genlayer-js, the status enum might differ. We use string 'ACCEPTED'
    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction,
      status: "ACCEPTED",
      retries: 200,
    });

    if (receipt.consensus_data?.leader_receipt[0]?.execution_result !== "SUCCESS") {
      console.error("Deployment execution result wasn't SUCCESS.", receipt);
    }

    const contractAddress = receipt.data?.contract_address;
    console.log("\n✅ Contract deployed successfully!");
    console.log("Contract Address:", contractAddress);

  } catch (error) {
    console.error("Error during deployment:", error);
  }
}

main();
