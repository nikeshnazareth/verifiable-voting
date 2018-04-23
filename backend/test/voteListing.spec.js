const VoteListing = artifacts.require('VoteListing');
const AnonymousVoting = artifacts.require('AnonymousVoting');

contract('VoteListing', () => {

    describe('method: deploy', async (accounts) => {

        let instance;
        const voteParamsHash = web3.sha3('DUMMY_PARAMS_HASH');

        beforeEach((async () => {
            instance = await VoteListing.deployed();
        }));

        it('should exist', async () => {
            assert.isDefined(instance.deploy);
        });

        it('should add an address to the votingContracts array', async () => {
            let count = await  instance.numberOfVotingContracts.call();
            assert.equal(count, 0);
            await instance.deploy(voteParamsHash);
            count = await instance.numberOfVotingContracts.call();
            assert.equal(count, 1);
        });

        it('should create an AnonymousVoting contract at the saved address', async () => {
            await instance.deploy(voteParamsHash);
            const address = await instance.votingContracts.call(0);
            await AnonymousVoting.at(address);
        });

        it('should initialise the AnonymousVoting contract with the specified hash', async () => {
            await instance.deploy(voteParamsHash);
            const address = await instance.votingContracts.call(0);
            const votingContract = await AnonymousVoting.at(address);
            const hash = await votingContract.parametersHash.call();
            assert.equal(hash, voteParamsHash);
        });
    });
});