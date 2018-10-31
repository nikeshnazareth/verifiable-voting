const VoteListing = artifacts.require('VoteListing');
const NoRestriction = artifacts.require('NoRestriction');
const AnonymousVoting = artifacts.require('AnonymousVoting');
const SampleVotes = require('./sample_votes');
const addToIPFS = require('./ipfs');

const sec = 1000;
const day = sec * 60 * 60 * 24;
const now = () => (new Date()).getTime();

module.exports = async function (deployer, network) {

    const useLocalStorage = ['develop', 'ganache'].includes(network);

    const eligibilityContract = (await NoRestriction.deployed()).address;
    const listing = await VoteListing.deployed();

    SampleVotes.forEach(async (vote, idx) => {
        let registrationDeadline, votingDeadline;
        if (vote.phase === 0) {
            registrationDeadline = now() + 100 * day;
            votingDeadline = registrationDeadline + day;
        } else if (vote.phase === 1) {
            registrationDeadline = now() + sec;
            votingDeadline = registrationDeadline + 100 * day;
        } else if (vote.phase === 2) {
            registrationDeadline = now() + sec;
            votingDeadline = registrationDeadline + sec;
        }

        const paramsHash = useLocalStorage ?
            vote.brave_hashes.params :
            await addToIPFS({
                topic: vote.topic,
                candidates: vote.candidates,
                registration_key: {
                    modulus: vote.registration_authority.key.modulus,
                    public_exp: vote.registration_authority.key.e
                }
            });

        // deploy contract
        await listing.deploy(
            registrationDeadline,
            votingDeadline,
            paramsHash,
            eligibilityContract,
            vote.registration_authority.address
        );
        const contract = await listing.votingContracts.call(idx).then(addr => AnonymousVoting.at(addr));

        // register voters
        vote.voters.forEach(async (voter) => {
            const blindAddrHash = useLocalStorage ?
                voter.brave_hashes.blindedAddress :
                await addToIPFS({blinded_address: voter.derivations.blindedAddress});
            await contract.register(blindAddrHash, {from: voter.public_address});

            const blindSig = useLocalStorage ?
                voter.brave_hashes.blindSignature :
                await addToIPFS({blinded_signature: voter.derivations.blindSignature});

            await contract.completeRegistration(
                voter.public_address,
                blindSig,
                {from: vote.registration_authority.address}
            );
        });
    });
};