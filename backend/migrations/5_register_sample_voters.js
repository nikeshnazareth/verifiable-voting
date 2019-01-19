const VoteListing = artifacts.require('VoteListing');
const AnonymousVoting = artifacts.require('AnonymousVoting');
const SampleVotes = require('./sample_votes');
const addToIPFS = require('./ipfs');

module.exports = function (deployer, network) {
    deployer.then(async () => {
        for (let voteIdx = 0; voteIdx < SampleVotes.length; voteIdx++) {
            const vote = SampleVotes[voteIdx];
            const listing = await VoteListing.deployed();

            if (vote.phase > 0) {
                console.log(`Retrieving Anonymous Voting contract ${voteIdx}...`);
                const contract = await listing.votingContracts.call(voteIdx).then(addr => AnonymousVoting.at(addr));

                console.log('Registering voters...');
                for (let voterIdx = 0; voterIdx < vote.voters.length; voterIdx++) {
                    const voter = vote.voters[voterIdx];

                    console.log(`Adding blinded address of voter ${voterIdx} to IPFS...`);
                    const blindedAddressHash = await addToIPFS({blinded_address: voter.derivations.blinded_address});

                    console.log(`Initiating registration for voter ${voterIdx}...`);
                    await contract.register(blindedAddressHash, {from: voter.public});

                    console.log(`Adding blind signature for voter ${voterIdx} to IPFS...`);
                    const blindSignatureHash = await addToIPFS({blinded_signature: voter.derivations.blinded_signature});

                    console.log(`Completing registration for voter ${voterIdx}...`);
                    await contract.completeRegistration(voter.public, blindSignatureHash, {from: vote.registration_authority.address})
                }
            }
        }
    });
};