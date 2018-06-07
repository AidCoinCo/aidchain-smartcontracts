pragma solidity ^0.4.24;

import "./RBACManager.sol";


contract OnlusCertification is RBACManager {
  mapping (address => uint256) public walletMapping;

  function addWalletCertification(address _wallet, uint256 _id) onlyOwnerOrManager public {
    require(_id > 0);
    walletMapping[_wallet] = _id;
  }

  function removeWalletCertification(address _wallet) onlyOwnerOrManager public {
    require(walletMapping[_wallet] != 0);
    walletMapping[_wallet] = 0;
  }
}
