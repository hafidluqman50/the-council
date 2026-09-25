// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IIdentityRegistry {
    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);

    function register(string calldata agentURI, MetadataEntry[] calldata metadata)
        external
        returns (uint256 agentId);

    function register(string calldata agentURI) external returns (uint256 agentId);

    function register() external returns (uint256 agentId);
}
