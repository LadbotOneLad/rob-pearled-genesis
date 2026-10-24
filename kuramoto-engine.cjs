const crypto = require("crypto");
const fs = require("fs");

// Pure Internal Kuramoto Phase-Sync State Definition
const CONFIG = {
    contract: process.env.CONTRACT_ADDRESS || "0x84CA4aFC3F395ebc0b519680B546Cd604C9c2018",
    nodeCount: 1216,
    couplingStrength: 1.6180339887, // Golden Ratio Coupling Constant K
    naturalFrequencyBase: 0.05,
    tickIntervalMs: 1000
};

// Internal Oscillator State Matrix (1,216 Isolated Nodes)
class KuramotoMatrix {
    constructor(size, K) {
        this.size = size;
        this.K = K; // Internal coupling strength
        this.nodes = [];
        this.init();
    }

    init() {
        console.log(`[*] Initializing ${this.size} internal phase-locked nodes...`);
        for (let i = 0; i < this.size; i++) {
            // Generate internal deterministic seed per node index
            const nodeHash = crypto.createHash("sha256").update(`${CONFIG.contract}:${i}`).digest("hex");
            const naturalFreq = (parseInt(nodeHash.slice(0, 4), 16) / 65535) * 0.1 - 0.05;
            
            this.nodes.push({
                id: i,
                hash: nodeHash.slice(0, 10),
                theta: (parseInt(nodeHash.slice(4, 8), 16) / 65535) * 2 * Math.PI, // Initial phase [0, 2pi]
                omega: naturalFreq // Natural frequency
            });
        }
    }

    // Calculate global order parameter r = |(1/N) * sum(exp(i * theta_j))|
    computeOrderParameter() {
        let sumCos = 0;
        let sumSin = 0;
        for (const node of this.nodes) {
            sumCos += Math.cos(node.theta);
            sumSin += Math.sin(node.theta);
        }
        const real = sumCos / this.size;
        const imag = sumSin / this.size;
        const r = Math.sqrt(real * real + imag * imag); // Coherence (0.0 = chaos, 1.0 = total lock)
        const psi = Math.atan2(imag, real);            // Mean phase
        return { r, psi };
    }

    // Step the Kuramoto differential equation: d(theta_i)/dt = omega_i + (K/N) * sum(sin(theta_j - theta_i))
    step() {
        const { r, psi } = this.computeOrderParameter();
        
        for (const node of this.nodes) {
            // Mean-field acceleration: dTheta = omega + K * r * sin(psi - theta)
            const dTheta = node.omega + (this.K * r * Math.sin(psi - node.theta));
            node.theta = (node.theta + dTheta) % (2 * Math.PI);
        }

        return { r, psi };
    }
}

// Instantiate internal state
const matrix = new KuramotoMatrix(CONFIG.nodeCount, CONFIG.couplingStrength);

console.log("========================================");
console.log(" KURAMOTO INNER STATE ENGINE ACTIVE     ");
console.log(" Target Contract: ", CONFIG.contract);
console.log(" Node Density:    ", CONFIG.nodeCount);
console.log(" Coupling K:     ", CONFIG.couplingStrength);
console.log(" Isolation:       PURE INTERNAL (0 EXTERNAL RPC)");
console.log("========================================");

let stepCounter = 0;

setInterval(() => {
    stepCounter++;
    const { r, psi } = matrix.step();
    const coherencePct = (r * 100).toFixed(4);
    
    // Determine internal phase lock state
    const phaseLockStatus = r > 0.85 ? "LOCKED (PURE)" : "SYNCHRONIZING";
    
    // Generate inner merkle state root
    const stateProof = crypto.createHash("sha256")
        .update(`${CONFIG.contract}:${stepCounter}:${r}:${psi}`)
        .digest("hex");

    console.log(
        `[STEP ${stepCounter.toString().padStart(6, "0")}] ` +
        `Order Parameter (r): ${r.toFixed(6)} (${coherencePct}%) | ` +
        `Phase (psi): ${psi.toFixed(4)} rad | ` +
        `Status: ${phaseLockStatus} | ` +
        `Proof: 0x${stateProof.slice(0, 16)}...`
    );
}, CONFIG.tickIntervalMs);