pragma solidity ^0.4.21;


/**
    @title Gatekeeper
    @author Nikesh Nazareth
    @notice An interface for Gatekeeper contracts that decide whether a particular address is authorised
    @notice (using any criteria defined in the derived contract)
*/
interface Gatekeeper {

    /**
        @param account The account to validate
        @return isAuthorised A boolean indicating whether the specified account is authorised
    */
    function isAuthorised(address account) external view returns (bool authorised);
}
