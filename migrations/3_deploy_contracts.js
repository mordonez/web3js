const AmongAll = artifacts.require("AmongAll");

module.exports = function(deployer) {
  deployer.link(AmongAll);
  deployer.deploy(AmongAll);
};
