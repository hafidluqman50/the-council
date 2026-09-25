// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {IIdentityRegistry} from "../src/interfaces/IIdentityRegistry.sol";

contract RegisterCouncilAgents is Script {
    address constant IDENTITY_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    struct AgentDefinition {
        string key;
        string name;
        string mandate;
    }

    function run() external {
        AgentDefinition[5] memory agents = [
            AgentDefinition("orc", "The Orchestrator", "Set speaking order, close each round, write the verdict."),
            AgentDefinition("m1", "Market Analyst alpha", "Demand - is there real, sized demand on-chain for this."),
            AgentDefinition(
                "m2", "Market Analyst beta", "Token economics and pricing - does the model hold, will anyone pay."
            ),
            AgentDefinition(
                "m3", "Market Analyst gamma", "Distribution and GTM - how does this reach users in this ecosystem."
            ),
            AgentDefinition(
                "tech", "Tech Validator", "Is the on-chain architecture buildable, at what cost and what timeline."
            )
        ];

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        IIdentityRegistry identityRegistry = IIdentityRegistry(IDENTITY_REGISTRY);

        vm.startBroadcast(deployerPrivateKey);
        for (uint256 i = 0; i < agents.length; i++) {
            IIdentityRegistry.MetadataEntry[] memory metadata = new IIdentityRegistry.MetadataEntry[](2);
            metadata[0] = IIdentityRegistry.MetadataEntry({metadataKey: "name", metadataValue: bytes(agents[i].name)});
            metadata[1] =
                IIdentityRegistry.MetadataEntry({metadataKey: "mandate", metadataValue: bytes(agents[i].mandate)});

            uint256 agentId = identityRegistry.register("", metadata);
            console2.log("Registered agent", agents[i].key);
            console2.log("agentId", agentId);
        }
        vm.stopBroadcast();
    }
}
