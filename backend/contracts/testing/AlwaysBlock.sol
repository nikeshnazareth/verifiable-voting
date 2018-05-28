import "../Gatekeeper.sol";

pragma solidity ^0.4.21;


/**
    @title Always Block
    @author Nikesh Nazareth
    @notice A gatekeeper contract that blocks all addresses
*/
contract AlwaysBlock is Gatekeeper {

    /// @return authorised false
    function isAuthorised(address) external view returns (bool authorised) {
        return false;
    }
}
