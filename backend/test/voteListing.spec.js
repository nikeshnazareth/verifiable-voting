const VoteListing = artifacts.require('VoteListing');
const AnonymousVoting = artifacts.require('AnonymousVoting');

describe('Contract: VoteListing', () => {

    describe('method: deploy', async (accounts) => {

        let instance;
        const voteParamsHash = web3.sha3('DUMMY_PARAMS_HASH');

        beforeEach((async () => {
            instance = await VoteListing.deployed();
        }));

        contract('[redeploy]', () => {
            it('should exist', async () => {
                assert.isDefined(instance.deploy);
            });

            it('should add an address to the votingContracts array', async () => {
                let count = await instance.numberOfVotingContracts.call();
                assert.equal(count, 0);
                await instance.deploy(voteParamsHash);
                count = await instance.numberOfVotingContracts.call();
                assert.equal(count, 1);
            });

            it('should create an AnonymousVoting contract at the saved address', async () => {
                const address = await instance.votingContracts.call(0);
                await AnonymousVoting.at(address);
            });

            it('should initialise the AnonymousVoting contract with the specified hash', async () => {
                const address = await instance.votingContracts.call(0);
                const votingContract = await AnonymousVoting.at(address);
                const hash = await votingContract.parametersHash.call();
                assert.equal(hash, voteParamsHash);
            });
        });

        contract('[redeploy]', () => {
            it('should emit a VoteCreated event with the specified address', async () => {
                const tx = await instance.deploy(voteParamsHash);
                const address = await instance.votingContracts.call(0);
                assert.equal(tx.logs.length, 1);
                const log = tx.logs[0];
                assert.equal(log.event, 'VoteCreated');
                assert.deepEqual(log.args, { contractAddress: address });
            });
        });

    });
});