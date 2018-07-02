pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./RBACManager.sol";


contract CharityProject is RBACManager {
  using SafeMath for uint256;

  modifier canWithdraw() {
    // solium-disable-next-line security/no-block-members
    require(canWithdrawBeforeEnd || closingTime == 0 || block.timestamp > closingTime);
    _;
  }

  uint256 public withdrawn;

  uint256 public maxGoal;
  uint256 public openingTime;
  uint256 public closingTime;
  address public wallet;
  ERC20 public token;
  bool public canWithdrawBeforeEnd;

  constructor (
    uint256 _maxGoal,
    uint256 _openingTime,
    uint256 _closingTime,
    address _wallet,
    ERC20 _token,
    bool _canWithdrawBeforeEnd,
    address _additionalManager
  ) public {
    require(_wallet != address(0));
    require(_token != address(0));
    require(_closingTime == 0 || _closingTime >= _openingTime);

    maxGoal = _maxGoal;
    openingTime = _openingTime;
    closingTime = _closingTime;
    wallet = _wallet;
    token = _token;
    canWithdrawBeforeEnd = _canWithdrawBeforeEnd;

    if (wallet != owner) {
      addManager(wallet);
    }

    if (_additionalManager != address(0) && _additionalManager != owner && _additionalManager != wallet) {
      addManager(_additionalManager);
    }
  }

  function withdrawTokens(address _to, uint256 _value) onlyOwnerOrManager canWithdraw public {
    token.transfer(_to, _value);
    withdrawn = withdrawn.add(_value);
  }

  function totalRaised() public view returns (uint256) {
    uint256 raised = token.balanceOf(this);
    return raised.add(withdrawn);
  }

  function hasStarted() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return openingTime == 0 ? true : block.timestamp > openingTime;
  }

  function hasClosed() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return closingTime == 0 ? false : block.timestamp > closingTime;
  }

  function maxGoalReached() public view returns (bool) {
    return totalRaised() >= maxGoal;
  }

  function setMaxGoal(uint256 _newMaxGoal) onlyOwner public {
    maxGoal = _newMaxGoal;
  }

  function setTimes(uint256 _openingTime, uint256 _closingTime) onlyOwner public {
    require(_closingTime == 0 || _closingTime >= _openingTime);

    openingTime = _openingTime;
    closingTime = _closingTime;
  }

  function setCanWithdrawBeforeEnd(bool _canWithdrawBeforeEnd) onlyOwner public {
    canWithdrawBeforeEnd = _canWithdrawBeforeEnd;
  }
}
