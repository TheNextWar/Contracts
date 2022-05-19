const token = artifacts.require("TngToken");
const contract = artifacts.require("Distribution");

module.exports = function (deployer, network, accounts) {

  const TNG = "0x545E0b790ec23FA475bB9CD44D4e00d390a46886";

  var claimableTimestamp = 
  [1650881560, 1650881561, 1650881562, 1650881563,1650881564,1650881565,1650881566,1650881567,1650881568,1650881569];
  var claimablePercent = 
  [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

  deployer.deploy(contract, TNG, claimableTimestamp, claimablePercent);
};
