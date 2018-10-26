pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/access/Roles.sol";

contract RBACManager is Ownable {
  using Roles for Roles.Role;

  event ManagerAdded(address indexed account);
  event ManagerRemoved(address indexed account);

  Roles.Role private managers;

  modifier onlyOwnerOrManager() {
    require(
      msg.sender == owner() || isManager(msg.sender),
      "unauthorized"
    );
    _;
  }

  constructor() public {
    addManager(msg.sender);
  }

  function isManager(address account) public view returns (bool) {
    return managers.has(account);
  }

  function addManager(address account) public onlyOwner {
    managers.add(account);
    emit ManagerAdded(account);
  }

  function removeManager(address account) public onlyOwner {
    managers.remove(account);
    emit ManagerRemoved(account);
  }
}
