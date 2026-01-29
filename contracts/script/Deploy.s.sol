// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {SketchNFT} from "../src/SketchNFT.sol";

contract DeployScript is Script {
    function run() external returns (SketchNFT) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory gateway = "https://indexer-storage-testnet-turbo.0g.ai/file";

        vm.startBroadcast(deployerPrivateKey);

        SketchNFT nft = new SketchNFT(gateway);

        vm.stopBroadcast();

        return nft;
    }
}
