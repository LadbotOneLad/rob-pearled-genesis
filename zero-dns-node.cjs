const crypto = require("crypto");

const CONFIG = {
    domain: process.env.DOMAIN_TARGET || "yourgenesisdomain.crypto",
    tokenId: process.env.TOKEN_ID || "0x44255354fb13b517d51a18c9305ff13d32c247889a0cf03c5f9aa5ad822c157c",
    contract: process.env.CONTRACT_ADDRESS || "0x84CA4aFC3F395ebc0b519680B546Cd604C9c2018",
    nodeCount: 1216,
    couplingStrength: 1.6180339887,
    tickIntervalMs: 1000
};

class KuramotoMatrix {
    constructor(size, K) {
        this.size = size;
        this.K = K;
        this.nodes = [];
        this.init();
    }

    init() {
        console.log(`[*] Initializing ${this.size} internal phase-locked nodes...`);
        for (let i = 0; i < this.size; i++) {
            const nodeHash = crypto.createHash("sha256")
                .update(`${CONFIG.domain}:${CONFIG.tokenId}:${CONFIG.contract}:${i}`)
                .digest("hex");
            
            const naturalFreq = (parseInt(nodeHash.slice(0, 4), 16) / 65535) * 0.1 - 0.05;
            
            this.nodes.push({
                id: i,
                hash: nodeHash.slice(0, 10),
                theta: (parseInt(nodeHash.slice(4, 8), 16) / 65535) * 2 * Math.PI,
                omega: naturalFreq
            });
        }
    }

    computeOrderParameter() {
        let sumCos = 0;
        let sumSin = 0;
        for (const node of this.nodes) {
            sumCos += Math.cos(node.theta);
            sumSin += Math.sin(node.theta);
        }
        const real = sumCos / this.size;
        const imag = sumSin / this.size;
        const r = Math.sqrt(real * real + imag * imag);
        const psi = Math.atan2(imag, real);
        return { r, psi };
    }

    step() {
        const { r, psi } = this.computeOrderParameter();
        for (const node of this.nodes) {
            const dTheta = node.omega + (this.K * r * Math.sin(psi - node.theta));
            node.theta = (node.theta + dTheta) % (2 * Math.PI);
        }
        return { r, psi };
    }
}

const matrix = new KuramotoMatrix(CONFIG.nodeCount, CONFIG.couplingStrength);

console.log("========================================");
console.log(" ROOT AUTHORITY ISOLATED ENGINE ACTIVE  ");
console.log(" Domain:   ", CONFIG.domain);
console.log(" Token ID: ", CONFIG.tokenId);
console.log(" Contract: ", CONFIG.contract);
console.log(" Nodes:    ", CONFIG.nodeCount);
console.log(" Mode:     PURE INTERNAL ISOLATION     ");
console.log("========================================");

let stepCounter = 0;

setInterval(() => {
    stepCounter++;
    const { r, psi } = matrix.step();
    const coherencePct = (r * 100).toFixed(4);
    const phaseLockStatus = r > 0.85 ? "LOCKED (PURE)" : "SYNCHRONIZING";
    
    const stateProof = crypto.createHash("sha256")
        .update(`${CONFIG.tokenId}:${stepCounter}:${r}:${psi}`)
        .digest("hex");

    console.log(
        `[STEP ${stepCounter.toString().padStart(6, "0")}] ` +
        `r: ${r.toFixed(6)} (${coherencePct}%) | ` +
        `psi: ${psi.toFixed(4)} rad | ` +
        `Status: ${phaseLockStatus} | ` +
        `Proof: 0x${stateProof.slice(0, 16)}...`
    );
}, CONFIG.tickIntervalMs);