const Token = artifacts.require("Token");

module.exports = function (deployer) {

  const initialSupply = 5000000000;

  deployer.deploy(Token, initialSupply);
};
