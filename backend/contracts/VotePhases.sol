pragma solidity ^0.4.22;


/**
    @title VotePhases
    @author Nikesh Nazareth
    @notice A contract to encapsulate vote phases and timing logic
    @dev A base class with phases and timed-transition modifiers to implement a temporal state machine
*/
contract VotePhases {
    enum Phase {
        Registration,
        Voting,
        Complete
    }

    /// @notice The current phase of the contract
    Phase public currentPhase;

    /// @notice The time when the Registration phase ends
    uint public registrationDeadline;

    /// @notice The time when the Voting phase ends
    uint public votingDeadline;

    /**
        @notice An event generated whenever the phase is updated
        @param phase the new phase
    */
    event NewPhase(Phase phase);

    /// @notice Modifier to update the phase (when appropriate) before calling the function
    modifier updatePhase() {
        if (currentPhase != Phase.Complete && now > votingDeadline) {
            currentPhase = Phase.Complete;
            emit NewPhase(currentPhase);
        } else if (currentPhase < Phase.Voting && now > registrationDeadline) {
            currentPhase = Phase.Voting;
            emit NewPhase(currentPhase);
        }
        _;
    }

    /**
        @notice Prevent the function from being called outside the specified phase
        @param _phase the required Phase
    */
    modifier duringPhase(Phase _phase) {
        require(currentPhase == _phase);
        _;
    }

    /**
        @notice Initialises the phase timings
        @notice Ensures that the phases are ordered correctly
        @param _registrationDeadline the time when the Registration phase ends
        @param _votingDeadline the time when the Voting phase ends
    */
    constructor(uint _registrationDeadline, uint _votingDeadline) public {
        require(_registrationDeadline > now);
        require(_votingDeadline > _registrationDeadline);

        currentPhase = Phase.Registration;
        registrationDeadline = _registrationDeadline;
        votingDeadline = _votingDeadline;
    }
}
