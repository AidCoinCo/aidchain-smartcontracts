import assertRevert from './helpers/assertRevert';
import expectEvent from './helpers/expectEvent';

const BigNumber = web3.BigNumber;

const OnlusCertification = artifacts.require('OnlusCertification');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('OnlusCertification', function (accounts) {
  let mock;

  const [
    owner,
    anyone,
    futureManager,
    onlusWallet,
    ...managers
  ] = accounts;

  before(async () => {
    mock = await OnlusCertification.new({ from: owner });

    for (let i = 0; i < 3; i++) {
      await mock.addManager(managers[i], { from: owner }).should.be.fulfilled;
    }
  });

  context('in normal conditions', () => {
    it('allows owner to add a manager', async () => {
      await mock.addManager(managers[3], { from: owner }).should.be.fulfilled;
    });

    it('allows owner to remove a manager', async () => {
      await mock.removeManager(managers[2], { from: owner }).should.be.fulfilled;
    });

    it('announces a RoleAdded event on addRole', async () => {
      await expectEvent.inTransaction(
        mock.addManager(futureManager, { from: owner }),
        'RoleAdded'
      );
    });

    it('announces a RoleRemoved event on removeRole', async () => {
      await expectEvent.inTransaction(
        mock.removeManager(futureManager, { from: owner }),
        'RoleRemoved'
      );
    });
  });

  context('in adversarial conditions', () => {
    it('does not allow a manager to add another manager', async () => {
      await assertRevert(
        mock.addManager(futureManager, { from: managers[0] })
      );
    });

    it('does not allow "anyone" to add a manager', async () => {
      await assertRevert(
        mock.addManager(futureManager, { from: anyone })
      );
    });

    it('does not allow a manager to remove another manager', async () => {
      await assertRevert(
        mock.removeManager(managers[1], { from: managers[0] })
      );
    });

    it('does not allow "anyone" to remove a manager', async () => {
      await assertRevert(
        mock.removeManager(managers[1], { from: anyone })
      );
    });
  });

  context('onlus certification', () => {
    it('allows owner to add a wallet certification', async () => {
      const onlusId = 1;
      await mock.addWalletCertification(onlusWallet, onlusId, { from: owner }).should.be.fulfilled;
    });

    it('allows owner to remove a wallet certification', async () => {
      const onlusId = 1;
      await mock.addWalletCertification(onlusWallet, onlusId, { from: owner }).should.be.fulfilled;
      await mock.removeWalletCertification(onlusWallet, { from: owner }).should.be.fulfilled;
    });

    it('allows manager to add a wallet certification', async () => {
      const onlusId = 1;
      await mock.addWalletCertification(onlusWallet, onlusId, { from: managers[0] }).should.be.fulfilled;
    });

    it('allows managers to remove a wallet certification', async () => {
      const onlusId = 1;
      await mock.addWalletCertification(onlusWallet, onlusId, { from: managers[0] }).should.be.fulfilled;
      await mock.removeWalletCertification(onlusWallet, { from: managers[0] }).should.be.fulfilled;
    });

    it('does not allow "anyone" to add a wallet certification', async () => {
      const onlusId = 1;
      await assertRevert(
        mock.addWalletCertification(onlusWallet, onlusId, { from: anyone })
      );
    });

    it('does not allow "anyone" to remove a wallet certification', async () => {
      await assertRevert(
        mock.removeWalletCertification(onlusWallet, { from: anyone })
      );
    });
  });

  context('low level certification', () => {
    it('wallet address should have the right id set after certification added', async () => {
      const onlusId = 2;
      await mock.addWalletCertification(onlusWallet, onlusId, { from: owner });

      const certificationId = await mock.walletMapping(onlusWallet);
      certificationId.should.be.bignumber.equal(onlusId);
    });

    it('wallet address id should be zero after certification removed', async () => {
      const onlusId = 2;
      await mock.addWalletCertification(onlusWallet, onlusId, { from: owner });

      const preCertificationId = await mock.walletMapping(onlusWallet);
      preCertificationId.should.be.bignumber.equal(onlusId);

      await mock.removeWalletCertification(onlusWallet, { from: owner });

      const postCertificationId = await mock.walletMapping(onlusWallet);
      postCertificationId.should.be.bignumber.equal(0);
    });

    it('should fail to add certification if invalid id', async () => {
      await assertRevert(
        mock.addWalletCertification(onlusWallet, 0, { from: owner })
      );
    });

    it('should fail to remove certification if not present', async () => {
      await assertRevert(
        mock.removeWalletCertification(onlusWallet, { from: owner })
      );
    });
  });
});
