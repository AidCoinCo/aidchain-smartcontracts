const shouldFail = require('openzeppelin-solidity/test/helpers/shouldFail');

const { shouldBehaveLikeRBACManager } = require('./behaviours/RBACManager.behaviour');

const BigNumber = web3.BigNumber;

const OnlusCertification = artifacts.require('OnlusCertification');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('OnlusCertification', function (accounts) {
  const [
    owner,
    anyone,
    onlusWallet,
    futureManager,
    ...managers
  ] = accounts;

  beforeEach(async function () {
    this.mock = await OnlusCertification.new({ from: owner });
  });

  context('like a RBACManager', function () {
    shouldBehaveLikeRBACManager([
      owner,
      anyone,
      futureManager,
      ...managers,
    ]);
  });

  describe('onlus certification', function () {
    beforeEach(async function () {
      for (let i = 0; i < 3; i++) {
        await this.mock.addManager(managers[i], { from: owner });
      }
    });

    it('allows owner to add a wallet certification', async function () {
      const onlusId = 1;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: owner });
    });

    it('allows owner to remove a wallet certification', async function () {
      const onlusId = 1;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: owner });
      await this.mock.removeWalletCertification(onlusWallet, { from: owner });
    });

    it('allows manager to add a wallet certification', async function () {
      const onlusId = 1;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: managers[0] });
    });

    it('allows managers to remove a wallet certification', async function () {
      const onlusId = 1;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: managers[0] });
      await this.mock.removeWalletCertification(onlusWallet, { from: managers[0] });
    });

    it('does not allow "anyone" to add a wallet certification', async function () {
      const onlusId = 1;
      await shouldFail.reverting(
        this.mock.addWalletCertification(onlusWallet, onlusId, { from: anyone })
      );
    });

    it('does not allow "anyone" to remove a wallet certification', async function () {
      await shouldFail.reverting(
        this.mock.removeWalletCertification(onlusWallet, { from: anyone })
      );
    });
  });

  describe('low level certification', function () {
    it('wallet address should have the right id set after certification added', async function () {
      const onlusId = 2;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: owner });

      const certificationId = await this.mock.walletMapping(onlusWallet);
      certificationId.should.be.bignumber.equal(onlusId);
    });

    it('wallet address id should be zero after certification removed', async function () {
      const onlusId = 2;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: owner });

      const preCertificationId = await this.mock.walletMapping(onlusWallet);
      preCertificationId.should.be.bignumber.equal(onlusId);

      await this.mock.removeWalletCertification(onlusWallet, { from: owner });

      const postCertificationId = await this.mock.walletMapping(onlusWallet);
      postCertificationId.should.be.bignumber.equal(0);
    });

    it('should fail to add certification if invalid id', async function () {
      await shouldFail.reverting(
        this.mock.addWalletCertification(onlusWallet, 0, { from: owner })
      );
    });

    it('should fail to remove certification if not present', async function () {
      await shouldFail.reverting(
        this.mock.removeWalletCertification(onlusWallet, { from: owner })
      );
    });
  });
});
