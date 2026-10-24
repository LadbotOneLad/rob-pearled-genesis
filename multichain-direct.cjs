const { ethers } = require("ethers");

// Multi-chain direct endpoints and fallback IPs bypassing standard ICANN/ISP DNS lookup
const CHAINS = [
    { name: "Ethereum Mainnet (Cloudflare DoH Direct)", rpc: "https://1.1.1.1/dns-query" },
    { name: "Ethereum Mainnet (PublicNode Direct)",     rpc: "https://ethereum-rpc.publicnode.com" },
    { name: "Arbitrum One Direct",                      rpc: "https://arbitrum-one-rpc.publicnode.com" },
    { name: "Optimism Direct",                          rpc: "https://optimism-rpc.publicnode.com" },
    { name: "Polygon Mainnet Direct",                   rpc: "https://polygon-bor-rpc.publicnode.com" },
    { name: "Base Direct",                              rpc: "https://base-rpc.publicnode.com" },
    { name: "BNB Smart Chain Direct",                   rpc: "https://bsc-rpc.publicnode.com" },
    { name: "Avalanche C-Chain Direct",                 rpc: "https://avalanche-c-chain-rpc.publicnode.com" }
];

const TARGET_CONTRACT = process.env.CONTRACT_ADDRESS || "0x84CA4aFC3F395ebc0b519680B546Cd604C9c2018";
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");

async function attachDirectListener(chain) {
    try {
        const provider = new ethers.JsonRpcProvider(chain.rpc, undefined, {
            staticNetwork: true
        });

        const filter = { address: TARGET_CONTRACT, topics: [TRANSFER_TOPIC] };
        console.log(`[+] Direct Link Established: ${chain.name}`);

        provider.on(filter, (log) => {
            const tokenId = log.topics[3] ? BigInt(log.topics[3]).toString() : "0";
            console.log(`[TRIGGER] ${chain.name} | Token #${tokenId}`);
        });
    } catch (err) {
        console.error(`[-] Direct link failed for ${chain.name}:`, err.message);
    }
}

async function run() {
    console.log("========================================");
    console.log(" ROOT AUTHORITY DIRECT TELEMETRY DAEMON ");
    console.log(" Target:", TARGET_CONTRACT);
    console.log("========================================");
    for (const chain of CHAINS) {
        await attachDirectListener(chain);
    }
}

run();