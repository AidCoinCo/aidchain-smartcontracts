pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./access/RBACManager.sol";


contract CharityProject is RBACManager {
  using SafeMath for uint256;

  modifier canWithdraw() {
    require(
      canWithdrawBeforeEnd || closingTime == 0 || block.timestamp > closingTime, // solium-disable-line security/no-block-members
      "can't withdraw");
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
    require(_wallet != address(0), "_wallet can't be zero");
    require(_token != address(0), "_token can't be zero");
    require(
      _closingTime == 0 || _closingTime >= _openingTime,
      "wrong value for _closingTime"
    );

    maxGoal = _maxGoal;
    openingTime = _openingTime;
    closingTime = _closingTime;
    wallet = _wallet;
    token = _token;
    canWithdrawBeforeEnd = _canWithdrawBeforeEnd;

    if (wallet != owner) {
      addManager(wallet);
    }

    // solium-disable-next-line max-len
    if (_additionalManager != address(0) && _additionalManager != owner && _additionalManager != wallet) {
      addManager(_additionalManager);
    }
  }

  function withdrawTokens(
    address _to,
    uint256 _value
  )
  public
  onlyOwnerOrManager
  canWithdraw
  {
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

  function setMaxGoal(uint256 _newMaxGoal) public onlyOwner {
    maxGoal = _newMaxGoal;
  }

  function setTimes(
    uint256 _openingTime,
    uint256 _closingTime
  )
  public
  onlyOwner
  {
    require(
      _closingTime == 0 || _closingTime >= _openingTime,
      "wrong value for _closingTime"
    );

    openingTime = _openingTime;
    closingTime = _closingTime;
  }

  function setCanWithdrawBeforeEnd(
    bool _canWithdrawBeforeEnd
  )
  public
  onlyOwner
  {
    canWithdrawBeforeEnd = _canWithdrawBeforeEnd;
  }

  function recoverERC20(
    address _tokenAddress,
    address _receiverAddress,
    uint256 _tokens
  )
  public
  onlyOwnerOrManager
  returns (bool success)
  {
    require(
      _tokenAddress != address(token),
      "to transfer project's funds use withdrawTokens"
    );
    return ERC20Basic(_tokenAddress).transfer(_receiverAddress, _tokens);
  }
}
