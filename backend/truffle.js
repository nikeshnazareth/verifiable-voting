const HDWalletProvider = require("truffle-hdwallet-provider");
const Secrets = require("./secrets");

module.exports = {
    networks: {
        ropsten: {
            provider: function() {
                return new HDWalletProvider(Secrets.wallet_mnemonic, `https://ropsten.infura.io/${Secrets.infura_access_token}`)
            },
            network_id: 3,
            gas: 4000000
        },
        ganache: {
            host: "127.0.0.1",
            network_id: 5777,
            port: 7545,
            gas: 3000000
        }
    }
};