const token = artifacts.require("TngToken");
const contract = artifacts.require("Distribution");

module.exports = function (deployer, network, accounts) {

  var TNG = "";
  var claimableTimestamp = [];
  var claimablePercent = [];

  deployer.deploy(contract, TNG, claimableTimestamp, claimablePercent);
};
