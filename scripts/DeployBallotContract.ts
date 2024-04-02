import {
  abi,
  bytecode,
} from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";

const validateAddress = (address?: `0x${string}`) => {
  if (!address) throw new Error("Contract address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address))
    throw new Error("Invalid contract address");
};

const loadArgs = (): {
  tokenContractAddress: `0x${string}`;
  targetBlockNumber: bigint;
  proposals: string[];
} => {
  if (process.argv.length < 5) {
    throw new Error(
      "Usage: npx ts-node --files ./scripts/DeployBallotContracts.ts " +
        "<tokenContractAddress> <targetBlockNumber> <...proposals>"
    );
  }
  const tokenContractAddress = process.argv.at(2) as `0x${string}`;
  validateAddress(tokenContractAddress);

  if (process.argv.at(3) === undefined)
    throw new Error("Target block number not provided");
  const targetBlockNumber = BigInt(process.argv.at(3) as string);

  const proposals = process.argv.slice(4);
  if (!proposals || proposals.length < 1)
    throw new Error("Proposals not provided");

  return {
    tokenContractAddress: tokenContractAddress,
    targetBlockNumber: targetBlockNumber,
    proposals: proposals,
  };
};

async function main() {
  const { tokenContractAddress, targetBlockNumber, proposals } = loadArgs();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const account = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  console.log(`Deployer Address ${deployer.account.address}`);
  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log(
    `Deployer Balance ${formatEther(balance)}`,
    deployer.chain.nativeCurrency.symbol
  );
  console.log("Deploying Tokenised Ballot Contract", {
    proposals,
    tokenContractAddress,
    targetBlockNumber,
  });
  console.log("Confirm? (y/n)");
  const stdin = process.openStdin();
  stdin.addListener("data", async function (d) {
    if (d.toString().trim().toLowerCase() !== "n") {
      const hash = await deployer.deployContract({
        abi,
        bytecode: bytecode as `0x${string}`,
        args: [
          proposals.map((prop) => toHex(prop, { size: 32 })),
          tokenContractAddress,
          targetBlockNumber,
        ],
      });
      console.log(`Transaction hash: ${hash}`);
      console.log("Waiting for confirmations...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress)
        throw new Error("Contract address not found in receipt");
      console.log(
        `Tokenised Ballot Contract deployed at ${receipt.contractAddress}`
      );
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
