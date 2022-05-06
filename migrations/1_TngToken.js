const contract = artifacts.require("TngToken");

module.exports = function(deployer, network, accounts) {

  const name = "THE NEXT WAR GEM";
  const symbol = "TNG";
  const totalSupply = 5000000000;

  deployer.deploy(contract, name, symbol, totalSupply, accounts[0]);
};
