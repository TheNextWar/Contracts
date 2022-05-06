const token = artifacts.require("TngToken");
const contract = artifacts.require("Staking");

module.exports = function (deployer, network, accounts) {

  const TNG = "";
  const lpToken = "";
  const lockTime = 0;

  deployer.deploy(contract, TNG, lpToken, lockTime);
};