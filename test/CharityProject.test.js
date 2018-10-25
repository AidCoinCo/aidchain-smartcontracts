const { advanceBlock } = require('openzeppelin-solidity/test/helpers/advanceToBlock');
const time = require('openzeppelin-solidity/test/helpers/time');
const { ether } = require('openzeppelin-solidity/test/helpers/ether');
const shouldFail = require('openzeppelin-solidity/test/helpers/shouldFail');

const { shouldBehaveLikeRBACManager } = require('./behaviours/RBACManager.behaviour');

const BigNumber = web3.BigNumber;

const CharityProject = artifacts.require('CharityProject');
const AidCoinMock = artifacts.require('AidCoinMock');
const ERC20Mock = artifacts.require('ERC20Mock');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CharityProject', function (accounts) {
  const [
    owner,
    anyone,
    additionalManager,
    onlusWallet,
    userWallet,
    futureManager,
    ...managers
  ] = accounts;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.feeInMillis = new BigNumber(200); // 200/1000 == 20%
    this.maxGoal = new BigNumber(1000);
    this.openingTime = (await time.latest()) + time.duration.weeks(1);
    this.closingTime = this.openingTime + time.duration.weeks(1);
    this.afterOpeningTime = this.openingTime + time.duration.seconds(1);
    this.afterClosingTime = this.closingTime + time.duration.seconds(1);
    this.canWithdrawBeforeEnd = true;

    this.token = await AidCoinMock.new();
    await this.token.mint(userWallet, new BigNumber(100000));

    this.mock = await CharityProject.new(
      this.feeInMillis,
      this.maxGoal,
      this.openingTime,
      this.closingTime,
      onlusWallet,
      this.token.address,
      this.canWithdrawBeforeEnd,
      additionalManager,
      { from: owner }
    );
  });

  context('like a RBACManager', function () {
    shouldBehaveLikeRBACManager([
      owner,
      anyone,
      futureManager,
      ...managers,
    ]);
  });

  context('creating a valid project', function () {
    describe('owner, wallet and additional manager are different', function () {
      it('contract deployer should be contract owner', async function () {
        const contractOwner = await this.mock.owner();
        contractOwner.should.be.equal(owner);
      });

      it('owner should have the manager role', async function () {
        const contractOwner = await this.mock.owner();
        const hasManagerRole = await this.mock.isManager(contractOwner);
        hasManagerRole.should.be.equal(true);
      });

      it('charity wallet should have the manager role', async function () {
        const hasManagerRole = await this.mock.isManager(onlusWallet);
        hasManagerRole.should.be.equal(true);
      });

      it('additional manager should have the manager role', async function () {
        const hasManagerRole = await this.mock.isManager(additionalManager);
        hasManagerRole.should.be.equal(true);
      });
    });

    describe('owner and wallet are the same and additional manager is different', function () {
      beforeEach(async function () {
        this.mock = await CharityProject.new(
          this.feeInMillis,
          this.maxGoal,
          this.openingTime,
          this.closingTime,
          onlusWallet,
          this.token.address,
          this.canWithdrawBeforeEnd,
          additionalManager,
          { from: onlusWallet }
        );
      });

      it('contract deployer should be contract owner', async function () {
        const contractOwner = await this.mock.owner();
        contractOwner.should.be.equal(onlusWallet);
      });

      it('owner should have the manager role', async function () {
        const contractOwner = await this.mock.owner();
        const hasManagerRole = await this.mock.isManager(contractOwner);
        hasManagerRole.should.be.equal(true);
      });

      it('charity wallet should have the manager role', async function () {
        const hasManagerRole = await this.mock.isManager(onlusWallet);
        hasManagerRole.should.be.equal(true);
      });

      it('additional manager should have the manager role', async function () {
        const hasManagerRole = await this.mock.isManager(additionalManager);
        hasManagerRole.should.be.equal(true);
      });
    });

    describe('wallet is different and owner and additional manager are the same', function () {
      beforeEach(async function () {
        this.mock = await CharityProject.new(
          this.feeInMillis,
          this.maxGoal,
          this.openingTime,
          this.closingTime,
          onlusWallet,
          this.token.address,
          this.canWithdrawBeforeEnd,
          additionalManager,
          { from: additionalManager }
        );
      });

      it('contract deployer should be contract owner', async function () {
        const contractOwner = await this.mock.owner();
        contractOwner.should.be.equal(additionalManager);
      });

      it('owner should have the manager role', async function () {
        const contractOwner = await this.mock.owner();
        const hasManagerRole = await this.mock.isManager(contractOwner);
        hasManagerRole.should.be.equal(true);
      });

      it('charity wallet should have the manager role', async function () {
        const hasManagerRole = await this.mock.isManager(onlusWallet);
        hasManagerRole.should.be.equal(true);
      });

      it('additional manager should have the manager role', async function () {
        const hasManagerRole = await this.mock.isManager(additionalManager);
        hasManagerRole.should.be.equal(true);
      });
    });

    describe('if opening time is zero', function () {
      it('success', async function () {
        await CharityProject.new(
          this.feeInMillis,
          this.maxGoal,
          0,
          this.closingTime,
          onlusWallet,
          this.token.address,
          this.canWithdrawBeforeEnd,
          additionalManager,
          { from: owner }
        );
      });
    });

    describe('if closing time is zero', function () {
      it('success', async function () {
        await CharityProject.new(
          this.feeInMillis,
          this.maxGoal,
          this.openingTime,
          0,
          onlusWallet,
          this.token.address,
          this.canWithdrawBeforeEnd,
          additionalManager,
          { from: owner }
        );
      });
    });

    describe('if both opening and closing time are zero', function () {
      it('success', async function () {
        await CharityProject.new(
          this.feeInMillis,
          this.maxGoal,
          0,
          0,
          onlusWallet,
          this.token.address,
          this.canWithdrawBeforeEnd,
          additionalManager,
          { from: owner }
        );
      });
    });

    describe('if closing time is before opening time', function () {
      it('reverts', async function () {
        await shouldFail.reverting(
          CharityProject.new(
            this.feeInMillis,
            this.maxGoal,
            this.openingTime,
            (this.openingTime - time.duration.seconds(1)),
            onlusWallet,
            this.token.address,
            this.canWithdrawBeforeEnd,
            additionalManager,
            { from: owner }
          )
        );
      });
    });

    describe('if empty wallet', function () {
      it('reverts', async function () {
        await shouldFail.reverting(
          CharityProject.new(
            this.feeInMillis,
            this.maxGoal,
            this.openingTime,
            this.closingTime,
            ZERO_ADDRESS,
            this.token.address,
            this.canWithdrawBeforeEnd,
            additionalManager,
            { from: owner }
          )
        );
      });
    });

    describe('if empty token', function () {
      it('reverts', async function () {
        await shouldFail.reverting(
          CharityProject.new(
            this.feeInMillis,
            this.maxGoal,
            this.openingTime,
            this.closingTime,
            onlusWallet,
            ZERO_ADDRESS,
            this.canWithdrawBeforeEnd,
            additionalManager,
            { from: owner }
          )
        );
      });
    });
  });

  describe('check all properties', function () {
    it('has a feeInMillis', async function () {
      const feeInMillis = await this.mock.feeInMillis();
      feeInMillis.should.be.bignumber.equal(this.feeInMillis);
    });

    it('has a maxGoal', async function () {
      const maxGoal = await this.mock.maxGoal();
      maxGoal.should.be.bignumber.equal(this.maxGoal);
    });

    it('has an opening time', async function () {
      const openingTime = await this.mock.openingTime();
      openingTime.should.be.bignumber.equal(this.openingTime);
    });

    it('has an closing time', async function () {
      const closingTime = await this.mock.closingTime();
      closingTime.should.be.bignumber.equal(this.closingTime);
    });

    it('has a wallet', async function () {
      const wallet = await this.mock.wallet();
      wallet.should.be.equal(onlusWallet);
    });

    it('has a token', async function () {
      const token = await this.mock.token();
      token.should.be.equal(this.token.address);
    });

    it('has a boolean property for withdrawing before end', async function () {
      const canWithdrawBeforeEnd = await this.mock.canWithdrawBeforeEnd();
      canWithdrawBeforeEnd.should.be.equal(this.canWithdrawBeforeEnd);
    });
  });

  context('editing properties', function () {
    describe('changing maxGoal', function () {
      describe('if owner is calling', function () {
        it('has the new maxGoal', async function () {
          const newMaxGoal = new BigNumber(2000);
          await this.mock.setMaxGoal(newMaxGoal, { from: owner });
          const maxGoal = await this.mock.maxGoal();
          maxGoal.should.be.bignumber.equal(newMaxGoal);
        });
      });

      describe('if anyone is calling', function () {
        it('reverts', async function () {
          const newMaxGoal = new BigNumber(2000);
          await shouldFail.reverting(
            this.mock.setMaxGoal(newMaxGoal, { from: onlusWallet })
          );
        });
      });
    });

    describe('changing times', function () {
      describe('if owner is calling', function () {
        it('has the new times', async function () {
          const newOpeningTime = (await time.latest()) + time.duration.weeks(1);
          const newClosingTime = newOpeningTime + time.duration.weeks(1);

          await this.mock.setTimes(newOpeningTime, newClosingTime, { from: owner });

          const openingTime = await this.mock.openingTime();
          openingTime.should.be.bignumber.equal(newOpeningTime);
          const closingTime = await this.mock.closingTime();
          closingTime.should.be.bignumber.equal(newClosingTime);
        });

        describe('if closing time is zero', function () {
          it('success', async function () {
            const newOpeningTime = (await time.latest()) + time.duration.weeks(1);
            const newClosingTime = 0;
            await this.mock.setTimes(newOpeningTime, newClosingTime, { from: owner })
            ;
          });
        });

        describe('if opening time is zero', function () {
          it('success', async function () {
            const newOpeningTime = 0;
            const newClosingTime = (await time.latest()) + time.duration.weeks(1);
            await this.mock.setTimes(newOpeningTime, newClosingTime, { from: owner })
            ;
          });
        });

        describe('if both opening and closing time are zero', function () {
          it('success', async function () {
            const newOpeningTime = 0;
            const newClosingTime = 0;
            await this.mock.setTimes(newOpeningTime, newClosingTime, { from: owner })
            ;
          });
        });

        describe('if closing time is before opening time', function () {
          it('reverts', async function () {
            const newOpeningTime = (await time.latest()) + time.duration.weeks(1);
            const newClosingTime = newOpeningTime - time.duration.seconds(1);
            await shouldFail.reverting(
              this.mock.setTimes(newOpeningTime, newClosingTime, { from: owner })
            );
          });
        });
      });

      describe('if anyone is calling', function () {
        it('reverts', async function () {
          const newOpeningTime = (await time.latest()) + time.duration.weeks(1);
          const newClosingTime = newOpeningTime + time.duration.weeks(1);
          await shouldFail.reverting(
            this.mock.setTimes(newOpeningTime, newClosingTime, { from: onlusWallet })
          );
        });
      });
    });

    describe('changing canWithdrawBeforeEnd', function () {
      describe('if owner is calling', function () {
        it('has the new canWithdrawBeforeEnd', async function () {
          const newCanWithdrawBeforeEnd = false;
          await this.mock.setCanWithdrawBeforeEnd(newCanWithdrawBeforeEnd, { from: owner });
          const canWithdrawBeforeEnd = await this.mock.canWithdrawBeforeEnd();
          canWithdrawBeforeEnd.should.be.equal(newCanWithdrawBeforeEnd);
        });
      });

      describe('if anyone is calling', function () {
        it('reverts', async function () {
          const canWithdrawBeforeEnd = false;
          await this.mock.setCanWithdrawBeforeEnd(canWithdrawBeforeEnd, { from: owner });
          await shouldFail.reverting(
            this.mock.setCanWithdrawBeforeEnd(canWithdrawBeforeEnd, { from: onlusWallet })
          );
        });
      });
    });
  });

  context('check all boolean controls', function () {
    describe('if before opening time', function () {
      describe('if opening time is equal to zero', function () {
        beforeEach(async function () {
          this.mock = await CharityProject.new(
            this.feeInMillis,
            this.maxGoal,
            0,
            this.closingTime,
            onlusWallet,
            this.token.address,
            this.canWithdrawBeforeEnd,
            additionalManager,
            { from: owner }
          );
        });

        it('hasStarted should be true', async function () {
          const hasStarted = await this.mock.hasStarted();
          hasStarted.should.be.equal(true);
        });

        it('hasClosed should be false', async function () {
          const hasClosed = await this.mock.hasClosed();
          hasClosed.should.be.equal(false);
        });
      });

      describe('if opening time is grater than zero', function () {
        it('hasStarted should be false', async function () {
          const hasStarted = await this.mock.hasStarted();
          hasStarted.should.be.equal(false);
        });

        it('hasClosed should be false', async function () {
          const hasClosed = await this.mock.hasClosed();
          hasClosed.should.be.equal(false);
        });
      });
    });

    describe('if between opening and closing time', function () {
      describe('if closing time is equal to zero', function () {
        beforeEach(async function () {
          this.mock = await CharityProject.new(
            this.feeInMillis,
            this.maxGoal,
            this.openingTime,
            0,
            onlusWallet,
            this.token.address,
            this.canWithdrawBeforeEnd,
            additionalManager,
            { from: owner }
          );

          await time.increaseTo(this.afterOpeningTime);
        });

        it('hasStarted should be true', async function () {
          const hasStarted = await this.mock.hasStarted();
          hasStarted.should.be.equal(true);
        });

        it('hasClosed should be false', async function () {
          const hasClosed = await this.mock.hasClosed();
          hasClosed.should.be.equal(false);
        });
      });

      describe('if closing time is grater than zero', function () {
        beforeEach(async function () {
          await time.increaseTo(this.afterOpeningTime);
        });

        it('hasStarted should be true', async function () {
          const hasStarted = await this.mock.hasStarted();
          hasStarted.should.be.equal(true);
        });

        it('hasClosed should be false', async function () {
          const hasClosed = await this.mock.hasClosed();
          hasClosed.should.be.equal(false);
        });
      });
    });

    describe('if after closing time', function () {
      describe('if closing time is grater than zero', function () {
        beforeEach(async function () {
          await time.increaseTo(this.afterClosingTime);
        });

        it('hasStarted should be true', async function () {
          const hasStarted = await this.mock.hasStarted();
          hasStarted.should.be.equal(true);
        });

        it('hasClosed should be true', async function () {
          const hasClosed = await this.mock.hasClosed();
          hasClosed.should.be.equal(true);
        });
      });
    });

    describe('if someone sends less than the goal', function () {
      it('maxGoalReached should be false', async function () {
        await this.token.transfer(this.mock.address, this.maxGoal.sub(1), { from: userWallet });
        const maxGoalReached = await this.mock.maxGoalReached();
        maxGoalReached.should.be.equal(false);
      });
    });

    describe('if someone sends the goal', function () {
      it('maxGoalReached should be true', async function () {
        await this.token.transfer(this.mock.address, this.maxGoal, { from: userWallet });
        const maxGoalReached = await this.mock.maxGoalReached();
        maxGoalReached.should.be.equal(true);
      });
    });

    describe('if someone sends more than the goal', function () {
      it('maxGoalReached should be true', async function () {
        await this.token.transfer(this.mock.address, this.maxGoal.add(1), { from: userWallet });
        const maxGoalReached = await this.mock.maxGoalReached();
        maxGoalReached.should.be.equal(true);
      });
    });

    describe('if is reached and then withdrawn', function () {
      it('maxGoalReached should be true', async function () {
        await this.token.transfer(this.mock.address, this.maxGoal.add(1), { from: userWallet });
        await this.mock.withdrawTokens(onlusWallet, this.maxGoal.add(1), { from: owner });
        const maxGoalReached = await this.mock.maxGoalReached();
        maxGoalReached.should.be.equal(true);
      });
    });
  });

  describe('accepting payments', function () {
    it('should reject ETH payments', async function () {
      await shouldFail.reverting(this.mock.send(ether(1), { from: anyone }));
    });

    it('should accept token payments', async function () {
      const tokenAmount = new BigNumber(200);
      const pre = await this.token.balanceOf(this.mock.address);
      await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });
      const post = await this.token.balanceOf(this.mock.address);
      post.minus(pre).should.be.bignumber.equal(tokenAmount);
    });
  });

  context('withdraw tokens', function () {
    describe('if can withdraw before end', function () {
      const tokenAmount = new BigNumber(20000);

      beforeEach(async function () {
        await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });
      });

      context('if has permission', function () {
        describe('if owner is calling', function () {
          it('transfer tokens to the selected wallet', async function () {
            const withdrawAmount = new BigNumber(200);

            const preMock = await this.token.balanceOf(this.mock.address);
            const preWallet = await this.token.balanceOf(onlusWallet);

            await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner });

            const postMock = await this.token.balanceOf(this.mock.address);
            const postWallet = await this.token.balanceOf(onlusWallet);

            postMock.plus(withdrawAmount).should.be.bignumber.equal(preMock);
            postWallet.minus(preWallet).should.be.bignumber.equal(withdrawAmount);
          });
        });

        describe('if wallet is calling', function () {
          it('transfer tokens to the selected wallet', async function () {
            const withdrawAmount = new BigNumber(200);

            const preMock = await this.token.balanceOf(this.mock.address);
            const preWallet = await this.token.balanceOf(onlusWallet);

            await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: onlusWallet });

            const postMock = await this.token.balanceOf(this.mock.address);
            const postWallet = await this.token.balanceOf(onlusWallet);

            postMock.plus(withdrawAmount).should.be.bignumber.equal(preMock);
            postWallet.minus(preWallet).should.be.bignumber.equal(withdrawAmount);
          });
        });

        describe('if additional manager is calling', function () {
          it('transfer tokens to the selected wallet', async function () {
            const withdrawAmount = new BigNumber(200);

            const preMock = await this.token.balanceOf(this.mock.address);
            const preWallet = await this.token.balanceOf(onlusWallet);

            await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: additionalManager });

            const postMock = await this.token.balanceOf(this.mock.address);
            const postWallet = await this.token.balanceOf(onlusWallet);

            postMock.plus(withdrawAmount).should.be.bignumber.equal(preMock);
            postWallet.minus(preWallet).should.be.bignumber.equal(withdrawAmount);
          });
        });

        describe('if destination wallet is zero address', function () {
          it('reverts', async function () {
            const withdrawAmount = new BigNumber(200);

            await shouldFail.reverting(
              this.mock.withdrawTokens(ZERO_ADDRESS, withdrawAmount, { from: owner })
            );
          });
        });

        describe('if trying to move more tokens than raised', function () {
          it('reverts', async function () {
            const withdrawAmount = tokenAmount.plus(1);

            await shouldFail.reverting(
              this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner })
            );
          });
        });

        it('withdrawnTokens value should track withdrawn', async function () {
          const withdrawAmount = new BigNumber(200);
          await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner });

          const withdrawnTokens = await this.mock.withdrawnTokens();
          withdrawnTokens.should.be.bignumber.equal(withdrawAmount);
        });
      });

      describe('if hasn\'t permission (anyone is calling)', function () {
        it('reverts', async function () {
          const withdrawAmount = new BigNumber(200);

          await shouldFail.reverting(
            this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: anyone })
          );
        });
      });
    });

    describe('if can\'t withdraw before end', function () {
      const tokenAmount = new BigNumber(20000);

      context('if has permission', function () {
        describe('withdraw before end', function () {
          it('reverts', async function () {
            this.mock = await CharityProject.new(
              this.feeInMillis,
              this.maxGoal,
              this.openingTime,
              this.closingTime,
              onlusWallet,
              this.token.address,
              false,
              additionalManager,
              { from: owner }
            );
            await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

            const withdrawAmount = new BigNumber(200);
            await shouldFail.reverting(
              this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner })
            );
          });
        });

        describe('withdraw after end', function () {
          it('success', async function () {
            this.mock = await CharityProject.new(
              this.feeInMillis,
              this.maxGoal,
              this.openingTime,
              this.closingTime,
              onlusWallet,
              this.token.address,
              false,
              additionalManager,
              { from: owner }
            );
            await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

            await time.increaseTo(this.afterClosingTime);

            const withdrawAmount = new BigNumber(200);
            await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner });
          });
        });

        describe('withdraw before end with closing time equal to 0', function () {
          it('success', async function () {
            this.mock = await CharityProject.new(
              this.feeInMillis,
              this.maxGoal,
              this.openingTime,
              0,
              onlusWallet,
              this.token.address,
              false,
              additionalManager,
              { from: owner }
            );
            await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

            const withdrawAmount = new BigNumber(200);
            await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner });
          });
        });
      });
    });
  });

  context('withdraw fees', function () {
    describe('if can withdraw before end', function () {
      const tokenAmount = new BigNumber(20000);

      beforeEach(async function () {
        await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });
      });

      context('if has permission', function () {
        describe('if owner is calling', function () {
          it('transfer tokens to the selected wallet', async function () {
            const withdrawAmount = new BigNumber(200);

            const preMock = await this.token.balanceOf(this.mock.address);
            const preWallet = await this.token.balanceOf(anyone);

            await this.mock.withdrawFees(anyone, withdrawAmount, { from: owner });

            const postMock = await this.token.balanceOf(this.mock.address);
            const postWallet = await this.token.balanceOf(anyone);

            postMock.plus(withdrawAmount).should.be.bignumber.equal(preMock);
            postWallet.minus(preWallet).should.be.bignumber.equal(withdrawAmount);
          });
        });

        describe('if wallet is calling', function () {
          it('reverts', async function () {
            const withdrawAmount = new BigNumber(200);

            await shouldFail.reverting(
              this.mock.withdrawFees(anyone, withdrawAmount, { from: onlusWallet })
            );
          });
        });

        describe('if additional manager is calling', function () {
          it('reverts', async function () {
            const withdrawAmount = new BigNumber(200);

            await shouldFail.reverting(
              this.mock.withdrawFees(anyone, withdrawAmount, { from: additionalManager })
            );
          });
        });

        describe('if destination wallet is zero address', function () {
          it('reverts', async function () {
            const withdrawAmount = new BigNumber(200);

            await shouldFail.reverting(
              this.mock.withdrawFees(ZERO_ADDRESS, withdrawAmount, { from: owner })
            );
          });
        });

        describe('if trying to move more tokens than authorized', function () {
          it('reverts', async function () {
            const withdrawAmount = tokenAmount.plus(1);

            await shouldFail.reverting(
              this.mock.withdrawFees(anyone, withdrawAmount, { from: owner })
            );
          });
        });

        it('withdrawnFees value should track withdrawn', async function () {
          const withdrawAmount = new BigNumber(200);
          await this.mock.withdrawFees(anyone, withdrawAmount, { from: owner });

          const withdrawnFees = await this.mock.withdrawnFees();
          withdrawnFees.should.be.bignumber.equal(withdrawAmount);
        });
      });

      describe('if hasn\'t permission (anyone is calling)', function () {
        it('reverts', async function () {
          const withdrawAmount = new BigNumber(200);

          await shouldFail.reverting(
            this.mock.withdrawFees(anyone, withdrawAmount, { from: anyone })
          );
        });
      });
    });

    describe('if can\'t withdraw before end', function () {
      const tokenAmount = new BigNumber(20000);

      context('if has permission', function () {
        describe('withdraw before end', function () {
          it('reverts', async function () {
            this.mock = await CharityProject.new(
              this.feeInMillis,
              this.maxGoal,
              this.openingTime,
              this.closingTime,
              onlusWallet,
              this.token.address,
              false,
              additionalManager,
              { from: owner }
            );
            await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

            const withdrawAmount = new BigNumber(200);
            await shouldFail.reverting(
              this.mock.withdrawFees(anyone, withdrawAmount, { from: owner })
            );
          });
        });

        describe('withdraw after end', function () {
          it('success', async function () {
            this.mock = await CharityProject.new(
              this.feeInMillis,
              this.maxGoal,
              this.openingTime,
              this.closingTime,
              onlusWallet,
              this.token.address,
              false,
              additionalManager,
              { from: owner }
            );
            await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

            await time.increaseTo(this.afterClosingTime);

            const withdrawAmount = new BigNumber(200);
            await this.mock.withdrawFees(anyone, withdrawAmount, { from: owner });
          });
        });

        describe('withdraw before end with closing time equal to 0', function () {
          it('success', async function () {
            this.mock = await CharityProject.new(
              this.feeInMillis,
              this.maxGoal,
              this.openingTime,
              0,
              onlusWallet,
              this.token.address,
              false,
              additionalManager,
              { from: owner }
            );
            await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

            const withdrawAmount = new BigNumber(200);
            await this.mock.withdrawFees(anyone, withdrawAmount, { from: owner });
          });
        });
      });
    });
  });

  context('checking total raised', function () {
    describe('after creation', function () {
      it('should be zero', async function () {
        const raised = await this.mock.totalRaised();
        raised.should.be.bignumber.equal(0);
      });
    });

    describe('after donation', function () {
      it('should be equal to donation', async function () {
        const tokenAmount = new BigNumber(20000);
        await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

        const raised = await this.mock.totalRaised();
        raised.should.be.bignumber.equal(tokenAmount);
      });
    });

    describe('after withdraw', function () {
      it('should be equal to donation', async function () {
        const tokenAmount = new BigNumber(20000);
        await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

        const withdrawAmount = new BigNumber(200);
        await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner });

        const raised = await this.mock.totalRaised();
        raised.should.be.bignumber.equal(tokenAmount);
      });
    });

    describe('after withdraw of tokens and fee', function () {
      it('should be equal to donation', async function () {
        const tokenAmount = new BigNumber(20000);
        await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

        const withdrawAmount = new BigNumber(200);
        await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner });
        await this.mock.withdrawFees(anyone, withdrawAmount, { from: owner });

        const raised = await this.mock.totalRaised();
        raised.should.be.bignumber.equal(tokenAmount);
      });
    });
  });

  context('checking total fee', function () {
    describe('after creation', function () {
      it('should be zero', async function () {
        const totalFee = await this.mock.totalFee();
        totalFee.should.be.bignumber.equal(0);
      });
    });

    describe('after donation', function () {
      it('should be equal to a percent of donation', async function () {
        const tokenAmount = new BigNumber(20000);
        await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

        const totalFee = await this.mock.totalFee();
        totalFee.should.be.bignumber.equal(tokenAmount.mul(this.feeInMillis).div(1000));
      });
    });

    describe('after withdraw', function () {
      it('should be equal to a percent of donation', async function () {
        const tokenAmount = new BigNumber(20000);
        await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

        const withdrawAmount = new BigNumber(200);
        await this.mock.withdrawFees(anyone, withdrawAmount, { from: owner });

        const totalFee = await this.mock.totalFee();
        totalFee.should.be.bignumber.equal(tokenAmount.mul(this.feeInMillis).div(1000));
      });
    });

    describe('after withdraw of fee and tokens', function () {
      it('should be equal to a percent of donation', async function () {
        const tokenAmount = new BigNumber(20000);
        await this.token.transfer(this.mock.address, tokenAmount, { from: userWallet });

        const withdrawAmount = new BigNumber(200);
        await this.mock.withdrawFees(anyone, withdrawAmount, { from: owner });
        await this.mock.withdrawTokens(onlusWallet, withdrawAmount, { from: owner });

        const totalFee = await this.mock.totalFee();
        totalFee.should.be.bignumber.equal(tokenAmount.mul(this.feeInMillis).div(1000));
      });
    });
  });

  context('recover tokens from contract', function () {
    const tokenAmount = new BigNumber(1000);

    beforeEach(async function () {
      this.anotherERC20 = await ERC20Mock.new(this.mock.address, tokenAmount, { from: owner });
    });

    describe('if owner is calling', function () {
      it('should safe transfer any ERC20 sent for error into the contract', async function () {
        const contractPre = await this.anotherERC20.balanceOf(this.mock.address);
        contractPre.should.be.bignumber.equal(tokenAmount);
        const anyonePre = await this.anotherERC20.balanceOf(anyone);
        anyonePre.should.be.bignumber.equal(0);

        await this.mock.recoverERC20(this.anotherERC20.address, anyone, tokenAmount, { from: owner });

        const contractPost = await this.anotherERC20.balanceOf(this.mock.address);
        contractPost.should.be.bignumber.equal(0);
        const anyonePost = await this.anotherERC20.balanceOf(anyone);
        anyonePost.should.be.bignumber.equal(tokenAmount);
      });

      describe('if trying to transfer project funds', function () {
        it('reverts', async function () {
          await this.token.mint(this.mock.address, tokenAmount);
          await shouldFail.reverting(
            this.mock.recoverERC20(this.token.address, anyone, tokenAmount, { from: owner })
          );
        });
      });
    });

    describe('if third party is calling', function () {
      it('reverts', async function () {
        await shouldFail.reverting(
          this.mock.recoverERC20(this.anotherERC20.address, anyone, tokenAmount, { from: anyone })
        );
      });
    });
  });
});
