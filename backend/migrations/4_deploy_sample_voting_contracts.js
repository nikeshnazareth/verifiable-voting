const VoteListing = artifacts.require('VoteListing');
const NoRestriction = artifacts.require('NoRestriction');
const SampleVotes = require('./sample_votes');
const addToIPFS = require('./ipfs');

const sec = 1; // Ethereum block time resolution is one second
const minute = 60 * sec;
const day = minute * 60 * 24;
const year = 365 * day;
const now = () => Math.ceil((new Date()).getTime() / 1000);

module.exports = function (deployer, network) {
    deployer.then(async () => {
        // we need to execute all transactions before the phase expires
        // on the public networks the transactions may take several minutes, so the phase must be at least this long
        const phaseDuration = ['develop', 'ganache'].includes(network) ? 5 * sec : 15 * minute;
        // some of the sample votes will be stalled at a particular phase. Set their duration to be a long time
        const aLongTime = 5 * year;

        const eligibilityContract = (await NoRestriction.deployed()).address;
        const listing = await VoteListing.deployed();

        for (let idx = 0; idx < SampleVotes.length; idx++) {
            const vote = SampleVotes[idx];

            let registrationDeadline, votingDeadline;
            if (vote.phase === 0) {
                registrationDeadline = now() + aLongTime;
                votingDeadline = registrationDeadline + day;
            } else if (vote.phase === 1) {
                registrationDeadline = now() + phaseDuration;
                votingDeadline = registrationDeadline + aLongTime;
            } else if (vote.phase === 2) {
                registrationDeadline = now() + phaseDuration;
                votingDeadline = registrationDeadline + phaseDuration;
            }

            console.log(`Adding contract ${idx} parameters to IPFS...`);
            const paramsHash = await addToIPFS({
                topic: vote.topic,
                candidates: vote.candidates,
                registration_key: {
                    modulus: vote.registration_authority.key.modulus,
                    public_exp: vote.registration_authority.key.e
                }
            });

            console.log(`Deploying contract ${idx}...`);
            await listing.deploy(
                registrationDeadline,
                votingDeadline,
                paramsHash,
                eligibilityContract,
                vote.registration_authority.address
            );
            console.log(`Successfully deployed contract ${idx}`);
        }
    });
};