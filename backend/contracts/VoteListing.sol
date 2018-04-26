import "./AnonymousVoting.sol";

pragma solidity ^0.4.21;


/**
    @title VoteListing
    @author Nikesh Nazareth
    @notice Deploys AnonymousVote contracts, and maintains a list of the deployed contract addresses
*/
contract VoteListing {
    address[] public votingContracts;

    event VoteCreated(address contractAddress);

    /**
        @notice Deploys a new AnonymousVote contract with the specified parameters
        @param _paramsHash the IPFS hash of the vote parameters
    */
    function deploy(bytes32 _paramsHash) public {
        address addr = new AnonymousVoting(_paramsHash);
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
