const AnonymousVoting = artifacts.require('AnonymousVoting');

describe('contract: AnonymousVoting', () => {
    const SUPPRESS_EXPECTED_ERROR = 'SUPPRESS_EXPECTED_ERROR';

    let instance;
    let registrationExpiration;
    let votingExpiration;
    // arbitrary constants
    const paramsHash = 'DUMMY_PARAMS_HASH';
    const phaseDuration = 1000;

    describe('method: constructor', () => {

        describe('case: valid timings', () => {

            beforeEach(async () => {
                const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                registrationExpiration = now + phaseDuration;
                votingExpiration = registrationExpiration + phaseDuration;
                instance = await AnonymousVoting.new(registrationExpiration, votingExpiration, paramsHash);
            });

            it('should set the registrationExpiration time to the specified value', async () => {
                const time = await instance.registrationExpiration.call();
                assert.equal(time.toNumber(), registrationExpiration);
            });

            it('should set the votingExpiration time to the specified value', async () => {
                const time = await instance.votingExpiration.call();
                assert.equal(time.toNumber(), votingExpiration);
            });

            it('should set currentPhase to 0 (Phase.Registration)', async () => {
               const phase = await instance.currentPhase.call();
               assert.equal(phase.toNumber(), 0);
            });

            it('should set parametersHash to the specified value', async () => {
                const hash = await instance.parametersHash.call();
                assert.equal(hash, paramsHash);
            });
        });

        describe('case: registration already expired', () => {
            beforeEach(() => {
                const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                registrationExpiration = now - phaseDuration;
                votingExpiration = now + 2 * phaseDuration;
            });

            it('should throw an error during deployment', done => {
                AnonymousVoting.new(registrationExpiration, votingExpiration, paramsHash)
                    .catch(() => SUPPRESS_EXPECTED_ERROR)
                    .then(val => val === SUPPRESS_EXPECTED_ERROR ? null :
                        Error('Successfully deployed AnonymousVoting contract with expired Registration phase')
                    )
                    .then(done);
            });
        });

        describe('case: Voting phase expires before Registration phase', () => {
            beforeEach(() => {
                const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                registrationExpiration = now + 2 * phaseDuration;
                votingExpiration = registrationExpiration - phaseDuration;
            });

            it('should throw an error during deployment', done => {
                AnonymousVoting.new(registrationExpiration, votingExpiration, paramsHash)
                    .catch(() => SUPPRESS_EXPECTED_ERROR)
                    .then(val => val === SUPPRESS_EXPECTED_ERROR ? null :
                        Error('Successfully deployed AnonymousVoting contract with Voting ending before Registration')
                    )
                    .then(done);
            });
        });
    });
});