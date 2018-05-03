const AnonymousVoting = artifacts.require('AnonymousVoting');

contract('AnonymousVoting', () => {

    describe('method: constructor', async (accounts) => {

        let instance;
        const voteParamsHash = 'DUMMY_PARAMS_HASH';

        beforeEach((async () => {
            instance = await AnonymousVoting.new(voteParamsHash);
        }));

        it('should set parametersHash to the specified value', async () => {
            const hash = await instance.parametersHash.call();
            assert.equal(hash, voteParamsHash);
        });
    });
});