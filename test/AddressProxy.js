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

contract('AddressProxy - unlock', function (accounts) {

    it('should not be callable by owner', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                await instance.lock();

                try {
                    await instance.unlock({from: owner})
                }catch (e){
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since the unlock function can't be called by the owner");

            })
    });

    it('should be callable by recoveryAddress', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                await instance.lock();

                assert.isTrue(await instance.locked());

                await instance.unlock({from: recoveryAddress});

                assert.isFalse(await instance.locked());

            })
    });

    it('should not be callable by random address', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const randomAddress = accounts[4];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                await instance.lock();

                try {
                    await instance.unlock({from: randomAddress})
                }catch (e){
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since the unlock function can't be called by a random address");

            })
    });

});

contract('AddressProxy - changeOwner', function (accounts) {

    it('should not be callable by owner', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const newOwner = accounts[2];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                try {
                    await instance.changeOwner(newOwner, {from: owner});
                }catch(e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since changeOwner should only be callable by the recovery address");

            })
    });

    it('should be callable by recovery Address', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const newOwner = accounts[2];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                await instance.changeOwner(newOwner, {from: recoveryAddress});

                assert.equal(newOwner, await instance.ownerAddress());
                assert.equal(recoveryAddress, await instance.recoveryAddress())

            })
    });

    it('should not be callable by random address', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const newOwner = accounts[2];
        const randomAddress = accounts[7];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                try {
                    await instance.changeOwner(newOwner, {from: randomAddress});
                }catch(e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since changeUser should only be callable by the recovery address");

            })
    });

});

contract('AddressProxy - changeRecovery', function (accounts) {

    it('should not be callable by owner', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const newRecoveryAddress = accounts[2];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                try {
                    await instance.changeRecovery(newRecoveryAddress, {from: owner})
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since the owner can't change the recovery address");

            })
    });

    it('should be callable by recoveryAddress', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const newRecoveryAddress = accounts[2];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                //Ensure the current recovery address is ok
                assert.equal(recoveryAddress, await instance.recoveryAddress());

                //Change the recovery address
                await instance.changeRecovery(newRecoveryAddress, {from: recoveryAddress});

                //check if the recovery address was really changed
                assert.equal(newRecoveryAddress, await instance.recoveryAddress());

            })
    });

    it('should not be callable by randomAddress', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];
        const newRecoveryAddress = accounts[2];
        const randomAddress = accounts[8];

        return AddressProxy
            .new(owner, recoveryAddress)
            .then(async function (instance) {

                try {
                    await instance.changeRecovery(newRecoveryAddress, {from: randomAddress})
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to trow since a random address can't change the recovery address");

            })

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

});

contract("AddressProxy - call forwarding", function (accounts) {

    //Test if the proxy
    it('contract call', function () {
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

    it('ether transfer in contract call', function () {
        const owner = accounts[0];
        const recoveryAddress = accounts[1];

        return Promise
            .all([
                AddressProxy.new(owner, recoveryAddress),
                TestToken.new()
            ])
            .then(async function (instances) {
                const AddressProxy = instances[0];
                const TestToken = instances[1];

                //Data to execute
                const dataToExecute = await TestToken.contract.buyTokens.getData(456);

                //Make sure the test token contract has 0 wei
                let testTokenBalance = await web3.eth.getBalance(TestToken.address);
                assert.equal(0, testTokenBalance.toNumber());

                //Get some token's and pay for them
                await AddressProxy.exec(TestToken.address, dataToExecute, {
                    from: owner,
                    value: 1
                });

                //Make sure that we payed for the token's
                testTokenBalance = await web3.eth.getBalance(TestToken.address);
                assert.equal(1, testTokenBalance.toNumber());

            })

    });

});
