import "./AnonymousVoting.sol";

pragma solidity ^0.4.21;


/**
    @title VoteListing
    @author Nikesh Nazareth
    @notice Deploys AnonymousVote contracts, and maintains a list of the deployed contract addresses
*/
contract VoteListing {
    address[] public votingContracts;

    /**
        @notice Deploys a new AnonymousVote contract with the specified parameters
        @param _paramsHash the IPFS hash of the vote parameters
    */
    function deploy(bytes32 _paramsHash) public {
        votingContracts.push(new AnonymousVoting(_paramsHash));
    }

    /**
        @return the number of AnonymousVote contracts that have been deployed by this contract
    */
    function numberOfVotingContracts() public constant returns (uint) {
        return votingContracts.length;
    }
}
