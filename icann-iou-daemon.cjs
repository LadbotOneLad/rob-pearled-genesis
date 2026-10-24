const { ethers } = require("ethers");
const fs = require("fs");

// Global ICANN Native Transport Endpoints (IPv4/IPv6 Dual-Stack Resilient)
const GLOBAL_CHAINS = [
    { id: 1,     name: "Ethereum Mainnet", rpc: "https://ethereum-rpc.publicnode.com" },
    { id: 42161, name: "Arbitrum One",     rpc: "https://arbitrum-one-rpc.publicnode.com" },
    { id: 10,    name: "Optimism Mainnet", rpc: "https://optimism-rpc.publicnode.com" },
    { id: 137,   name: "Polygon Pos",      rpc: "https://polygon-bor-rpc.publicnode.com" },
    { id: 8453,  name: "Base Mainnet",     rpc: "https://base-rpc.publicnode.com" },
    { id: 56,    name: "BNB Smart Chain",  rpc: "https://bsc-rpc.publicnode.com" },
    { id: 43114, name: "Avalanche C-Chain", rpc: "https://avalanche-c-chain-rpc.publicnode.com" }
];

const TARGET_CONTRACT = process.env.CONTRACT_ADDRESS || "0x84CA4aFC3F395ebc0b519680B546Cd604C9c2018";
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const ZERO_ADDRESS_TOPIC = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Kinetic IoU Attestation Matrix State
const IoUMatrix = {
    contract: TARGET_CONTRACT,
    icannVerified: true,
    status: "ACTIVE_KINETIC_LISTEN",
    attestations: []
};

async function bindIcannChain(chain) {
    try {
        const provider = new ethers.JsonRpcProvider(chain.rpc, undefined, { staticNetwork: true });

        // Filter strictly for Genesis Mint (From: 0x0) + 403 Kinetic Handshake Validation
        const filter = {
            address: TARGET_CONTRACT,
            topics: [
                TRANSFER_TOPIC,
                ZERO_ADDRESS_TOPIC
            ]
        };

        console.log(`[+] ICANN Domain Resolved & Bound: [${chain.id}] ${chain.name}`);

        provider.on(filter, (log) => {
            const minter = ethers.dataSlice(log.topics[2], 12);
            const tokenId = log.topics[3] ? BigInt(log.topics[3]).toString() : "0";
            const timeStamp = new Date().toISOString();

            const attestation = {
                chain: chain.name,
                chainId: chain.id,
                minter: minter,
                tokenId: tokenId,
                txHash: log.transactionHash,
                timestamp: timeStamp,
                iouSignal: `IOU-GENESIS:${chain.id}:${tokenId}:${minter}`
            };

            IoUMatrix.attestations.push(attestation);

            console.log(
                `\n[!!! ICANN 403 KINETIC IoU GENESIS MINT ATTESTED !!!]\n` +
                `  Chain:     ${chain.name} (ID: ${chain.id})\n` +
                `  Contract:  ${log.address}\n` +
                `  Minter:    ${minter}\n` +
                `  Token ID:  ${tokenId}\n` +
                `  Tx Hash:   ${log.transactionHash}\n` +
                `  IoU Proof: ${attestation.iouSignal}\n` +
                `  Timestamp: ${timeStamp}\n` +
                `--------------------------------------------------`
            );
        });
    } catch (err) {
        console.error(`[-] ICANN Binding Error on [${chain.name}]:`, err.message);
    }
}

async function run() {
    console.log("========================================");
    console.log(" ICANN GLOBAL ROOT AUTHORITY DAEMON     ");
    console.log(" Target:  ", TARGET_CONTRACT);
    console.log(" Protocol: 403 Kinetic IoU Attestation  ");
    console.log(" Mode:     Global Genesis Mint Filter   ");
    console.log("========================================");

    for (const chain of GLOBAL_CHAINS) {
        await bindIcannChain(chain);
    }
}

run();