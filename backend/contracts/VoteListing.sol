import "./AnonymousVoting.sol";

pragma solidity ^0.4.21;


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
        @param _registrationExpiration the time when the Registration phase ends
        @param _votingExpiration the time when the Voting phase ends
        @param _paramsHash the IPFS hash of the vote parameters
    */
    function deploy(uint _registrationExpiration, uint _votingExpiration, string _paramsHash) public {
        address addr = new AnonymousVoting(_registrationExpiration, _votingExpiration, _paramsHash);
        votingContracts.push(addr);
        emit VoteCreated(addr);
    }

    /**
        @return the number of AnonymousVote contracts that have been deployed by this contract
    */
    function numberOfVotingContracts() public constant returns (uint) {
        return votingContracts.length;
    }
}
