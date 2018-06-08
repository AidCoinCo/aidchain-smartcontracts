pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./RBACManager.sol";


contract CharityProject is RBACManager {
  uint256 public goal;
  uint256 public openingTime;
  uint256 public closingTime;
  address public wallet;
  ERC20 public token;
  bool public canWithdrawBeforeEnd;

  constructor (
    uint256 _goal,
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

    goal = _goal;
    openingTime = _openingTime;
    closingTime = _closingTime;
    wallet = _wallet;
    token = _token;
    canWithdrawBeforeEnd = _canWithdrawBeforeEnd;

    if (wallet != owner) {
      addRole(wallet, ROLE_MANAGER);
    }

    if (_additionalManager != owner && _additionalManager != wallet) {
      addRole(_additionalManager, ROLE_MANAGER);
    }
  }

  function hasStarted() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return openingTime == 0 ? true : block.timestamp > openingTime;
  }

  function hasClosed() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return closingTime == 0 ? false : block.timestamp > closingTime;
  }

  function goalReached() public view returns (bool) {
    return token.balanceOf(this) >= goal;
  }
}
