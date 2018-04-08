const AddressProxy = artifacts.require("./AddressProxy.sol");
const TestToken = artifacts.require("./TestToken.sol");

contract('AddressProxy - lock', function (accounts) {

    it('should be callable by recoveryAddress and owner', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                //lock should be callable by owner and recovery address
                await instance.lock.call({from: owner});
                await instance.lock.call({from: recoveryAddress});

            });

    });

    it('should be callable by owner', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                //lock should be callable by owner
                await instance.lock.call({from: owner});

            });
    });

    it('should be callable by recovery address', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                //lock should be callable by owner
                await instance.lock.call({from: recoveryAddress});

            });
    });

    it('should NOT be callable by random address', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const randomAddress = accounts[2];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                //lock should be callable by owner
                try {
                    await instance.lock.call({from: randomAddress});
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since a random address shouldn't be able to call lock");

            });
    });

});

contract('AddressProxy - exec', function (accounts) {

    it('should only be callable by owner and recoveryAddress', function () {
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
                    return;
                }

                assert.fail("Expected the last proxyAddress.exec.call to fail since the random address is not an owner");

            })
            .catch(function (error) {
                throw error;
            })

    });

    it('should not be callable by owner when locked', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                assert.isFalse(await instance.locked());
                await instance.lock();
                assert.isTrue(await instance.locked());

                try {
                    await instance.exec.call("", 0x0, {from: owner})
                }catch (e){
                    //Proxy call should be reverted
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected the last proxyAddress.exec.call to fail since the random address is not an owner");

            });
    });

    it('should not be callable by recoveryAddress when locked', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                assert.isFalse(await instance.locked());
                await instance.lock();
                assert.isTrue(await instance.locked());

                //call with recovery address should go through
                try {
                    await instance.exec.call("", 0x0, {from: recoveryAddress})
                } catch (e){
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected the last proxyAddress.exec to throw since the proxy is locked");

            });

    });

});

contract('AddressProxy', function (accounts) {

    it('correct addresses after deployment', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {
                assert.equal(owner, await instance.ownerAddress());
                assert.equal(recoveryAddress, await instance.recoveryAddress());
                assert.equal(false, await instance.locked());
            })
            .catch(function (reason) {
                throw reason;
            });
    });

    it('unlock - should not be callable by owner', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                try {
                    await instance.unlock({from: owner});
                }catch (e) {
                    assert.equal(e.message, "VM Exception while processing transaction: revert");
                    return;
                }

                assert.fail("Expected that error is thrown when calling unlock with owner");

            })

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
