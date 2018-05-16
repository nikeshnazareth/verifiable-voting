import "./VotePhases.sol";
import "./Gatekeeper.sol";

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

    /// @notice The Gatekeeper contract address that determines if an address is eligible to vote
    Gatekeeper public eligibilityContract;

    /// @notice The address that can publish the blinded signatures
    address public registrationAuthority;

    /**
        @notice Deploys the AnonymousVoting contract and sets the vote parameters
        @notice (anything all users need to know about the vote)
        @param _registrationDeadline the time when the Registration phase ends
        @param _votingDeadline the time when the Voting phase ends
        @param _paramsHash the IPFS hash of the vote parameters
        @param _eligibilityContract the contract that determines if an address is eligible to vote
        @param _registrationAuthority the address that can publish the blinded signatures
    */
    function AnonymousVoting(
        uint _registrationDeadline,
        uint _votingDeadline,
        string _paramsHash,
        address _eligibilityContract,
        address _registrationAuthority
    ) VotePhases(_registrationDeadline, _votingDeadline) public {
        parametersHash = _paramsHash;
        eligibilityContract = Gatekeeper(_eligibilityContract);
        registrationAuthority = _registrationAuthority;
    }
}