const Token = artifacts.require("TncToken");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */

var instance;

contract("TncToken", function (accounts) {

	beforeEach(async () => {
		instance = await Token.deployed();
	});

	it("should return correct token name", async function () {
		var name = await instance.name();

		assert.equal(name, "THE NEXT WAR COIN");
	});

	it("should return correct token symbol", async function () {
		var symbol = await instance.symbol();

		assert.equal(symbol, "TNC");
	});

	it("should return true if owner's balance same with total supply", async function () {
		var totalSupply = await instance.totalSupply();
		var balance = await instance.balanceOf(accounts[0]);

		assert.equal(balance.toString(), totalSupply.toString());
	});

	it('should return true for owner authorization', async function () {
		var isAuthorized = await instance.isAuthorized(accounts[0]);
		assert.isTrue(isAuthorized);
	});

	it('should return false when wallet not authorized', async function () {
		var isAuthorized = await instance.isAuthorized(accounts[1]);
		assert.isFalse(isAuthorized);
	});

	it('should return true when address authorized successfully', async function () {
		var result = await instance.authorize(accounts[1], true);
		assert.isTrue(result.receipt.status);

		var isAuthorized = await instance.isAuthorized(accounts[1]);
		assert.isTrue(isAuthorized);
	});

	it('should return true when address deauthorized successfully', async function () {
		var result = await instance.authorize(accounts[1], true);
		assert.isTrue(result.receipt.status);

		var isAuthorized = await instance.isAuthorized(accounts[1]);
		assert.isTrue(isAuthorized);

		var result2 = await instance.authorize(accounts[1], false);
		assert.isTrue(result2.receipt.status);

		var isAuthorized2 = await instance.isAuthorized(accounts[1]);
		assert.isFalse(isAuthorized2);
	});

	it('should return false if mint with un-authorized address', async function () {
		var isAuthorized = await instance.isAuthorized(accounts[1]);
		assert.isFalse(isAuthorized);

		var hasError = false;
		try {
			var result = await instance.mint(accounts[0], 1, { from: accounts[1] });
		} catch (Exception) {
			hasError = true;
		}

		assert.isTrue(hasError);
	});

	it('should return true if mint amount is correct', async function () {
		var isAuthorized = await instance.isAuthorized(accounts[0]);
		assert.isTrue(isAuthorized);

		var mintAmount = toBN(1000000);
		var oldBalance = toBN(await instance.balanceOf(accounts[0]));

		var result = await instance.mint(accounts[0], mintAmount, { from: accounts[0] });
		assert.isTrue(result.receipt.status);
		var newBalance = toBN(await instance.balanceOf(accounts[0]));

		assert.equal(newBalance.toString(), oldBalance.add(mintAmount).toString());
	});

});

function toWei(count) {
	return web3.utils.toWei(count);
}

function toBN(value) {
	return web3.utils.toBN(value);
}
