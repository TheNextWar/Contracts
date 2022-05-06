const { BN, ether, expectEvent, expectRevert, time } = require('openzeppelin-test-helpers');
const { default: accounts } = require("@openzeppelin/cli/lib/scripts/accounts");

const Token = artifacts.require("TngToken");
const Distribution = artifacts.require("Distribution");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */

var tokenInstance;
var instance;

contract("Distribution", function (accounts) {

    const defaultAccountList = [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]];
    const defaultAllocationList = [toWei(1000), toWei(2000), toWei(3000), toWei(4000), toWei(5000)];
    const defaultPercentList = [10000, 20000, 30000, 40000];

	beforeEach(async () => {
		tokenInstance = await Token.deployed();
		instance = await Distribution.deployed();

        // DeRegister
        var accountInfo = await instance.accounts(accounts[0]);
        if(accountInfo.tokenAllocation > 0) {
            var result = await instance.deRegister(defaultAccountList);
		    assert.isTrue(result.receipt.status);
        }
	});

	it("should return true when compare tng token address and tng address in contract", async function () {

		var tokenAddress = await tokenInstance.address;
		var tngToken = await instance.tngToken();
		assert.equal(tokenAddress.toString(), tngToken.toString());
	});

    // All tests for function register(address[] memory account, uint256[] memory tokenAllocation)

    it("should return error if register with empty array", async function () {
        var accounts = [];
        var allocations = [];

		var result = await register(accounts, allocations);
        assert.isFalse(result);
	});

    it("should return error when register with different array size", async function () {
        var accounts = [1];
        var allocations = [1,2,3];

		var result = await register(accounts, allocations);
        assert.isFalse(result);
	});

    it("should return true when register successfully", async function () {
        var result = await register(defaultAccountList, defaultAllocationList);
        assert.isTrue(result);
	});

    it("should return true when registered accounts tally with totalParticipants", async function () {
        await register(defaultAccountList, defaultAllocationList);

        var totalParticipants = await instance.totalParticipants();
        assert.equal(defaultAccountList.length, totalParticipants);
	});

    it("should return true when registered tokenAllocations tally with totalPendingVestingToken", async function () {
        await register(defaultAccountList, defaultAllocationList);

        var totalAllocation = toBN(0);
        for(let i=0; i<defaultAllocationList.length; i++) {
            totalAllocation = totalAllocation.add(toBN(defaultAllocationList[i]));
        }

        var totalPendingVestingToken = await instance.totalPendingVestingToken();
        assert.equal(totalAllocation.toString(), totalPendingVestingToken.toString());
	});

    // setClaimable
    it("should return error if setClaimable with empty array", async function () {
        var arr = [];

		var result = await setClaimable(arr, arr);
        assert.isFalse(result);
	});

    it("should return error when setClaimable with different array size", async function () {
        var arr1 = [1];
        var arr2 = [1,2,3];

		var result = await setClaimable(arr1, arr2);
        assert.isFalse(result);
	});

    it("should return true if setClaimable successfully", async function () {
        var now = await time.latest();
        var epoch = now.toNumber();
  
        var timestampList = [epoch, epoch+1, epoch+2, epoch+3];
        var result = await setClaimable(timestampList, defaultPercentList);
        assert.isTrue(result);

        for(let i=0; i<timestampList.length; i++) {
            var claimableTimestamp = await instance.claimableTimestamp(i);

            // compare timestamp
            assert.equal(timestampList[i], claimableTimestamp);

            // compare percent
            var claimablePercent = await instance.claimablePercent(claimableTimestamp);
            assert.equal(defaultPercentList[i], claimablePercent);
        }
	});

    // getClaimableAmount
    it("should return zero claimable amount when not registered", async function () {
		var result = await instance.getClaimableAmount(accounts[0]);
        assert.equal(result.toString(), "0");
	});

    it("should return zero claimable amount when its not time to claim", async function () {
        var now = await time.latest();
        var epoch = now.toNumber();
        var timestampList = [epoch+60, epoch+120, epoch+180, epoch+240];

        // Set claimable time and percent
        await setClaimable(timestampList, defaultPercentList);
        // register
        await register(defaultAccountList, defaultAllocationList);
        
		var result = await instance.getClaimableAmount(accounts[0]);
        assert.equal(result.toString(), "0");
	});

    it("should return correct claimable amount", async function () {
        var now = await time.latest();
        var epoch = now.toNumber();
        var timestampList = [epoch, epoch+30, epoch+60, epoch+90];

        // Set claimable time and percent
        await setClaimable(timestampList, defaultPercentList);
        // register
        await register(defaultAccountList, defaultAllocationList);
        
        var accountInfo = await instance.accounts(accounts[0]);
        var tokenAllocation = accountInfo.tokenAllocation;
        var denom = await instance.DENOM();
        var claimablePercent = await instance.getClaimablePercent();

        // Get claimableAmount
        var result = await instance.getClaimableAmount(accounts[0]);
        var allocationPercent = tokenAllocation.mul(claimablePercent[0]).div(denom);

        assert.equal(allocationPercent.toString(), result.toString());
	});

    // Claim
    it("should return error if claim and account is not registered", async function () {

		var result = await claim();
        assert.isFalse(result);
	});

    // Claim
    it("should return error if claim and contract dont have sufficient token", async function () {
        var now = await time.latest();
        var epoch = now.toNumber();
        var timestampList = [epoch, epoch+30, epoch+60, epoch+90];

        // Set claimable time and percent
        await setClaimable(timestampList, defaultPercentList);
        // register
        await register(defaultAccountList, defaultAllocationList);

		var result = await claim();
        assert.isFalse(result);
	});

    it("should return correct claimed amount", async function () {
        var now = await time.latest();
        var epoch = now.toNumber();
        var timestampList = [epoch, epoch+30, epoch+60, epoch+90];

        // Set claimable time and percent
        await setClaimable(timestampList, defaultPercentList);
        // register
        await register(defaultAccountList, defaultAllocationList);
        
        var denom = await instance.DENOM();
        var claimablePercent = await instance.getClaimablePercent();
        

        // Transfer token into the contract before claim
        var result = await tokenInstance.transfer(instance.address, toWei(1000000));
        assert.isTrue(result.receipt.status);

        for(let i=0; i<defaultAccountList.length; i++) {
            // init
            var accountInfo = await instance.accounts(accounts[i]);
            // console.log("accounts[i]", accounts[i]);
            // console.log("accountInfo.claimIndex", accountInfo.claimIndex.toString());
            // console.log("accountInfo.tokenAllocation", accountInfo.tokenAllocation.toString());
            // console.log("accountInfo.pendingTokenAllocation", accountInfo.pendingTokenAllocation.toString());
            var tokenAllocation = accountInfo.tokenAllocation;
            var allocationPercent = tokenAllocation.mul(claimablePercent[0]).div(denom);

            // Get before claim token balance
            var initialBalance = await tokenInstance.balanceOf(accounts[i]);

            // Claim
            var result = await instance.claim({from: accounts[i]});
            assert.isTrue(result.receipt.status);

            // Get after claim token balance
            var currentBalance = await tokenInstance.balanceOf(accounts[i]);
            var diff = toBN(currentBalance).sub(toBN(initialBalance));
            assert.equal(allocationPercent.toString(), diff.toString());
        }
	});

    it("should return correct claimed amount, for every rounds", async function () {
        var now = await time.latest();
        var epoch = now.toNumber();
        var timestampList = [epoch, epoch+10, epoch+20, epoch+30];

        // Set claimable time and percent
        await setClaimable(timestampList, defaultPercentList);
        // register
        await register(defaultAccountList, defaultAllocationList);
        
        var denom = await instance.DENOM();
        var claimablePercent = await instance.getClaimablePercent();
        

        // Transfer token into the contract before claim
        var result = await tokenInstance.transfer(instance.address, toWei(1000000));
        assert.isTrue(result.receipt.status);

        for(let i=0; i<timestampList.length; i++) {
            // init
            var accountInfo = await instance.accounts(accounts[0]);
            // console.log("accounts[i]", accounts[i]);
            // console.log("accountInfo.claimIndex", accountInfo.claimIndex.toString());
            // console.log("accountInfo.tokenAllocation", accountInfo.tokenAllocation.toString());
            // console.log("accountInfo.pendingTokenAllocation", accountInfo.pendingTokenAllocation.toString());

            var tokenAllocation = accountInfo.tokenAllocation;
            var allocationPercent = tokenAllocation.mul(claimablePercent[i]).div(denom);

            // Get before claim token balance
            var initialBalance = await tokenInstance.balanceOf(accounts[0]);

            // Claim
            var result = await instance.claim({from: accounts[0]});
            assert.isTrue(result.receipt.status);

            // Get after claim token balance
            var currentBalance = await tokenInstance.balanceOf(accounts[0]);
            var diff = toBN(currentBalance).sub(toBN(initialBalance));
            assert.equal(allocationPercent.toString(), diff.toString());
            
            // set timeout and wait for next claimable rounds
            await timeout(10000);
        }
	});

    it("should return true when all tokens claimed", async function () {
        var now = await time.latest();
        var epoch = now.toNumber();
        var timestampList = [1651055626, 1651055627, 1651055628, 1651055629];

        // Set claimable time and percent
        await setClaimable(timestampList, defaultPercentList);
        // register
        await register(defaultAccountList, defaultAllocationList);

        // Transfer token into the contract before claim
        var result = await tokenInstance.transfer(instance.address, toWei(1000000));
        assert.isTrue(result.receipt.status);

        for(let i=0; i<defaultAccountList.length; i++) {
            // accounts info should not be zero before claim
            var accountInfo = await instance.accounts(accounts[i]);
            // console.log("accounts[i]", accounts[i]);
            // console.log("accountInfo.claimIndex", accountInfo.claimIndex.toString());
            // console.log("accountInfo.tokenAllocation", accountInfo.tokenAllocation.toString());
            // console.log("accountInfo.pendingTokenAllocation", accountInfo.pendingTokenAllocation.toString());
            
            assert.isTrue(accountInfo.tokenAllocation > toBN(0));
            assert.isTrue(accountInfo.pendingTokenAllocation > toBN(0));
            assert.equal(accountInfo.claimIndex.toString(), "0");
            assert.equal(accountInfo.claimedTimestamp.toString(), "0");

            // First claim should pass and return true
            var result = await instance.claim({from: accounts[i]});
            assert.isTrue(result.receipt.status);

            // accounts info should be zero after claim
            var accountInfo = await instance.accounts(accounts[i]); 
            assert.equal(accountInfo.claimIndex, timestampList.length);
            assert.equal(accountInfo.pendingTokenAllocation.toString(), "0");
            assert.isTrue(accountInfo.claimedTimestamp > toBN(0));
        }
	});

});

async function claim() {

	try {
		var result = await instance.claim();
		assert.isTrue(result.receipt.status);

	} catch(Exception) {
		return false;
	}

	return true;
}

async function register(account, tokenAllocation) {

	try {
		var result = await instance.register(account, tokenAllocation);
		assert.isTrue(result.receipt.status);

	} catch(Exception) {
		return false;
	}

	return true;
}

async function setClaimable(timestamp, percent) {

	try {
		var result = await instance.setClaimable(timestamp, percent);
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
