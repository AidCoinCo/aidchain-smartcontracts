pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/access/rbac/RBAC.sol";


contract RBACManager is RBAC, Ownable {
  string constant ROLE_MANAGER = "manager";

  modifier onlyOwnerOrManager() {
    require(
      msg.sender == owner || hasRole(msg.sender, ROLE_MANAGER),
      "unauthorized"
    );
    _;
  }

  constructor() public {
    addRole(msg.sender, ROLE_MANAGER);
  }

  function addManager(address _manager) public onlyOwner {
    addRole(_manager, ROLE_MANAGER);
  }

  function removeManager(address _manager) public onlyOwner {
    removeRole(_manager, ROLE_MANAGER);
  }
}
