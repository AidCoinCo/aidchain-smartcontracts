const { assertRevert } = require('../helpers/assertRevert');
const expectEvent = require('../helpers/expectEvent');

require('chai')
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeRBACManager (accounts) {
  const [
    owner,
    anyone,
    futureManager,
    ...managers
  ] = accounts;

  beforeEach(async function () {
    for (let i = 0; i < 3; i++) {
      await this.mock.addManager(managers[i], { from: owner }).should.be.fulfilled;
    }
  });

  describe('in normal conditions', function () {
    it('allows owner to add a manager', async function () {
      await this.mock.addManager(managers[3], { from: owner }).should.be.fulfilled;
    });

    it('allows owner to remove a manager', async function () {
      await this.mock.removeManager(managers[2], { from: owner }).should.be.fulfilled;
    });

    it('announces a RoleAdded event on addRole', async function () {
      await expectEvent.inTransaction(
        this.mock.addManager(futureManager, { from: owner }),
        'RoleAdded'
      );
    });

    it('announces a RoleRemoved event on removeRole', async function () {
      await expectEvent.inTransaction(
        this.mock.removeManager(futureManager, { from: owner }),
        'RoleRemoved'
      );
    });
  });

  describe('in adversarial conditions', function () {
    it('does not allow a manager to add another manager', async function () {
      await assertRevert(
        this.mock.addManager(futureManager, { from: managers[0] })
      );
    });

    it('does not allow "anyone" to add a manager', async function () {
      await assertRevert(
        this.mock.addManager(futureManager, { from: anyone })
      );
    });

    it('does not allow a manager to remove another manager', async function () {
      await assertRevert(
        this.mock.removeManager(managers[1], { from: managers[0] })
      );
    });

    it('does not allow "anyone" to remove a manager', async function () {
      await assertRevert(
        this.mock.removeManager(managers[1], { from: anyone })
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeRBACManager,
};
