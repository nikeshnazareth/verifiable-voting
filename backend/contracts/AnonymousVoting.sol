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

    /// @notice The number of addresses that are waiting for the Registration Authority to process their request
    uint public pendingRegistrations;

    /**
        @notice A mapping from an authorised voter address to their blinded anonymous address
        @notice The blinded address is a struct with two IPFS hashes corresponding to the two components:
        @notice 1. the blinded anonymous address
        @notice 2. the registration authority's signature of the blinded anonymous address
    */
    mapping(address => BlindedAddress) public blindedAddress;

    struct BlindedAddress {
        string addressHash;
        string signatureHash;
    }

    /**
        @notice An event generated whenever a voter successfully calls the "register" function
        @param voter the address of the authorised voter
    */
    event VoterInitiatedRegistration(address voter);

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

    /**
        @notice Confirms the sender is eligible to vote and records their blinded anonymous address
        @param _blindedAddressHash the IPFS hash of the sender's blinded anonymous address
    */
    function register(string _blindedAddressHash) public
    updatePhase
    duringPhase(Phase.Registration) {
        // the sender has not yet registered
        require(bytes(blindedAddress[msg.sender].addressHash).length == 0);
        // the sender is eligible to vote
        require(eligibilityContract.isAuthorised(msg.sender));

        blindedAddress[msg.sender].addressHash = _blindedAddressHash;
        pendingRegistrations = pendingRegistrations + 1;
        // overflow protection for correctness but unnecessary in practice
        assert(pendingRegistrations > 0);

        emit VoterInitiatedRegistration(msg.sender);
    }
}