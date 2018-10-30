import "./Gatekeeper.sol";

pragma solidity ^0.4.22;


/**
    @title No Restriction
    @author Nikesh Nazareth
    @notice A gatekeeper contract that authorises all addresses
*/
contract NoRestriction is Gatekeeper {

    /// @return authorised true (there are no restrictions)
    function isAuthorised(address) external view returns (bool authorised) {
        return true;
    }
}
