const { ethers } = require("ethers");

const CHAINS = [
    { name: "Ethereum Mainnet", rpc: "https://ethereum-rpc.publicnode.com" },
    { name: "Arbitrum One",     rpc: "https://arbitrum-one-rpc.publicnode.com" },
    { name: "Optimism",         rpc: "https://optimism-rpc.publicnode.com" },
    { name: "Polygon Mainnet",  rpc: "https://polygon-bor-rpc.publicnode.com" },
    { name: "Base",             rpc: "https://base-rpc.publicnode.com" },
    { name: "BNB Smart Chain",  rpc: "https://bsc-rpc.publicnode.com" },
    { name: "Avalanche C-Chain", rpc: "https://avalanche-c-chain-rpc.publicnode.com" }
];

const TARGET_CONTRACT = process.env.CONTRACT_ADDRESS || "0x84CA4aFC3F395ebc0b519680B546Cd604C9c2018";
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";

async function attachGenesisListener(chain) {
    try {
        const provider = new ethers.JsonRpcProvider(chain.rpc);
        
        // Filter strictly for Genesis Mint (From: 0x0)
        const filter = {
            address: TARGET_CONTRACT,
            topics: [
                TRANSFER_TOPIC,
                ZERO_ADDRESS
            ]
        };

        console.log(`[+] ICANN RPC Resolved & Bound: ${chain.name}`);

        provider.on(filter, (log) => {
            const to = ethers.dataSlice(log.topics[2], 12);
            const tokenId = log.topics[3] ? BigInt(log.topics[3]).toString() : "0";

            console.log(
                `\n[!!! GENESIS MINT ATTESTED !!!]\n` +
                `  Chain:    ${chain.name}\n` +
                `  Contract: ${log.address}\n` +
                `  Minter:   ${to}\n` +
                `  Token ID: ${tokenId}\n` +
                `  Tx Hash:  ${log.transactionHash}\n` +
                `--------------------------------------------------`
            );
        });
    } catch (err) {
        console.error(`[-] Genesis link error on ${chain.name}:`, err.message);
    }
}

async function run() {
    console.log("========================================");
    console.log(" ICANN ROOT AUTHORITY: GENESIS MINT     ");
    console.log(" Target:", TARGET_CONTRACT);
    console.log(" Mode: Genesis Transfer Filter (From 0x0)");
    console.log("========================================");
    for (const chain of CHAINS) {
        await attachGenesisListener(chain);
    }
}

run();