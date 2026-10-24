module.exports = {
  apps: [{
    name: "zero-dns-node",
    script: "zero-dns-node.cjs",
    env: {
      DOMAIN_TARGET: "yourgenesisdomain.crypto",
      TOKEN_ID: "0x44255354fb13b517d51a18c9305ff13d32c247889a0cf03c5f9aa5ad822c157c",
      CONTRACT_ADDRESS: "0x84CA4aFC3F395ebc0b519680B546Cd604C9c2018"
    },
    autorestart: true,
    exp_backoff_restart_delay: 2000
  }]
};