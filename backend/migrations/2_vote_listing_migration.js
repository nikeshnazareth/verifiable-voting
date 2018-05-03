let VoteListing = artifacts.require('VoteListing');

module.exports = function(deployer) {
    deployer.deploy(VoteListing);
};
