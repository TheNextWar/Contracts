const TngToken = artifacts.require("TngToken");
const TncToken = artifacts.require("TncToken");
const Staking = artifacts.require("Staking");
const Distribution = artifacts.require("Distribution");

module.exports = function (deployer, network, accounts) {

	const totalSupply = ;
	var claimableTimestamp = [];
	var claimablePercent = [];

	deployer.then(async () => {
        
		await deployer.deploy(TngToken, "THE NEXT WAR GEM", "TNG", totalSupply, accounts[0]);
		await deployer.deploy(TncToken, "THE NEXT WAR COIN", "TNC", totalSupply, accounts[0]);
        await deployer.deploy(Staking, TngToken.address, TngToken.address, 0);
		await deployer.deploy(Distribution, TngToken.address, claimableTimestamp, claimablePercent);
		
	});
};