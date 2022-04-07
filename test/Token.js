const Token = artifacts.require("Token");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Token", function (accounts) {
  it("should assert true", async function () {
    await Token.deployed();
    return assert.isTrue(true);
  });

  it("should return correct token name", async function () {
    const instance = await Token.deployed();
    const name = await instance.name();

    assert.equal(name, "THE NEXT WAR Gem");
  });

  it("should return correct token symbol", async function () {
    const instance = await Token.deployed();
    const symbol = await instance.symbol();

    assert.equal(symbol, "TNG");
  });

  it("should return total supply", async function () {
    const instance = await Token.deployed();
    const totalSupply = await instance.totalSupply();

    assert.equal(totalSupply, toWei(5000000000));
  });

  it('should return a balance of zero for an address that has no tokens ', async function () {
    const instance = await Token.deployed();
    const balance = await instance.balanceOf(accounts[1]);
    assert.equal(balance, 0);
  });

  it("should transfer 1,000,000,000 TNG", async function () {
    const amount = toWei(10);
    const instance = await Token.deployed();
    const totalSupply = await instance.totalSupply();

    await instance.transfer(accounts[1], web3.utils.toBN(amount));

    const balanceAccount0 = (await instance.balanceOf(accounts[0])).toString();
    const balanceAccount1 = (await instance.balanceOf(accounts[1])).toString();

    assert.equal(balanceAccount0, totalSupply - amount);
    assert.equal(balanceAccount1, amount);
  });
});

it('should fail if account dont have tokens', async () => {
  var hasError = true;
  try {
    const amount = toWei(10);
    const instance = await Token.deployed();
    await instance.transfer(accounts[0], amount, { from: accounts[1] })
    
    hasError = false; // Should be unreachable
  } catch(err) { }

  assert.equal(true, hasError, "Holder do not have enough tokens");
});

function toWei(count) {
  return count * 10 ** 18
}
