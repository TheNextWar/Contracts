const contract = artifacts.require("TncToken");

module.exports = function(deployer, network, accounts) {

  const name = "THE NEXT WORLD COIN";
  const symbol = "TNC";
  const totalSupply = 60000000000;

  deployer.deploy(contract, name, symbol, totalSupply, accounts[0]);
};
