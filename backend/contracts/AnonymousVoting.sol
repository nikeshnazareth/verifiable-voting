pragma solidity ^0.4.21;


contract AnonymousVoting {
    bytes32 public parametersHash;

    function AnonymousVoting(bytes32 _paramsHash) public {
        parametersHash = _paramsHash;
    }
}
