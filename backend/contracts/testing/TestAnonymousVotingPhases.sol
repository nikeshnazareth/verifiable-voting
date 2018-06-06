/*
    This contract extends the AnonymousVoting contract in order to test the timing aspects.
    It introduces functions to:
    1. simulate the passage of time (by decrementing all time-related variables)
    2. Call the updatePhase modifier
 */

import "../AnonymousVoting.sol";

pragma solidity ^0.4.21;


contract TestAnonymousVotingPhases is AnonymousVoting {

    /// @notice pass all constructor parameters through to the AnonymousVoting constructor
    function TestAnonymousVotingPhases(
        uint _registrationDeadline,
        uint _votingDeadline,
        string _paramsHash,
        address _eligibilityContract,
        address _registrationAuthority
    ) AnonymousVoting(
        _registrationDeadline, _votingDeadline, _paramsHash, _eligibilityContract, _registrationAuthority
    ) public {}

    /**
        @notice Simulate the passage of time by subtracting the specified value from all time-related constants
        @param _nSeconds the number of seconds to advance time
    */
    function advanceTime(uint _nSeconds) public {
        registrationDeadline -= _nSeconds;
        votingDeadline -= _nSeconds;
    }

    /**
        Uses the "updatePhase" modifier to set the phase if necessary
    */
    function updatePhaseIfNecessary() public updatePhase {
        // no-op
    }
}
