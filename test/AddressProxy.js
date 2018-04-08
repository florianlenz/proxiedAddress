const AddressProxy = artifacts.require("./AddressProxy.sol");
const TestToken = artifacts.require("./TestToken.sol");

contract('AddressProxy', function (accounts) {

    it('correct addresses after deployment', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {
                assert.equal(owner, await instance.ownerAddress());
                assert.equal(recoveryAddress, await instance.recoveryAddress());
            })
            .catch(function (reason) {
                throw reason;
            });
    });

    it('exec - should only be callable by owner and recoveryAddress', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const randomAddress = accounts[2];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (proxyAddress) {
                await proxyAddress.exec.call("", 0x0, {from: owner});
                await proxyAddress.exec.call("", 0x0, {from: recoveryAddress});
                try {
                    await proxyAddress.exec.call("", 0x0, {from: randomAddress})
                }catch (e){
                    //We assert that the last proxy call is reverted since the random address
                    //is not an owner and shouldn't have access to the exec method
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                }
                assert.fail("Expected the last proxyAddress.exec.call to fail since the random address is not an owner");
            })
            .catch(function (error) {
                throw error;
            })

    });

    it('exec - should not be callable by owner when locked', function () {
        assert.fail("Missing implementation")
    });

    it('exec - should be callable when recovery address', function () {
        assert.fail("Missing implementation")

    });

    it('lock - should only be callable by recoveryAddress', function () {
        assert.fail("Missing implementation")

    });

    it('unlock - should only be callable by onlyRecovery', function () {
        assert.fail("Missing implementation")

    });

    it('changeUser - should only be callable by recoveryAddress', function () {
        assert.fail("Missing implementation")

    });

    it('changeRecoveryAddressAndUnlock - should only be callable by recoveryAddress', function () {
        assert.fail("Missing implementation")
    });

    it('proxy - success with contract call and ether', function () {
        assert.fail("Missing implementation")
    });

    //Test if the proxy
    it('proxy - success with contract call', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return Promise
            .all([
                AddressProxy.new(owner, recoveryAddress),
                TestToken.new()
            ])
            .then(async function (instances) {
                //Contracts
                const AddressProxy = instances[0];
                const TestToken = instances[1];

                //This is the create action as byte code
                const dataToExecute = await TestToken.contract.createTokens.getData(100);

                //Execute the transaction
                await AddressProxy.exec(TestToken.address, dataToExecute);

                let proxyBalance = await TestToken.balance(AddressProxy.address);

                //The balance of the proxy address balance
                //should be 100 since the "call" is forwarded
                assert.equal(100, proxyBalance.toNumber());

            })
            .catch(function (reason) {
                throw reason;
            })
    });

});
