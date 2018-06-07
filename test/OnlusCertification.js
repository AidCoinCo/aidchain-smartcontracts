import assertRevert from './helpers/assertRevert';

import shouldBehaveLikeRBACManager from './RBACManager.behaviour';

const BigNumber = web3.BigNumber;

const OnlusCertification = artifacts.require('OnlusCertification');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('OnlusCertification', function (accounts) {
  const [
    owner,
    anyone,
    onlusWallet,
    ...managers
  ] = accounts;

  before(async function () {
    this.mock = await OnlusCertification.new({ from: owner });
  });

  shouldBehaveLikeRBACManager(accounts);

  describe('onlus certification', function () {
    it('allows owner to add a wallet certification', async function () {
      const onlusId = 1;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: owner }).should.be.fulfilled;
    });

    it('allows owner to remove a wallet certification', async function () {
      const onlusId = 1;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: owner }).should.be.fulfilled;
      await this.mock.removeWalletCertification(onlusWallet, { from: owner }).should.be.fulfilled;
    });

    it('allows manager to add a wallet certification', async function () {
      const onlusId = 1;
      await this.mock.addManager(managers[0], { from: owner }).should.be.fulfilled;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: managers[0] }).should.be.fulfilled;
    });

    it('allows managers to remove a wallet certification', async function () {
      const onlusId = 1;
      await this.mock.addWalletCertification(onlusWallet, onlusId, { from: managers[0] }).should.be.fulfilled;
      await this.mock.removeWalletCertification(onlusWallet, { from: managers[0] }).should.be.fulfilled;
    });

    it('does not allow "anyone" to add a wallet certification', async function () {
      const onlusId = 1;
      await assertRevert(
        this.mock.addWalletCertification(onlusWallet, onlusId, { from: anyone })
      );
    });

    it('does not allow "anyone" to remove a wallet certification', async function () {
      await assertRevert(
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
      await assertRevert(
        this.mock.addWalletCertification(onlusWallet, 0, { from: owner })
      );
    });

    it('should fail to remove certification if not present', async function () {
      await assertRevert(
        this.mock.removeWalletCertification(onlusWallet, { from: owner })
      );
    });
  });
});
