import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
  parseEther,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { viem } from "hardhat";
import { abi } from "../artifacts/contracts/MyToken.sol/MyToken.json";
import * as dotenv from "dotenv";
dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const minterPrivateKey = process.env.PRIVATE_KEY || "";

function validateAddress(address: `0x${string}`) {
  if (!address) throw new Error("Address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid address");
}

const loadArgs = (): {
  tokenAddress: `0x${string}`;
  receiverAddress: `0x${string}`;
  amount: string;
} => {
  if (process.argv.length != 5) {
    throw new Error(
      "Usage: npx ts-node scripts/GiveVotingTokens.ts <tokenAddress> <receiverAddress> <amount>"
    );
  }
  const tokenAddress = process.argv.at(2) as `0x${string}`;
  validateAddress(tokenAddress);
  const receiverAddress = process.argv.at(3) as `0x${string}`;
  validateAddress(receiverAddress);
  const amount = process.argv.at(4);
  if (!amount) throw new Error("Amount not provided");
  return { tokenAddress, receiverAddress, amount };
};

async function main() {
  const { tokenAddress, receiverAddress, amount } = loadArgs();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  const account = privateKeyToAccount(`0x${minterPrivateKey}`);
  const minter = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  console.log(`Minter Address ${minter.account.address}`);
  const balance = await publicClient.getBalance({
    address: minter.account.address,
  });
  console.log(
    `Minter Balance ${formatEther(balance)}`,
    minter.chain.nativeCurrency.symbol
  );

  const tokenContract = await viem.getContractAt("MyToken", tokenAddress);
  console.log(`\n Minting ${amount} tokens to ${receiverAddress}`);

  console.log("confirm? (Y/N)");
  const stdin = process.openStdin();
  stdin.addListener("data", async function (d) {
    if (d.toString().trim().toLowerCase() !== "n") {
      const hash = await minter.writeContract({
        address: tokenAddress,
        abi,
        functionName: "mint",
        args: [receiverAddress, parseEther(amount)],
      });
      console.log("Transaction hash:", hash);
      console.log("Waiting for confirmations...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Mint successful", receipt);
    } else {
      console.log("Operation cancelled");
    }
    process.exit();
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
