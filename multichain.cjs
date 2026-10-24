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

async function startListener(chain) {
    try {
        const provider = new ethers.JsonRpcProvider(chain.rpc);
        const filter = { address: TARGET_CONTRACT, topics: [TRANSFER_TOPIC] };

        console.log(`[+] Connected: ${chain.name}`);

        provider.on(filter, (log) => {
            const from = ethers.dataSlice(log.topics[1], 12);
            const to = ethers.dataSlice(log.topics[2], 12);
            const tokenId = BigInt(log.topics[3]).toString();
            const isMint = from === "0x0000000000000000000000000000000000000000";

            console.log(
                `[${isMint ? "GENESIS MINT" : "TRANSFER"}] ${chain.name} | Token #${tokenId}\n` +
                `  From: ${from}\n  To:   ${to}\n  Tx:   ${log.transactionHash}\n` +
                `--------------------------------------------------`
            );
        });
    } catch (err) {
        console.error(`[-] Listener error on ${chain.name}:`, err.message);
    }
}

async function run() {
    console.log("========================================");
    console.log(" ROOT AUTHORITY MULTI-CHAIN MONITOR     ");
    console.log(" Target:", TARGET_CONTRACT);
    console.log("========================================");
    for (const chain of CHAINS) {
        await startListener(chain);
    }
}

run();