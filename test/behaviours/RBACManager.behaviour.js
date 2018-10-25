const shouldFail = require('openzeppelin-solidity/test/helpers/shouldFail');
const expectEvent = require('openzeppelin-solidity/test/helpers/expectEvent');
const { ZERO_ADDRESS } = require('openzeppelin-solidity/test/helpers/constants');

require('chai').should();

function shouldBehaveLikeRBACManager (accounts) {
  const [
    authorized,
    anyone,
    futureManager,
    ...managers
  ] = accounts;

  beforeEach(async function () {
    for (let i = 0; i < 3; i++) {
      await this.mock.addManager(managers[i], { from: authorized });
    }
  });

  describe('in normal conditions', function () {
    it('allows authorized to add a manager', async function () {
      await this.mock.addManager(futureManager, { from: authorized });
    });

    it('allows authorized to remove a manager', async function () {
      await this.mock.addManager(futureManager, { from: authorized });
      await this.mock.removeManager(futureManager, { from: authorized });
    });

    it('emits a ManagerAdded event on addManager', async function () {
      const { logs } = await this.mock.addManager(futureManager, { from: authorized });
      expectEvent.inLogs(logs, 'ManagerAdded', { account: futureManager });
    });

    it('emits a ManagerRemoved event on removeManager', async function () {
      await this.mock.addManager(futureManager, { from: authorized });
      const { logs } = await this.mock.removeManager(futureManager, { from: authorized });
      expectEvent.inLogs(logs, 'ManagerRemoved', { account: futureManager });
    });
  });

  describe('in adversarial conditions', function () {
    it('reverts when adding role to an already assigned account', async function () {
      await this.mock.addManager(futureManager, { from: authorized });
      await shouldFail.reverting(this.mock.addManager(futureManager, { from: authorized }));
    });

    it('reverts when adding role to the null account', async function () {
      await shouldFail.reverting(this.mock.addManager(ZERO_ADDRESS, { from: authorized }));
    });

    it('reverts when removing from an unassigned account', async function () {
      await shouldFail.reverting(this.mock.removeManager(anyone, { from: authorized }));
    });

    it('reverts when removing role from the null account', async function () {
      await shouldFail.reverting(this.mock.removeManager(ZERO_ADDRESS, { from: authorized }));
    });

    it('does not allow a manager to add another manager', async function () {
      await shouldFail.reverting(
        this.mock.addManager(futureManager, { from: managers[0] })
      );
    });

    it('does not allow "anyone" to add a manager', async function () {
      await shouldFail.reverting(
        this.mock.addManager(futureManager, { from: anyone })
      );
    });

    it('does not allow a manager to remove another manager', async function () {
      await shouldFail.reverting(
        this.mock.removeManager(managers[1], { from: managers[0] })
      );
    });

    it('does not allow "anyone" to remove a manager', async function () {
      await shouldFail.reverting(
        this.mock.removeManager(managers[1], { from: anyone })
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeRBACManager,
};
