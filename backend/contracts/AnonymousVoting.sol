pragma solidity ^0.4.21;


/**
    @title Anonymous Voting
    @author Nikesh Nazareth
    @notice Provides the current state of a vote
    @dev A simple state machine allowing the participants to record their contributions to the vote.
    @dev Each contribution is an IPFS hash pointing to the actual content
*/
contract AnonymousVoting {
    bytes32 public parametersHash;

    /**
        @notice Deploys the AnonymousVoting contract and sets the vote parameters
        @notice (anything all users need to know about the vote)
        @param _paramsHash the IPFS hash of the vote parameters
    */
    function AnonymousVoting(bytes32 _paramsHash) public {
        parametersHash = _paramsHash;
    }
}