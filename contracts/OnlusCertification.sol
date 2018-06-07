pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/rbac/RBAC.sol";


contract OnlusCertification is RBAC, Ownable {

  string constant ROLE_MANAGER = "manager";

  mapping (address => uint256) public walletMapping;

  modifier onlyOwnerOrManager()
  {
    require(msg.sender == owner || hasRole(msg.sender, ROLE_MANAGER));
    _;
  }

  constructor() public {
    addRole(msg.sender, ROLE_MANAGER);
  }

  function addWalletCertification(address _wallet, uint256 _id) onlyOwnerOrManager public {
    require(_id > 0);
    walletMapping[_wallet] = _id;
  }

  function removeWalletCertification(address _wallet) onlyOwnerOrManager public {
    require(walletMapping[_wallet] != 0);
    walletMapping[_wallet] = 0;
  }

  function addManager(address _manager) onlyOwner public {
    addRole(_manager, ROLE_MANAGER);
  }

  function removeManager(address _manager) onlyOwner public {
    removeRole(_manager, ROLE_MANAGER);
  }
}
