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

  uint256 public totalRaised;
  uint256 public withdrawn;

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

    if (_additionalManager != address(0) && _additionalManager != owner && _additionalManager != wallet) {
      addRole(_additionalManager, ROLE_MANAGER);
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

  function goalReached() public view returns (bool) {
    return token.balanceOf(this) >= goal;
  }
}
