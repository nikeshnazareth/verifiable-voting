const VoteListing = artifacts.require('VoteListing');
const NoRestriction = artifacts.require('NoRestriction');

const sec = 1000;
const day = sec * 60 * 60 * 24;
const now = (new Date()).getTime();

// These are parameter hashes stored on the simulated IPFS node (using the browser's local storage)
const paramHashes = [
    '137041',
    '612945',
    '222511'
];
const registrationAuth = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

module.exports = async function(deployer, network) {
    if(network === 'develop') {
        const eligibilityContract = (await NoRestriction.deployed()).address;
        const listing = await VoteListing.deployed();
        // the first contract is in the registration phase for a week
        await listing.deploy(now + 7 * day, now + 14 * day, paramHashes[0], eligibilityContract, registrationAuth);
        // the second contract will soon be in the voting phase for week
        await listing.deploy(now + sec, now + 7 * day, paramHashes[1], eligibilityContract, registrationAuth);
        // the second contract will soon be in the complete phase
        await listing.deploy(now + sec, now + 2 * sec, paramHashes[2], eligibilityContract, registrationAuth);
    }
};