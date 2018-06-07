const CharityProject = artifacts.require('CharityProject');

module.exports = function (deployer, network, accounts) {
  deployer.deploy(CharityProject);
};
