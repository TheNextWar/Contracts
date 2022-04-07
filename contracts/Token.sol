// SPDX-License-Identifier: unlicensed

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(uint256 initialSupply) ERC20("THE NEXT WAR GEM", "TNG") {
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }
}