pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/rbac/RBAC.sol";


contract RBACManager is RBAC, Ownable {
  string constant ROLE_MANAGER = "manager";

  modifier onlyOwnerOrManager() {
    require(msg.sender == owner || hasRole(msg.sender, ROLE_MANAGER));
    _;
  }

  constructor() public {
    addRole(msg.sender, ROLE_MANAGER);
  }

  function addManager(address _manager) onlyOwner public {
    addRole(_manager, ROLE_MANAGER);
  }

  function removeManager(address _manager) onlyOwner public {
    removeRole(_manager, ROLE_MANAGER);
  }
}
