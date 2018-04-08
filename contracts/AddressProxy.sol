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

    function () external payable {

    }

    function exec(address location, bytes data) external auth() unlocked() returns(bool) {
        require(location.call(data));
        return true;
    }

    function lock() external auth() {
        locked = true;
    }

    function unlock() external onlyRecovery() {
        locked = false;
    }

    function changeUser(address _newOwnerAddress) external onlyRecovery() {
        ownerAddress = _newOwnerAddress;
    }

    function changeRecoveryAddressAndUnlock(address _newRecoveryAddress) external onlyRecovery() {
        recoveryAddress = _newRecoveryAddress;
    }

}
