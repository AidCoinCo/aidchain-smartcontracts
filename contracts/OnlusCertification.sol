pragma solidity ^0.4.24;

import "./access/RBACManager.sol";


contract OnlusCertification is RBACManager {
  mapping (address => uint256) public walletMapping;

  function addWalletCertification(
    address _wallet,
    uint256 _id
  )
  public
  onlyOwnerOrManager
  {
    require(_id > 0, "_id must be greater than zero");
    walletMapping[_wallet] = _id;
  }

  function removeWalletCertification(
    address _wallet
  )
  public
  onlyOwnerOrManager
  {
    require(walletMapping[_wallet] != 0, "mapping for _wallet should exist");
    walletMapping[_wallet] = 0;
  }
}
