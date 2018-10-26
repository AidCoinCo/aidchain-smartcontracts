pragma solidity ^0.4.24;

import "./access/RBACManager.sol";

contract OnlusCertification is RBACManager {

  mapping (address => uint256) private walletMapping;

  function isWalletOf(address wallet) public view returns (uint256) {
    return walletMapping[wallet];
  }

  function addWalletCertification(
    address wallet,
    uint256 id
  )
  public
  onlyOwnerOrManager
  {
    require(id > 0, "id must be greater than zero");
    walletMapping[wallet] = id;
  }

  function removeWalletCertification(
    address wallet
  )
  public
  onlyOwnerOrManager
  {
    require(walletMapping[wallet] != 0, "mapping for wallet should exist");
    walletMapping[wallet] = 0;
  }
}
