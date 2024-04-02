import {
  createPublicClient,
  createWalletClient,
  formatEther,
  hexToString,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { viem } from "hardhat";
import {
  abi,
  bytecode,
} from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";

dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const voterPrivateKey = process.env.PRIVATE_KEY || "";

const validateAddress = (address?: `0x${string}`) => {
  if (!address) throw new Error("Address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid address");
};

const loadArgs = (): {
  ballotContractAddress: `0x${string}`;
} => {
  if (process.argv.length != 3) {
    throw new Error(
      "Usage: npx ts-node --files ./scripts/CheckWinningProposal.ts " +
        "<ballotContractAddress>"
    );
  }
  const ballotContractAddress = process.argv.at(2) as `0x${string}`;
  validateAddress(ballotContractAddress);

  return {
    ballotContractAddress: ballotContractAddress,
  };
};

async function main() {
  const { ballotContractAddress } = loadArgs();
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  const account = privateKeyToAccount(`0x${voterPrivateKey}`);
  const voter = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  console.log("voter address:", voter.account.address);
  const balance = await publicClient.getBalance({
    address: voter.account.address,
  });
  console.log(
    "voter balance:",
    formatEther(balance),
    voter.chain.nativeCurrency.symbol
  );

  const winnerName = (await publicClient.readContract({
    address: ballotContractAddress,
    abi,
    functionName: "winningProposal",
  })) as `0x${string}`;
  if (!winnerName) {
    throw new Error("No winner yet");
  }
  console.log(`The winning proposal is ${hexToString(winnerName)}`);
}

main().catch((err) => {
  console.log(err);
  process.exitCode = 1;
});
