import "./AnonymousVoting.sol";

pragma solidity ^0.4.21;


contract VoteListing {
    address[] public votingContracts;

    function deploy(bytes32 _paramsHash) public {
        votingContracts.push(new AnonymousVoting(_paramsHash));
    }

    function numberOfVotingContracts() public constant returns (uint) {
        return votingContracts.length;
    }
}
