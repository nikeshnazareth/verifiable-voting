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
        }
    }
};