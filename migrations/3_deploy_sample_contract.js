const OnlusCertification = artifacts.require('OnlusCertification');

module.exports = function (deployer) {
  deployer.deploy(OnlusCertification);
};
