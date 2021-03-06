const AddressProxy = artifacts.require("./AddressProxy.sol");
const TestToken = artifacts.require("./TestToken.sol");

contract('AddressProxy - lock', function (accounts) {

    it('should be callable by client and owner', function () {
        const owner = accounts[0];
        const client = accounts[1];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                //lock should be callable by owner and recovery address
                await instance.lock.call({from: owner});
                await instance.lock.call({from: client});

            });

    });

    it('should be callable by owner', function () {
        const owner = accounts[0];
        const client = accounts[1];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                //lock should be callable by owner
                await instance.lock.call({from: owner});

            });
    });

    it('should be callable by client', function () {
        const owner = accounts[0];
        const client = accounts[1];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                //lock should be callable by owner
                await instance.lock.call({from: client});

            });
    });

    it('should NOT be callable by random address', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const randomAddress = accounts[2];

        return AddressProxy
            .new(owner, client)
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

    it('should only be callable by owner and client', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const randomAddress = accounts[2];

        return AddressProxy
            .new(owner, client)
            .then(async function (proxyAddress) {

                await proxyAddress.exec.call("", 0x0, 0, {from: owner});
                await proxyAddress.exec.call("", 0x0, 0, {from: client});

                try {
                    await proxyAddress.exec.call("", 0x0, 0, {from: randomAddress})
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
        const client = accounts[1];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                assert.isFalse(await instance.locked());
                await instance.lock();
                assert.isTrue(await instance.locked());

                try {
                    await instance.exec.call("", 0x0, 0, {from: owner})
                }catch (e){
                    //Proxy call should be reverted
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected the last proxyAddress.exec.call to fail since the random address is not an owner");

            });
    });

    it('should not be callable by client when locked', function () {
        const owner = accounts[0];
        const client = accounts[1];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                assert.isFalse(await instance.locked());
                await instance.lock();
                assert.isTrue(await instance.locked());

                //call with recovery address should go through
                try {
                    await instance.exec.call("", 0x0, 0, {from: client})
                } catch (e){
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected the last proxyAddress.exec to throw since the proxy is locked");

            });

    });

});

