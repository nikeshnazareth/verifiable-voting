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

    /// @notice A mapping from anonymous addresses to an IPFS hash of their vote
    mapping(address => string) public voteHashes;

    /**
        @notice An event generated whenever a voter successfully calls the "register" function
        @param voter the public address of the authorised voter
        @param blindedAddressHash the IPFS hash of the blinded address
    */
    event VoterInitiatedRegistration(address voter, string blindedAddressHash);

    /**
        @notice An event genenerated whenever the registration authority publishes a blinded signature
        @param voter the public address of the registered voter
        @param signatureHash the IPFS hash of the blind signature
    */
    event RegistrationComplete(address voter, string signatureHash);

    /**
        @notice An event generated whenever someone votes
        @param voter the anonymous address of the voter
        @param voteHash the IPFS hash of the vote and proof of registration
    */
    event VoteSubmitted(address voter, string voteHash);

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

        emit VoterInitiatedRegistration(msg.sender, _blindedAddressHash);
    }

    /**
        @notice Completes registration for the specified voter by recording the blinded signature
        @notice Can only be called from the Registration Authority account
        @param _voter the public address of the registered voter
        @param _signatureHash the IPFS hash of the voter's signed blinded address
    */
    function completeRegistration(address _voter, string _signatureHash) public {
        // the sender is authorised to publish blinded signatures
        require(msg.sender == registrationAuthority);
        // the voter has initiated registration
        require(bytes(blindedAddress[_voter].addressHash).length > 0);
        // the blinded signature has not already been published
        require(bytes(blindedAddress[_voter].signatureHash).length == 0);

        blindedAddress[_voter].signatureHash = _signatureHash;
        assert(pendingRegistrations > 0);
        pendingRegistrations = pendingRegistrations - 1;

        emit RegistrationComplete(_voter, _signatureHash);
    }

    /**
        @notice Submit an anonymous vote
        @notice Note that this function does not validate the votes - each observer must do that independently
        @param _voteHash the IPFS hash of the vote (along with proof of registration)
    */
    function vote(string _voteHash) public
    updatePhase
    duringPhase(Phase.Voting) {
        // the Registration Authority has completed all registrations
        require(pendingRegistrations == 0);
        // the voter has not yet voted
        require(bytes(voteHashes[msg.sender]).length == 0);

        voteHashes[msg.sender] = _voteHash;

        emit VoteSubmitted(msg.sender, _voteHash);
    }
}