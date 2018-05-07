const NoRestriction = artifacts.require('NoRestriction');

contract('NoRestriction', () => {
    let instance;

    beforeEach(async () => {
        instance = await NoRestriction.deployed();
    });

    describe('method: isAuthorised', () => {
       const DUMMY_ADDRESS = 0x1234;

       it('should return true', async() => {
         const authorised = await instance.isAuthorised.call(DUMMY_ADDRESS);
         assert.equal(authorised, true);
       });
    });
});