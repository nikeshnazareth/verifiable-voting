const AnonymousVoting = artifacts.require('AnonymousVoting');
const AnonymousVotingPhases = artifacts.require('TestAnonymousVotingPhases');
const NoRestriction = artifacts.require('NoRestriction');
const AlwaysBlock = artifacts.require('AlwaysBlock');

contract('AnonymousVoting', (accounts) => {
    const SUPPRESS_EXPECTED_ERROR = 'SUPPRESS_EXPECTED_ERROR';

    let instance;
    let registrationExpiration;
    let votingExpiration;
    // arbitrary constants
    const PARAMS_HASH = 'DUMMY_PARAMS_HASH';
    const ELIGIBILITY_CONTRACT = '0x1234567890123456789012345678901234567890';
    const VOTER_ADDRESS = accounts[1];
    const REGISTRATION_AUTH = accounts[2];
    const PHASE_DURATION = 1000;

    describe('method: constructor', () => {

        describe('case: valid arguments', () => {

            beforeEach(async () => {
                const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                registrationExpiration = now + PHASE_DURATION;
                votingExpiration = registrationExpiration + PHASE_DURATION;
                instance = await AnonymousVoting.new(
                    registrationExpiration, votingExpiration, PARAMS_HASH, ELIGIBILITY_CONTRACT, REGISTRATION_AUTH
                );
            });

            it('should set the registrationExpiration time to the specified value', async () => {
                const time = await instance.registrationDeadline.call();
                assert.equal(time.toNumber(), registrationExpiration);
            });

            it('should set the votingExpiration time to the specified value', async () => {
                const time = await instance.votingDeadline.call();
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

            it('should set the eligibilityContract to the specified value', async () => {
                const contract = await instance.eligibilityContract.call();
                assert.equal(contract, ELIGIBILITY_CONTRACT);
            });

            it('should set the registrationAuthority to the specified value', async () => {
                const regAuth = await instance.registrationAuthority.call();
                assert.equal(regAuth, REGISTRATION_AUTH);
            });
        });

        describe('case: registration already expired', () => {
            beforeEach(() => {
                const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                registrationExpiration = now - PHASE_DURATION;
                votingExpiration = now + 2 * PHASE_DURATION;
            });

            it('should throw an error during deployment', async () => {
                const response = await AnonymousVoting.new(
                    registrationExpiration, votingExpiration, PARAMS_HASH, ELIGIBILITY_CONTRACT, REGISTRATION_AUTH
                ).catch(() => SUPPRESS_EXPECTED_ERROR);
                assert.equal(response, SUPPRESS_EXPECTED_ERROR);
            });
        });

        describe('case: Voting phase expires before Registration phase', () => {
            beforeEach(() => {
                const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                registrationExpiration = now + 2 * PHASE_DURATION;
                votingExpiration = registrationExpiration - PHASE_DURATION;
            });

            it('should throw an error during deployment', async () => {
                const response = await AnonymousVoting.new(
                    registrationExpiration, votingExpiration, PARAMS_HASH, ELIGIBILITY_CONTRACT, REGISTRATION_AUTH
                ).catch(() => SUPPRESS_EXPECTED_ERROR);
                assert.equal(response, SUPPRESS_EXPECTED_ERROR);
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
            instance = await AnonymousVotingPhases.new(
                registrationExpiration, votingExpiration, PARAMS_HASH, ELIGIBILITY_CONTRACT, REGISTRATION_AUTH
            );
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

            it('should emit a NewPhase event with Phase.Voting', async () => {
                const tx = await instance.updatePhaseIfNecessary();
                assert.equal(tx.logs.length, 1);
                const log = tx.logs[0];
                assert.equal(log.event, 'NewPhase');
                assert.isDefined(log.args.phase);
                assert.equal(log.args.phase.toNumber(), PHASES.VOTING);
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

                it('should emit a NewPhase event with Phase.Complete', async () => {
                    const tx = await instance.updatePhaseIfNecessary();
                    assert.equal(tx.logs.length, 1);
                    const log = tx.logs[0];
                    assert.equal(log.event, 'NewPhase');
                    assert.isDefined(log.args.phase);
                    assert.equal(log.args.phase.toNumber(), PHASES.COMPLETE);
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

            it('should emit a NewPhase event with Phase.Complete', async () => {
                const tx = await instance.updatePhaseIfNecessary();
                assert.equal(tx.logs.length, 1);
                const log = tx.logs[0];
                assert.equal(log.event, 'NewPhase');
                assert.isDefined(log.args.phase);
                assert.equal(log.args.phase.toNumber(), PHASES.COMPLETE);
            });
        });
    });

    describe('method: register', () => {
        let gatekeeper;
        const BLINDED_ADDRESS_HASH = 'DUMMY_BLINDED_ADDRESS_HASH';
        const SECOND_VOTER_ADDRESS = accounts[3];

        const BLINDING_INDICES = {
            'ADDRESS_HASH': 0,
            'SIGNATURE_HASH': 1
        };

        beforeEach(async () => {
            const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
            registrationExpiration = now + PHASE_DURATION;
            votingExpiration = registrationExpiration + PHASE_DURATION;
        });

        describe('case: valid context', () => {
            beforeEach(async () => {
                gatekeeper = await NoRestriction.new();
                instance = await AnonymousVoting.new(
                    registrationExpiration, votingExpiration, PARAMS_HASH, gatekeeper.address, REGISTRATION_AUTH
                );
            });

            it('should set the addressHash of the message sender to the specified value', async () => {
                let blindedAddress = await instance.blindedAddress.call(VOTER_ADDRESS);
                assert.equal(blindedAddress[BLINDING_INDICES.ADDRESS_HASH], '');

                await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
                blindedAddress = await instance.blindedAddress.call(VOTER_ADDRESS);
                assert.equal(blindedAddress[BLINDING_INDICES.ADDRESS_HASH], BLINDED_ADDRESS_HASH);
            });

            it('should not affect the signatureHash of the message sender', async () => {
                let blindedAddress = await instance.blindedAddress.call(VOTER_ADDRESS);
                assert.equal(blindedAddress[BLINDING_INDICES.SIGNATURE_HASH], '');

                await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
                blindedAddress = await instance.blindedAddress.call(VOTER_ADDRESS);
                assert.equal(blindedAddress[BLINDING_INDICES.SIGNATURE_HASH], '');
            });

            it('should increment the "pendingRegistrations" value', async () => {
                let pendingRegistrations = await instance.pendingRegistrations.call();
                assert.equal(pendingRegistrations, 0);

                await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
                pendingRegistrations = await instance.pendingRegistrations.call();
                assert.equal(pendingRegistrations, 1);

                await instance.register(BLINDED_ADDRESS_HASH, {from: SECOND_VOTER_ADDRESS});
                pendingRegistrations = await instance.pendingRegistrations.call();
                assert.equal(pendingRegistrations, 2);
            });

            it('should emit a "VoterInitiatedRegistration" event with the sender as a parameter', async () => {
                const tx = await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
                assert.equal(tx.logs.length, 1);
                const log = tx.logs[0];
                assert.equal(log.event, 'VoterInitiatedRegistration');
                assert.deepEqual(log.args, {voter: VOTER_ADDRESS});
            });

        });

        describe('case: the Registration phase has ended', () => {
            beforeEach(async () => {
                gatekeeper = await NoRestriction.new();
                instance = await AnonymousVotingPhases.new(
                    registrationExpiration, votingExpiration, PARAMS_HASH, gatekeeper.address, REGISTRATION_AUTH
                );
                instance.advanceTime(PHASE_DURATION * 1.1);
            });

            it('should throw an error when "register" is called', async () => {
                const response = await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS})
                    .catch(() => SUPPRESS_EXPECTED_ERROR);
                assert.equal(response, SUPPRESS_EXPECTED_ERROR);
            });
        });

        describe('case: the voter has already published their blinded address', () => {
            const SECOND_BLINDED_ADDRESS_HASH = 'SECOND_DUMMY_BLINDED_ADDRESS_HASH';

            beforeEach(async () => {
                gatekeeper = await NoRestriction.new();
                instance = await AnonymousVotingPhases.new(
                    registrationExpiration, votingExpiration, PARAMS_HASH, gatekeeper.address, REGISTRATION_AUTH
                );
                await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
            });

            it('should throw an error when "register" is called', async () => {
                const response = await instance.register(SECOND_BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS})
                    .catch(() => SUPPRESS_EXPECTED_ERROR);
                assert.equal(response, SUPPRESS_EXPECTED_ERROR);
            });
        });

        describe('case: the voter is not eligible to vote', () => {
            beforeEach(async () => {
                gatekeeper = await AlwaysBlock.new();
                instance = await AnonymousVotingPhases.new(
                    registrationExpiration, votingExpiration, PARAMS_HASH, gatekeeper.address, REGISTRATION_AUTH
                );
            });

            it('should throw an error when "register" is called', async () => {
                const response = await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS})
                    .catch(() => SUPPRESS_EXPECTED_ERROR);
                assert.equal(response, SUPPRESS_EXPECTED_ERROR);
            });
        });
    });

    describe('method: completeRegistration', () => {
        let gatekeeper;

        const BLINDED_ADDRESS_HASH = 'DUMMY_BLINDED_ADDRESS_HASH';
        const BLIND_SIGNATURE_HASH = 'DUMMY_BLIND_SIGNATURE_HASH';

        const BLINDING_INDICES = {
            'ADDRESS_HASH': 0,
            'SIGNATURE_HASH': 1
        };

        beforeEach(async () => {
            const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
            registrationExpiration = now + PHASE_DURATION;
            votingExpiration = registrationExpiration + PHASE_DURATION;
            gatekeeper = await NoRestriction.new();
            instance = await AnonymousVoting.new(
                registrationExpiration, votingExpiration, PARAMS_HASH, gatekeeper.address, REGISTRATION_AUTH
            );
        });

        describe('case: valid context', () => {
            beforeEach(async () => {
                await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
            });

            it('should set the signatureHash of the voter to the specified value', async () => {
                let blindedAddress = await instance.blindedAddress.call(VOTER_ADDRESS);
                assert.equal(blindedAddress[BLINDING_INDICES.SIGNATURE_HASH], '');

                await instance.completeRegistration(VOTER_ADDRESS, BLIND_SIGNATURE_HASH, {from: REGISTRATION_AUTH});
                blindedAddress = await instance.blindedAddress.call(VOTER_ADDRESS);
                assert.equal(blindedAddress[BLINDING_INDICES.SIGNATURE_HASH], BLIND_SIGNATURE_HASH);
            });

            it('should not affect the addressHash of the voter', async () => {
                await instance.completeRegistration(VOTER_ADDRESS, BLIND_SIGNATURE_HASH, {from: REGISTRATION_AUTH});
                blindedAddress = await instance.blindedAddress.call(VOTER_ADDRESS);
                assert.equal(blindedAddress[BLINDING_INDICES.ADDRESS_HASH], BLINDED_ADDRESS_HASH);
            });

            it('should decrement the "pendingRegistrations" value', async () => {
                let pendingRegistrations = await instance.pendingRegistrations.call();
                assert.equal(pendingRegistrations, 1);

                await instance.completeRegistration(VOTER_ADDRESS, BLIND_SIGNATURE_HASH, {from: REGISTRATION_AUTH});
                pendingRegistrations = await instance.pendingRegistrations.call();
                assert.equal(pendingRegistrations, 0);
            });

            it('should emit a "RegistrationComplete" event with the voter as a parameter', async () => {
                const tx = await instance.completeRegistration(
                    VOTER_ADDRESS, BLIND_SIGNATURE_HASH, {from: REGISTRATION_AUTH}
                );
                assert.equal(tx.logs.length, 1);
                const log = tx.logs[0];
                assert.equal(log.event, 'RegistrationComplete');
                assert.deepEqual(log.args, {voter: VOTER_ADDRESS});
            });
        });

        describe('case: the Registration phase has ended', () => {
            beforeEach(async () => {
                gatekeeper = await NoRestriction.new();
                instance = await AnonymousVotingPhases.new(
                    registrationExpiration, votingExpiration, PARAMS_HASH, gatekeeper.address, REGISTRATION_AUTH
                );
                await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
                instance.advanceTime(PHASE_DURATION * 1.1);
            });

            it('should continue to allow the Registration Authority to complete registrations', async () => {
                const tx = await instance.completeRegistration(VOTER_ADDRESS, BLIND_SIGNATURE_HASH, {from: REGISTRATION_AUTH});
                blindedAddress = await instance.blindedAddress.call(VOTER_ADDRESS);
                assert.equal(blindedAddress[BLINDING_INDICES.SIGNATURE_HASH], BLIND_SIGNATURE_HASH);

                const pendingRegistrations = await instance.pendingRegistrations.call();
                assert.equal(pendingRegistrations, 0);

                assert.equal(tx.logs.length, 1);
                const log = tx.logs[0];
                assert.equal(log.event, 'RegistrationComplete');
                assert.deepEqual(log.args, {voter: VOTER_ADDRESS});
            });
        })

        describe('case: the message sender is not the registration authority', () => {
            beforeEach(async () => {
                await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
            });

            it('should throw an error', async () => {
                const response = await instance.completeRegistration(VOTER_ADDRESS, BLIND_SIGNATURE_HASH)
                    .catch(() => SUPPRESS_EXPECTED_ERROR);
                assert.equal(response, SUPPRESS_EXPECTED_ERROR);
            });
        });

        describe('case: the voter has not yet initiated registration', () => {
            it('should throw an error', async () => {
                const response = await instance.completeRegistration(
                    VOTER_ADDRESS, BLIND_SIGNATURE_HASH, {from: REGISTRATION_AUTH}
                )
                    .catch(() => SUPPRESS_EXPECTED_ERROR);
                assert.equal(response, SUPPRESS_EXPECTED_ERROR);
            });
        });

        describe('case: the blind signature has already been published', () => {
            const SECOND_BLIND_SIGNATURE_HASH = 'DUMMY_SECOND_BLIND_SIGNATURE_HASH';

            beforeEach(async () => {
                await instance.register(BLINDED_ADDRESS_HASH, {from: VOTER_ADDRESS});
                await instance.completeRegistration(VOTER_ADDRESS, BLIND_SIGNATURE_HASH, {from: REGISTRATION_AUTH})
            });

            it('should throw an error', async () => {
                const response = await instance.completeRegistration(
                    VOTER_ADDRESS, SECOND_BLIND_SIGNATURE_HASH, {from: REGISTRATION_AUTH}
                )
                    .catch(() => SUPPRESS_EXPECTED_ERROR);
                assert.equal(response, SUPPRESS_EXPECTED_ERROR);
            });
        });
    });
});