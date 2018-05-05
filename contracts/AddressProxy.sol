pragma solidity ^0.4.17;

contract AddressProxy {

    /**
    * @dev The owner owns the address proxy and has the highest access
    */
    address public owner;

    /**
    * @dev The client is the address that has day to day access
    */
    address public client;

    /**
    * @dev If the proxy is locked, the client can't access the proxy anymore
    */
    bool public locked;

    /**
    * @param _owner the address that "own" the proxy and interact with it most of the time
    * @param _client this is the "master" address and can swap the client address
    */
    function AddressProxy(address _owner, address _client) public {
        owner = _owner;
        client = _client;
        locked = false;
    }

    modifier auth() {
        require(msg.sender == owner || msg.sender == client);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier isUnlocked() {
        require(locked == false);
        _;
    }

    event ChangedOwner(address _newOwner);
    event ChangedClient(address _newClient);

    //make contract payable
    function() payable public {}

    /**
    * @param _location is the target contract address
    * @param _data is "what" you want to execute on the target contact.
    */
    function exec(address _location, bytes _data) payable external auth() isUnlocked() {
        require(_location.call.value(msg.value)(_data));
    }

    /**
    * @param _location is the target contract address
    * @param _data is "what" you want to execute on the target contract
    * @param _value how much ether should be transferred (in wei)
    * @param _gas the amount of gas in wei
    */
    function execCustom(address _location, bytes _data, uint256 _value, uint256 _gas) external auth() isUnlocked() {
        require(_location.call.value(_value).gas(_gas)(_data));
    }

    /**
    * @dev lock's down the proxy and prevent the call of "exec" by ownerAddress and recoveryAddress
    */
    function lock() external auth() {
        locked = true;
    }

    /**
    * @dev unlock's the proxy. Can only be done by recovery address
    */
    function unlock() external onlyOwner() {
        locked = false;
    }

    /**
    * @dev set new owner of proxy contract and remove the old one
    * @param _newOwner the new owner
    */
    function changeOwner(address _newOwner) external onlyOwner() {
        owner = _newOwner;
        emit ChangedOwner(owner);
    }

    /**
    * @dev Change the client address
    * @param _newClient the new client
    */
    function changeClient(address _newClient) external onlyOwner() {
        client = _newClient;
        emit ChangedClient(client);
    }

}
