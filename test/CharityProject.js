import assertRevert from './helpers/assertRevert';

import shouldBehaveLikeRBACManager from './RBACManager.behaviour';

const BigNumber = web3.BigNumber;

const CharityProject = artifacts.require('CharityProject');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CharityProject', function (accounts) {
  const [
    owner,
    anyone,
    onlusWallet,
    ...managers
  ] = accounts;

  before(async function () {
    this.mock = await CharityProject.new({ from: owner });
  });

  shouldBehaveLikeRBACManager(accounts);
});
