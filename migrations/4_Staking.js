const token = artifacts.require("TngToken");
const contract = artifacts.require("Staking");

module.exports = function (deployer, network, accounts) {

  const TNG = "0xa44017DeCa03131d23F47BD2Bfd178B1d057FA01";
  const lpToken = "0xa44017DeCa03131d23F47BD2Bfd178B1d057FA01";
  const lockTime = 0;

  deployer.deploy(contract, TNG, lpToken, lockTime);
};