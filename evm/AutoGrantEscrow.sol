// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract AutoGrantEscrow is Ownable {
    using ECDSA for bytes32;

    IERC20 public usdc;
    address public genLayerRelayer; // The address authorized to relay GenLayer consensus results
    uint256 public defaultGrantAmount;

    mapping(bytes32 => bool) public processedGrants;

    event GrantPaid(address indexed builder, string githubUrl, uint256 amount);

    constructor(address _usdc, address _genLayerRelayer, uint256 _defaultGrantAmount) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        genLayerRelayer = _genLayerRelayer;
        defaultGrantAmount = _defaultGrantAmount;
    }

    // This function is called by the builder/frontend with a signature from the GenLayer Relayer
    // confirming that the Intelligent Contract's validators approved the grant.
    function claimGrant(string memory githubUrl, bytes memory signature) external {
        bytes32 appId = keccak256(abi.encodePacked(msg.sender, githubUrl));
        require(!processedGrants[appId], "Grant already processed");

        // The message hash that GenLayer (or our relayer) signs
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, githubUrl, "APPROVED"));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        // Recover the signer
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == genLayerRelayer, "Invalid GenLayer signature");

        // Mark as processed and pay out
        processedGrants[appId] = true;
        require(usdc.transfer(msg.sender, defaultGrantAmount), "USDC transfer failed");

        emit GrantPaid(msg.sender, githubUrl, defaultGrantAmount);
    }

    // Owner can deposit USDC for grants
    function depositFunds(uint256 amount) external onlyOwner {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Deposit failed");
    }

    function setRelayer(address _relayer) external onlyOwner {
        genLayerRelayer = _relayer;
    }
}
