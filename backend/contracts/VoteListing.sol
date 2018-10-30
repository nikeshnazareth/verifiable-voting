import "./AnonymousVoting.sol";

pragma solidity ^0.4.22;


/**
    @title VoteListing
    @author Nikesh Nazareth
    @notice Deploys AnonymousVote contracts, and maintains a list of the deployed contract addresses
*/
contract VoteListing {
    /// @notice The list of AnonymousVoting contracts deployed by this contract
    address[] public votingContracts;

    /**
        @notice An event generated whenever a new AnonymousVoting contract is deployed by this contract
        @param contractAddress the address of the new AnonymousVoting contract
    */
    event VoteCreated(address contractAddress);

    /**
        @notice Deploys a new AnonymousVote contract with the specified parameters
        @param _registrationDeadline the time when the Registration phase ends
        @param _votingDeadline the time when the Voting phase ends
        @param _paramsHash the IPFS hash of the vote parameters
        @param _eligibilityContract the contract that determines if an address is eligible to vote
        @param _registrationAuthority the address that can publish the blinded signatures
    */
    function deploy(
        uint _registrationDeadline,
        uint _votingDeadline,
        string _paramsHash,
        address _eligibilityContract,
        address _registrationAuthority
    ) external {
        address addr = new AnonymousVoting(
            _registrationDeadline, _votingDeadline, _paramsHash, _eligibilityContract, _registrationAuthority
        );
        votingContracts.push(addr);
        emit VoteCreated(addr);
    }

    /**
        @return the number of AnonymousVote contracts that have been deployed by this contract
    */
    function numberOfVotingContracts() public view returns (uint) {
        return votingContracts.length;
    }
}
