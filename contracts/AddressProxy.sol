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

    function AddressProxy(address _ownerAddress, address _recoveryAddress) public {
        ownerAddress = _ownerAddress;
        recoveryAddress = _recoveryAddress;
        locked = false;
    }

    function exec(address location, bytes data) payable external auth() unlocked() returns(bool) {
        require(location.call.value(msg.value)(data));
        return true;
    }

    function lock() external auth() {
        locked = true;
    }

    function unlock() external onlyRecovery() {
        locked = false;
    }

    function changeOwner(address _newOwnerAddress) external onlyRecovery() {
        ownerAddress = _newOwnerAddress;
    }

    function changeRecovery(address _recoveryAddress) external onlyRecovery() {
        recoveryAddress = _recoveryAddress;
    }

}
