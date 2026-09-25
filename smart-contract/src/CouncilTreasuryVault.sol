// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CouncilTreasuryVault is Ownable {
    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function withdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
        emit Withdrawn(token, owner(), amount);
    }

    function balanceOf(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
