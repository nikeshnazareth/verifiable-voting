import "./VotePhases.sol";

pragma solidity ^0.4.21;


/**
    @title Anonymous Voting
    @author Nikesh Nazareth
    @notice Provides the current state of a vote
    @dev A simple state machine allowing the participants to record their contributions to the vote.
    @dev Each contribution is an IPFS hash pointing to the actual content
*/
contract AnonymousVoting is VotePhases {
    /// @notice The IPFS hash of the vote parameters (chosen by the organiser at contract creation)
    string public parametersHash;

    /**
        @notice Deploys the AnonymousVoting contract and sets the vote parameters
        @notice (anything all users need to know about the vote)
        @param _registrationDeadline the time when the Registration phase ends
        @param _votingDeadline the time when the Voting phase ends
        @param _paramsHash the IPFS hash of the vote parameters
    */
    function AnonymousVoting(uint _registrationDeadline, uint _votingDeadline, string _paramsHash)
    VotePhases(_registrationDeadline, _votingDeadline) public {
        parametersHash = _paramsHash;
    }
}