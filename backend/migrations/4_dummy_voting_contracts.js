const VoteListing = artifacts.require('VoteListing');
const NoRestriction = artifacts.require('NoRestriction');
const AnonymousVoting = artifacts.require('AnonymousVoting');
const SampleVotes = require('./sample_votes');

const sec = 1000;
const day = sec * 60 * 60 * 24;
const now = (new Date()).getTime();

module.exports = async function (deployer, network) {
    if (['develop', 'ganache'].includes(network)) {
        const eligibilityContract = (await NoRestriction.deployed()).address;
        const listing = await VoteListing.deployed();

        for (vote of SampleVotes) {
            let registrationDeadline, votingDeadline;
            if (vote.phase === 0) {
                registrationDeadline = now + 100 * day;
                votingDeadline = registrationDeadline + day;
            } else if (vote.phase === 1) {
                registrationDeadline = now + sec;
                votingDeadline = registrationDeadline + 100 * day;
            } else if (vote.phase === 2) {
                registrationDeadline = now + sec;
                votingDeadline = registrationDeadline + sec;
            }

            // deploy contract
            await listing.deploy(
                registrationDeadline,
                votingDeadline,
                vote.brave_hashes.params,
                eligibilityContract,
                vote.registration_authority.address
            );
            const contract = await listing.votingContracts.call(0).then(addr => AnonymousVoting.at(addr));

            // register voters
            for (voter of vote.voters) {
                await contract.register(voter.brave_hashes.blindedAddress, {from: voter.public_address});
                await contract.completeRegistration(
                    voter.public_address,
                    voter.brave_hashes.blindSignature,
                    {from: vote.registration_authority.address}
                );
            }


            // vote
            if (vote.phase > 0) {
                // wait for the voting phase to begin
                await new Promise(resolve => setTimeout(resolve, registrationDeadline - now));

                for (voter of vote.voters) {
                    await contract.vote(voter.brave_hashes.vote, {from: voter.anonymous_address});
                }
            }
        }
    }
};