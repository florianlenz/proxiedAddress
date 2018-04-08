pragma solidity ^0.4.17;

contract AddressProxy {

    address public ownerAddress;
    address public recoveryAddress;
    bool public locked;

    modifier unlocked() {
        require(locked == false);
        _;
    }

    modifier auth() {
        require(msg.sender == ownerAddress || msg.sender == recoveryAddress);
        _;
    }

    modifier onlyRecovery() {
        require(msg.sender == recoveryAddress);
        _;
    }

    /**
    * @param _ownerAddress the address that "own" the proxy and interact with it most of the time
    * @param _recoveryAddress this is the "master" address and can swap the owner address
    */
    function AddressProxy(address _ownerAddress, address _recoveryAddress) public {
        ownerAddress = _ownerAddress;
        recoveryAddress = _recoveryAddress;
        locked = false;
    }

    /**
    * @param _location is the target contract address
    * @param _data is "what" you want to execute on the target contact.
    */
    function exec(address _location, bytes _data) payable external auth() unlocked() returns(bool) {
        require(_location.call.value(msg.value)(_data));
        return true;
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
    function unlock() external onlyRecovery() {
        locked = false;
    }

    /**
    * @dev set new owner of proxy contract and remove the old one
    * @param _newOwnerAddress new owner address
    */
    function changeOwner(address _newOwnerAddress) external onlyRecovery() {
        ownerAddress = _newOwnerAddress;
    }

    /**
    * @dev Change the recovery address
    * @param _recoveryAddress the new recovery address for this proxy
    */
    function changeRecovery(address _recoveryAddress) external onlyRecovery() {
        recoveryAddress = _recoveryAddress;
    }

}
