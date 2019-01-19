const VoteListing = artifacts.require('VoteListing');
const AnonymousVoting = artifacts.require('AnonymousVoting');
const SampleVotes = require('./sample_votes');
const addToIPFS = require('./ipfs');

const now = () => Math.ceil((new Date()).getTime() / 1000);

module.exports = function (deployer, network) {
    deployer.then(async () => {
        for (let voteIdx = 0; voteIdx < SampleVotes.length; voteIdx++) {
            const vote = SampleVotes[voteIdx];
            const listing = await VoteListing.deployed();

            if (vote.phase > 0) {
                console.log(`Retrieving Anonymous Voting contract ${voteIdx}...`);
                const contract = await listing.votingContracts.call(voteIdx).then(addr => AnonymousVoting.at(addr));

                console.log('Getting registration deadline...');
                const regDeadline = await contract.registrationDeadline.call();
                const delay = regDeadline - now() + 2;
                if(delay > 0) {
                    console.log(`Waiting ${delay} seconds for the Voting phase to begin...`);
                    await new Promise(resolve => setTimeout(resolve, delay * 1000));
                }

                console.log('Voting...');
                for (let voterIdx = 0; voterIdx < vote.voters.length; voterIdx++) {
                    const voter = vote.voters[voterIdx];

                    console.log(`Adding vote of voter ${voterIdx} to IPFS...`);
                    const voteHash = await addToIPFS({
                        signed_address: voter.derivations.signed_address,
                        candidateIdx: voter.candidateIdx
                    });

                    console.log(`Voting for voter ${voterIdx}...`);
                    await contract.vote(voteHash, {from: voter.anonymous});
                }
            }
        }
    });
};