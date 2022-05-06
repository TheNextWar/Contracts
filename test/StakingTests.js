const Token = artifacts.require("TngToken");
const Staking = artifacts.require("Staking");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */

var tokenInstance;
var instance;
var approveAmount = toWei(1000000);

var depositAmount1 = 2000;
var depositAmount2 = 5000;
var depositAmount3 = 10000;
var totalDepositAmount = depositAmount1 + depositAmount2 + depositAmount3;

contract("Staking", function (accounts) {

	beforeEach(async () => {
		tokenInstance = await Token.deployed();
		instance = await Staking.deployed();

		// Reset lockTime
		var lockTime = await instance.lockTime();
		if(lockTime.toNumber() != 0)
			await instance.setLockTime(0);

		// Withdraw all staking 
		var stakeRecords = (await instance.userInfo(accounts[0])).stakeRecords;
		for (let i = 0; i < stakeRecords; i++) {
			var stakeInfo = await instance.userStakeInfo(i, accounts[0]);
			if(stakeInfo.amount > 0) {
				await tokenInstance.transfer(instance.address, toWei(1000000));
				await withdraw(i);
			}
		}
	});

	it("should return true when compare tng token address and tng address in contract", async function () {

		var tokenAddress = await tokenInstance.address;
		var tngToken = await instance.tngToken();
		assert.equal(tokenAddress.toString(), tngToken.toString());
	});

	it("should show correct updated TngPerSeconds", async function () {

		var previousTngPerSecond = await instance.tngPerSecond();
		var newValue = toBN(previousTngPerSecond).mul(toBN(2));
		var result = await instance.setTngPerSecond(newValue);
		assert.isTrue(result.receipt.status);

		var newTngPerSecond = await instance.tngPerSecond();
		assert.equal(newTngPerSecond.toString(), newValue.toString());
	});

	it("should show correct updated lockTime", async function () {
		var newValue = 1;
		var result = await instance.setLockTime(newValue);
		assert.isTrue(result.receipt.status);

		var newLockTime = await instance.lockTime();
		assert.equal(newValue.toString(), newLockTime.toString());
	});

	it("should return error if deposit before approve", async function () {
		var result = await deposit(depositAmount1);

		assert.isFalse(result);
	});

	it("should return allowance after approve", async function () {
		await tokenInstance.approve(instance.address, approveAmount);

		var result = await tokenInstance.allowance(accounts[0], instance.address);
		assert.equal(result.toString(), approveAmount.toString());
	});

	it("should return error when harvest without any staked", async function () {
		var result = await harvest();

		assert.isFalse(result);
	});

	it("should return correct userInfo totalAmount if staked multiple times successfully", async function () {
		// Set locktime to 0
		var result = await instance.setLockTime(0);
		assert.isTrue(result.receipt.status);

		// approve
		var approveResult = await tokenInstance.approve(instance.address, approveAmount, {from : accounts[0]});
		assert.isTrue(approveResult.receipt.status);

		await deposit(depositAmount1);
		await deposit(depositAmount2);
		await deposit(depositAmount3);

		// check contract token balance matched with deposit amount
		var contractBalance = await tokenInstance.balanceOf(instance.address);
		assert.equal(toWei(totalDepositAmount).toString(), contractBalance.toString());

		// check userInfo totalAmount vs total deposited amount
		var userInfo = await instance.userInfo(accounts[0]);
		assert.equal(toWei(totalDepositAmount).toString(), userInfo.totalAmount.toString());
	});

	it("should return correct total userStakeInfo amount", async function () {
		await deposit(depositAmount1);
		await deposit(depositAmount2);
		await deposit(depositAmount3);

		var stakeRecords = (await instance.userInfo(accounts[0])).stakeRecords;
		var totalStaked = 0;

		for (let i = 0; i < stakeRecords; i++) {
			stakeInfo = await instance.userStakeInfo(i, accounts[0]);
			totalStaked = toBN(totalStaked).add(toBN(stakeInfo.amount));
		}

		assert.equal(toWei(totalDepositAmount).toString(), totalStaked.toString());
	});

	it("should return true if rewards harvested successfully", async function () {
		await deposit(depositAmount1);
		await timeout(2000);

		var result = await harvest();
		assert.isTrue(result);
	});

	it("should return error if withdraw from a not exist stake pool", async function () {

		var stakeRecords = (await instance.userInfo(accounts[0])).stakeRecords;
		var result = await withdraw(stakeRecords);

		assert.isFalse(result);
	});

	it("should return true if withdraw successfully", async function () {
		// Stake and wait for 2 seconds
		await deposit(depositAmount1);
		await timeout(2000);

		// Get latest stake index after deposit
		var userInfo = await instance.userInfo(accounts[0]);
		var latestStakeIndex = userInfo.stakeRecords.toNumber() - 1;

		// Withdraw from the latest stake index
		await withdraw(latestStakeIndex);

		var stakeInfo = await instance.userStakeInfo(latestStakeIndex, accounts[0]);
		assert.equal(stakeInfo.amount.toString(), "0");
		assert.isTrue(stakeInfo.unstakedTime > 0);

	});

	it("should return error if withdraw multiple times on same SID", async function () {
		// Deposit
		await deposit(depositAmount1);
			
		// Get latest stake index after deposit
		var userInfo = await instance.userInfo(accounts[0]);
		var latestStakeIndex = userInfo.stakeRecords.toNumber() - 1;

		// Withdraw twice with same index
		await withdraw(latestStakeIndex);
		var result = await withdraw(latestStakeIndex);


		assert.isFalse(result);
	});

	it("should return correct userStakeInfo amount and userInfo totalAmount after withdraw", async function () {

		var stakeRecords = (await instance.userInfo(accounts[0])).stakeRecords;
		var totalStaked = 0;

		for (let i = 0; i < stakeRecords; i++) {
			stakeInfo = await instance.userStakeInfo(i, accounts[0]);
			totalStaked = toBN(totalStaked).add(toBN(stakeInfo.amount));
		}

		var totalAmount = (await instance.userInfo(accounts[0])).totalAmount;

		assert.equal(totalAmount.toString(), totalStaked.toString());

	});

	it("should return error if withdraw before unlock", async function () {

		// set lockTime
		var lockTimeResult = await instance.setLockTime(5);
		assert.isTrue(lockTimeResult.receipt.status);

		// Make a deposit after set lockTime. 
		await deposit(depositAmount1);

		// Get stakeRecords size
		var stakeRecords = (await instance.userInfo(accounts[0])).stakeRecords;

		// Withdraw from stakeRecords -1, as array start from 0
		var result = await withdraw(stakeRecords - 1);
		await timeout(5000); // wait 5seconds here to let unlock time pass, and clear the deposit records

		assert.isFalse(result);
	});

	it("should return correct rewards amount", async function () {
		// Get initial token balance for calculation
		var initialBalance = await tokenInstance.balanceOf(accounts[0]);
		var tngPerSeconds = toWei(1);

		await instance.setTngPerSecond(tngPerSeconds);	//Set rewards to 1TNG per seconds
		await deposit(depositAmount1);
		await timeout(5000);	//Wait for 5seconds to accumulate rewards

		// Get latest stake index after deposit
		var userInfo = await instance.userInfo(accounts[0]);
		var latestStakeIndex = userInfo.stakeRecords.toNumber() - 1;

		// withdraw with the latestStakeIndex
		await withdraw(latestStakeIndex);	

		var userInfo = await instance.userStakeInfo(latestStakeIndex, accounts[0]);
		var stakedTime = userInfo.stakedTime.toNumber();
		var unstakedTime = userInfo.unstakedTime.toNumber();
		var timeDiff = unstakedTime - stakedTime;
		var currentBalance = await tokenInstance.balanceOf(accounts[0]);
		var earnedRewards = toBN(currentBalance).sub(toBN(initialBalance));

		assert.equal((toBN(timeDiff).mul(tngPerSeconds)).toString(), earnedRewards.toString());
	});

});

async function deposit(amount) {

	try {
		var result = await instance.deposit(toWei(amount));
		assert.isTrue(result.receipt.status);

	} catch(Exception) {
		return false;
	}

	return true;
}

async function withdraw(sid) {

	try {
		var result = await instance.withdraw(sid);
		assert.isTrue(result.receipt.status);

	} catch(Exception) {
		return false;
	}

	return true;
}

async function harvest() {

	try {
		var result = await instance.harvest();
		assert.isTrue(result.receipt.status);
		
	} catch(Exception) {
		return false;
	}

	return true;
}

function toWei(count) {
	return web3.utils.toWei(toBN(count));
}

function toBN(value) {
	return web3.utils.toBN(value);
}

function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