contract('AddressProxy - unlock', function (accounts) {

    it('should not be callable by client', function () {
        const owner = accounts[0];
        const client = accounts[1];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                await instance.lock();

                try {
                    await instance.unlock({from: client})
                }catch (e){
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since the unlock function can't be called by the owner");

            })
    });

    it('should be callable by owner', function () {
        const owner = accounts[0];
        const client = accounts[1];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                await instance.lock();

                assert.isTrue(await instance.locked());

                await instance.unlock({from: owner});

                assert.isFalse(await instance.locked());

            })
    });

    it('should not be callable by random address', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const randomAddress = accounts[4];

        return AddressProxy
            .new(owner, client)
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

    it('should not be callable by client', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const newOwner = accounts[2];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                try {
                    await instance.changeOwner(newOwner, {from: client});
                }catch(e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since changeOwner should only be callable by the recovery address");

            })
    });

    it('should be callable by owner', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const newOwner = accounts[2];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                await instance.changeOwner(newOwner, {from: owner});

                assert.equal(newOwner, await instance.owner());
                assert.equal(client, await instance.client())

            })
    });

    it('should not be callable by random address', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const newOwner = accounts[2];
        const randomAddress = accounts[7];

        return AddressProxy
            .new(owner, client)
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

contract('AddressProxy - changeClient', function (accounts) {

    it('should not be callable by client', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const newClient = accounts[2];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                try {
                    await instance.changeClient(newClient, {from: client})
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to throw since the owner can't change the recovery address");

            })
    });

    it('should be callable by owner', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const newClient = accounts[2];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                //Ensure the current recovery address is ok
                assert.equal(owner, await instance.owner());

                //Change the recovery address
                await instance.changeClient(newClient, {from: owner});

                //check if the recovery address was really changed
                assert.equal(newClient, await instance.client());
                assert.equal(owner, await instance.owner());

            })
    });

    it('should not be callable by randomAddress', function () {
        const owner = accounts[0];
        const client = accounts[1];
        const newClient = accounts[2];
        const randomAddress = accounts[8];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                try {
                    await instance.changeClient(newClient, {from: randomAddress})
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
        const client = accounts[1];
        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {
                assert.equal(owner, await instance.owner());
                assert.equal(client, await instance.client());
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
        const client = accounts[1];

        return Promise
            .all([
                AddressProxy.new(owner, client),
                TestToken.new()
            ])
            .then(async function (instances) {
                //Contracts
                const AddressProxy = instances[0];
                const TestToken = instances[1];

                //This is the create action as byte code
                const dataToExecute = await TestToken.contract.createTokens.getData(100);

                //Execute the transaction
                await AddressProxy.exec(TestToken.address, dataToExecute, 0);

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
        const client = accounts[1];

        return Promise
            .all([
                AddressProxy.new(owner, client),
                TestToken.new()
            ])
            .then(async function (instances) {
                const AddressProxy = instances[0];
                const TestToken = instances[1];

                //Send eth to proxy address
                await web3.eth.sendTransaction({
                    from: owner,
                    to: AddressProxy.address,
                    value: 5
                });

                //Data to execute
                const dataToExecute = await TestToken.contract.buyTokens.getData(456);

                //Make sure the test token contract has 0 wei
                let testTokenBalance = await web3.eth.getBalance(TestToken.address);
                assert.equal(0, testTokenBalance.toNumber());

                //Get some token's and pay for them
                await AddressProxy.exec(TestToken.address, dataToExecute, 5, {
                    from: owner,
                });

                //Make sure that we payed for the token's
                testTokenBalance = await web3.eth.getBalance(TestToken.address);
                assert.equal(5, testTokenBalance.toNumber());

            })

    });

});

contract("AddressProxy - execCustom", function(accounts) {

    it('should be callable by owner', function(){
        const owner = accounts[0];
        const client = accounts[1];

        return Promise
            .all([
                AddressProxy.new(owner, client),
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

                //Get some token's and pay for them with 3 wei
                await AddressProxy.execCustom(TestToken.address, dataToExecute, 3, 100000000000000000000000, {
                    from: owner,
                    value: 100,
                    gas: 100000
                });

                //Make sure that we payed for the token's with 3 wei
                testTokenBalance = await web3.eth.getBalance(TestToken.address);
                assert.equal(3, testTokenBalance.toNumber());

            })
    });

    it('should be callable by client', function(){
        const owner = accounts[0];
        const client = accounts[1];

        return Promise
            .all([
                AddressProxy.new(owner, client),
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

                //Get some token's and pay for them with 3 wei
                await AddressProxy.execCustom(TestToken.address, dataToExecute, 34, 100000000000000000000000, {
                    from: client,
                    value: 100,
                    gas: 100000
                });

                //Make sure that we payed for the token's with 34 wei
                testTokenBalance = await web3.eth.getBalance(TestToken.address);
                assert.equal(34, testTokenBalance.toNumber());

            })
    });

    it("shouldn't be callable by random address", function(){
        const owner = accounts[0];
        const client = accounts[1];
        const randomAddress = accounts[8];

        return Promise
            .all([
                AddressProxy.new(owner, client),
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

                try {
                    await AddressProxy.execCustom(TestToken.address, dataToExecute, 35, 100000000000000000000000, {
                        from: randomAddress,
                        value: 100,
                        gas: 100000
                    });
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to trow since a random address can't change the recovery address");

            })

    });

    it("shouldn't be callable when locked", function () {
        const owner = accounts[0];
        const client = accounts[1];

        return Promise
            .all([
                AddressProxy.new(owner, client),
                TestToken.new()
            ])
            .then(async function (instances) {
                const AddressProxy = instances[0];
                const TestToken = instances[1];

                //Lock proxy down
                AddressProxy.lock();
                assert.isTrue(await AddressProxy.locked());

                //Data to execute
                const dataToExecute = await TestToken.contract.buyTokens.getData(456);

                //Make sure the test token contract has 0 wei
                let testTokenBalance = await web3.eth.getBalance(TestToken.address);
                assert.equal(0, testTokenBalance.toNumber());

                try {
                    await AddressProxy.execCustom(TestToken.address, dataToExecute, 35, 100000000000000000000000, {
                        from: owner,
                        value: 100,
                        gas: 100000
                    });
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                }

                try {
                    await AddressProxy.execCustom(TestToken.address, dataToExecute, 35, 100000000000000000000000, {
                        from: client,
                        value: 100,
                        gas: 100000
                    });
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to trow since a random address can't change the recovery address");

            })
    })

});

contract("AddressProxy - sendEther", function (accounts) {

    it("should be callable by client", function () {
        const owner = accounts[0];
        const client = accounts[1];
        const receiver = accounts[4];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                //Send some eth to contract
                await web3.eth.sendTransaction({
                    from: owner,
                    to: instance.address,
                    value: 100
                });

                assert.equal(100, await web3.eth.getBalance(instance.address).toString(10));

                //Transfer some ether from proxy address to
                await instance.sendEther(receiver, 50, {
                    from: client
                });

                assert.equal(50, await web3.eth.getBalance(instance.address).toString(10));

            });
    });

    it("should be callable by owner", function () {
        const owner = accounts[0];
        const client = accounts[1];
        const receiver = accounts[4];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                //Send some eth to contract
                await web3.eth.sendTransaction({
                    from: owner,
                    to: instance.address,
                    value: 100
                });

                assert.equal(100, await web3.eth.getBalance(instance.address).toString(10));

                //Transfer some ether from proxy address to
                await instance.sendEther(receiver, 50, {
                    from: owner
                });

                assert.equal(50, await web3.eth.getBalance(instance.address).toString(10));

            });
    });

    it("should't be callable by random address", function () {
        const owner = accounts[0];
        const client = accounts[1];
        const receiver = accounts[4];
        const randomAddress = accounts[6];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                //Send some eth to contract
                await web3.eth.sendTransaction({
                    from: owner,
                    to: instance.address,
                    value: 100
                });

                assert.equal(100, await web3.eth.getBalance(instance.address).toString(10));

                try {
                    //Transfer some ether from proxy address to
                    await instance.sendEther(receiver, 50, {
                        from: randomAddress
                    });
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to trow since a random address can't change the recovery address");

            });
    });

    it("should be callable when locked", function () {
        const owner = accounts[0];
        const client = accounts[1];
        const receiver = accounts[4];
        const randomAddress = accounts[6];

        return AddressProxy
            .new(owner, client)
            .then(async function (instance) {

                //Send some eth to contract
                await web3.eth.sendTransaction({
                    from: owner,
                    to: instance.address,
                    value: 100
                });

                assert.equal(100, await web3.eth.getBalance(instance.address).toString(10));

                try {
                    //Transfer some ether from proxy address to
                    await instance.sendEther(receiver, 50, {
                        from: owner
                    });
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                }

                try {
                    //Transfer some ether from proxy address to
                    await instance.sendEther(receiver, 50, {
                        from: client
                    });
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                }

                try {
                    //Transfer some ether from proxy address to
                    await instance.sendEther(receiver, 50, {
                        from: receiver
                    });
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                }

                try {
                    //Transfer some ether from proxy address to
                    await instance.sendEther(receiver, 50, {
                        from: randomAddress
                    });
                } catch (e) {
                    assert.equal("VM Exception while processing transaction: revert", e.message);
                    return;
                }

                assert.fail("Expected to trow since a random address can't change the recovery address");

            });
    })

});
