var AnonymousVoting = artifacts.require('AnonymousVoting');

module.exports = function(deployer) {
    deployer.deploy(AnonymousVoting);
};
