const TngToken = artifacts.require("TngToken");
const TncToken = artifacts.require("TncToken");
const Staking = artifacts.require("Staking");
const Distribution = artifacts.require("Distribution");

module.exports = function (deployer, network, accounts) {

	const totalSupply = 1000000000;
	var claimableTimestamp = [1650881560, 1650881561, 1650881562, 1650881563];
	var claimablePercent = [10000, 20000, 30000, 40000];

	deployer.then(async () => {
        
		await deployer.deploy(TngToken, "THE NEXT WAR GEM", "TNG", totalSupply, accounts[0]);
		await deployer.deploy(TncToken, "THE NEXT WAR COIN", "TNC", totalSupply, accounts[0]);
        await deployer.deploy(Staking, TngToken.address, TngToken.address, 0);
		await deployer.deploy(Distribution, TngToken.address, claimableTimestamp, claimablePercent);
		
	});
};