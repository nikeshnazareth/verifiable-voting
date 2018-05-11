const VoteListing = artifacts.require('VoteListing');
const AnonymousVoting = artifacts.require('AnonymousVoting');

describe('Contract: VoteListing', () => {

    describe('method: deploy', async (accounts) => {

        let instance;
        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        const phaseDuration = 1000;
        const registrationExpiration = now + phaseDuration;
        const votingExpiration = registrationExpiration + phaseDuration;
        const voteParamsHash = 'DUMMY_PARAMS_HASH';
        const voteEligibilityContract = '0x1234567890123456789012345678901234567890';

        beforeEach(async () => {
            instance = await VoteListing.deployed();
        });

        contract('[redeploy]', () => {
            it('should exist', async () => {
                assert.isDefined(instance.deploy);
            });

            it('should add an address to the votingContracts array', async () => {
                let count = await instance.numberOfVotingContracts.call();
                assert.equal(count, 0);
                await instance.deploy(
                    registrationExpiration, votingExpiration, voteParamsHash, voteEligibilityContract
                );
                count = await instance.numberOfVotingContracts.call();
                assert.equal(count, 1);
            });

            it('should create an AnonymousVoting contract at the saved address', async () => {
                const address = await instance.votingContracts.call(0);
                await AnonymousVoting.at(address);
            });

            describe('deployed AnonymousVoting contract', () => {
                let address;
                let votingContract;

                beforeEach(async () => {
                    address = await instance.votingContracts.call(0);
                    votingContract = await AnonymousVoting.at(address);
                });

                it('should be initialised with the specified registrationExpiration timestamp', async () => {
                    const time = await votingContract.registrationDeadline.call();
                    assert.equal(time, registrationExpiration);
                });

                it('should be initialised with the specified votingExpiration timestamp', async () => {
                    const time = await votingContract.votingDeadline.call();
                    assert.equal(time, votingExpiration);
                });

                it('should be initialised with the specified hash', async () => {
                    const hash = await votingContract.parametersHash.call();
                    assert.equal(hash, voteParamsHash);
                });

                it('should be initialised with the specified eligibility contract', async () => {
                    const contract = await votingContract.eligibilityContract.call();
                    assert.equal(contract, voteEligibilityContract);
                });
            });


        });

        contract('[redeploy]', () => {
            it('should emit a VoteCreated event with the specified address', async () => {
                const tx = await instance.deploy(
                    registrationExpiration, votingExpiration, voteParamsHash, voteEligibilityContract
                );
                const address = await instance.votingContracts.call(0);
                assert.equal(tx.logs.length, 1);
                const log = tx.logs[0];
                assert.equal(log.event, 'VoteCreated');
                assert.deepEqual(log.args, {contractAddress: address});
            });
        });

    });
});