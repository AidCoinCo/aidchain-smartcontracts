pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "./access/RBACManager.sol";


contract CharityProject is RBACManager {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  modifier canWithdraw() {
    require(
      _canWithdrawBeforeEnd || _closingTime == 0 || block.timestamp > _closingTime, // solium-disable-line security/no-block-members
      "can't withdraw");
    _;
  }

  uint256 private _feeInMillis;
  uint256 private _withdrawn;
  uint256 private _maxGoal;
  uint256 private _openingTime;
  uint256 private _closingTime;
  address private _wallet;
  IERC20 private _token;
  bool private _canWithdrawBeforeEnd;

  constructor (
    uint256 feeInMillis,
    uint256 maxGoal,
    uint256 openingTime,
    uint256 closingTime,
    address wallet,
    IERC20 token,
    bool canWithdrawBeforeEnd,
    address additionalManager
  ) public {
    require(wallet != address(0), "wallet can't be zero");
    require(token != address(0), "token can't be zero");
    require(
      closingTime == 0 || closingTime >= openingTime,
      "wrong value for closingTime"
    );

    _feeInMillis = feeInMillis;
    _maxGoal = maxGoal;
    _openingTime = openingTime;
    _closingTime = closingTime;
    _wallet = wallet;
    _token = token;
    _canWithdrawBeforeEnd = canWithdrawBeforeEnd;

    if (_wallet != owner()) {
      addManager(_wallet);
    }

    // solium-disable-next-line max-len
    if (additionalManager != address(0) && additionalManager != owner() && additionalManager != _wallet) {
      addManager(additionalManager);
    }
  }

  // -----------------------------------------
  // GETTERS
  // -----------------------------------------

  function feeInMillis() public view returns(uint256) {
    return _feeInMillis;
  }

  function withdrawn() public view returns(uint256) {
    return _withdrawn;
  }

  function maxGoal() public view returns(uint256) {
    return _maxGoal;
  }

  function openingTime() public view returns(uint256) {
    return _openingTime;
  }

  function closingTime() public view returns(uint256) {
    return _closingTime;
  }

  function wallet() public view returns(address) {
    return _wallet;
  }

  function token() public view returns(IERC20) {
    return _token;
  }

  function canWithdrawBeforeEnd() public view returns(bool) {
    return _canWithdrawBeforeEnd;
  }

  // -----------------------------------------
  // SETTERS
  // -----------------------------------------

  function setMaxGoal(uint256 newMaxGoal) public onlyOwner {
    _maxGoal = newMaxGoal;
  }

  function setTimes(
    uint256 newOpeningTime,
    uint256 newClosingTime
  )
  public
  onlyOwner
  {
    require(
      newClosingTime == 0 || newClosingTime >= newOpeningTime,
      "wrong value for closingTime"
    );

    _openingTime = newOpeningTime;
    _closingTime = newClosingTime;
  }

  function setCanWithdrawBeforeEnd(
    bool newCanWithdrawBeforeEnd
  )
  public
  onlyOwner
  {
    _canWithdrawBeforeEnd = newCanWithdrawBeforeEnd;
  }

  // -----------------------------------------
  // CHECKS
  // -----------------------------------------

  function totalRaised() public view returns (uint256) {
    uint256 raised = _token.balanceOf(this);
    return raised.add(_withdrawn);
  }

  function hasStarted() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return _openingTime == 0 ? true : block.timestamp > _openingTime;
  }

  function hasClosed() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return _closingTime == 0 ? false : block.timestamp > _closingTime;
  }

  function maxGoalReached() public view returns (bool) {
    return totalRaised() >= _maxGoal;
  }

  // -----------------------------------------
  // ACTIONS
  // -----------------------------------------

  function withdrawTokens(
    address to,
    uint256 value
  )
  public
  onlyOwnerOrManager
  canWithdraw
  {
    _token.safeTransfer(to, value);
    _withdrawn = _withdrawn.add(value);
  }

  function recoverERC20(
    address tokenAddress,
    address receiverAddress,
    uint256 amount
  )
  public
  onlyOwnerOrManager
  {
    require(
      tokenAddress != address(_token),
      "to transfer project's funds use withdrawTokens"
    );
    IERC20(tokenAddress).safeTransfer(receiverAddress, amount);
  }
}
