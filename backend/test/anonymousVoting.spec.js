const AnonymousVoting = artifacts.require('AnonymousVoting');
const AnonymousVotingPhases = artifacts.require('TestAnonymousVotingPhases');

describe('contract: AnonymousVoting', () => {
    const SUPPRESS_EXPECTED_ERROR = 'SUPPRESS_EXPECTED_ERROR';

    let instance;
    let registrationExpiration;
    let votingExpiration;
    // arbitrary constants
    const PARAMS_HASH = 'DUMMY_PARAMS_HASH';
    const PHASE_DURATION = 1000;

    describe('method: constructor', () => {

        describe('case: valid timings', () => {

            beforeEach(async () => {
                const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                registrationExpiration = now + PHASE_DURATION;
                votingExpiration = registrationExpiration + PHASE_DURATION;
                instance = await AnonymousVoting.new(registrationExpiration, votingExpiration, PARAMS_HASH);
            });

            it('should set the registrationExpiration time to the specified value', async () => {
                const time = await instance.registrationExpiration.call();
                assert.equal(time.toNumber(), registrationExpiration);
            });

            it('should set the votingExpiration time to the specified value', async () => {
                const time = await instance.votingExpiration.call();
                assert.equal(time.toNumber(), votingExpiration);
            });

            it('should set currentPhase to Phase.Registration (0)', async () => {
               const phase = await instance.currentPhase.call();
               assert.equal(phase.toNumber(), 0);
            });

            it('should set parametersHash to the specified value', async () => {
                const hash = await instance.parametersHash.call();
                assert.equal(hash, PARAMS_HASH);
            });
        });

        describe('case: registration already expired', () => {
            beforeEach(() => {
                const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                registrationExpiration = now - PHASE_DURATION;
                votingExpiration = now + 2 * PHASE_DURATION;
            });

            it('should throw an error during deployment', done => {
                AnonymousVoting.new(registrationExpiration, votingExpiration, PARAMS_HASH)
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
                registrationExpiration = now + 2 * PHASE_DURATION;
                votingExpiration = registrationExpiration - PHASE_DURATION;
            });

            it('should throw an error during deployment', done => {
                AnonymousVoting.new(registrationExpiration, votingExpiration, PARAMS_HASH)
                    .catch(() => SUPPRESS_EXPECTED_ERROR)
                    .then(val => val === SUPPRESS_EXPECTED_ERROR ? null :
                        Error('Successfully deployed AnonymousVoting contract with Voting ending before Registration')
                    )
                    .then(done);
            });
        });
    });

    describe('parameter: currentPhase', () => {

        const PHASES = {
            'REGISTRATION': 0,
            'VOTING': 1,
            'COMPLETE': 2
        };

        beforeEach(async () => {
            const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
            registrationExpiration = now + PHASE_DURATION;
            votingExpiration = registrationExpiration + PHASE_DURATION;
            instance = await AnonymousVotingPhases.new(registrationExpiration, votingExpiration, PARAMS_HASH);
        });

        it('should start at Phase.Registration', async () => {
            const phase = await instance.currentPhase.call();
            assert.equal(phase.toNumber(), PHASES.REGISTRATION);
        });

        it('should stay at Phase.Registration if time does not pass', async () => {
            await instance.updatePhaseIfNecessary();
            const phase = await instance.currentPhase.call();
            assert.equal(phase.toNumber(), PHASES.REGISTRATION);
        });

        describe('case: half the Registration phase duration passes', () => {
            beforeEach(async () => {
                await instance.advanceTime(PHASE_DURATION / 2);
            });

            it('should stay at Phase.Registration', async () => {
                await instance.updatePhaseIfNecessary();
                const phase = await instance.currentPhase.call();
                assert.equal(phase.toNumber(), PHASES.REGISTRATION);
            });
        });

        describe('case: slightly more than the Registration phase duration passes', () => {

            beforeEach(async () => {
                await instance.advanceTime(PHASE_DURATION * 1.1);
            });

            it('should advance to Phase.Voting', async () => {
                await instance.updatePhaseIfNecessary();
                const phase = await instance.currentPhase.call();
                assert.equal(phase.toNumber(), PHASES.VOTING);
            });

            describe('case: consequently, half the Voting phase duration passes', () => {
                beforeEach(async () => {
                    await instance.advanceTime(PHASE_DURATION / 2);
                });

                it('should stay at Phase.Voting', async () => {
                    await instance.updatePhaseIfNecessary();
                    const phase = await instance.currentPhase.call();
                    assert.equal(phase.toNumber(), PHASES.VOTING);
                });
            });

            describe('case: consequently, the Voting phase duration passes', () => {
                beforeEach(async () => {
                    await instance.advanceTime(PHASE_DURATION);
                });

                it('should advance to Phase.Complete', async () => {
                    await instance.updatePhaseIfNecessary();
                    const phase = await instance.currentPhase.call();
                    assert.equal(phase.toNumber(), PHASES.COMPLETE);
                });
            });
        });

        describe('case: more than the combined Registration and Voting phase durations passes', () => {
            beforeEach(async () => {
                await instance.advanceTime(2.1 * PHASE_DURATION);
            });

            it('should advance to Phase.Complete (bypassing Phase.Voting)', async () => {
                await instance.updatePhaseIfNecessary();
                const phase = await instance.currentPhase.call();
                assert.equal(phase.toNumber(), PHASES.COMPLETE);
            });
        });
    });
});