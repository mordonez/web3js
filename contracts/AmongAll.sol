// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title Among All Insurance Model
 * @notice Do not use this contract in production
 * @dev All function calls are currently implemented without side effects
 */
contract AmongAll {

    using SafeMath for uint256;

    uint total_users;
    uint total_claims;
    uint constant stable_value = 10 wei;
    uint constant minimum_accepts = 2;

    struct User {
        uint mobile_price;
        bool registered;
        Claim claim;
    }

    struct Claim {
        uint votes;
        C_type claim_type;
        C_status claim_status;
        mapping(address => bool) voted;
    }
    
    enum C_type {None, Loss, Damage}
    enum C_status {Unaccepted, Accepted}
    
    mapping(address => User) users;

    // @notice Register a user
    // @dev Msg.value based on the following formula: (mobile_price x stable_value). Only for unregistered users
    // @param mobile_price The value of the mobile phone
    // @return Transaction execution status
    function register(uint mobile_price) public payable returns (bool) {
        require(msg.value == mobile_price.div(stable_value), "Your share should match Equation 1");
        require(msg.value >= stable_value, "Your share should be higher than the constant defined in Equation 1");
        require(mobile_price > 0, "Mobile price should be higher than 0");
        require(users[msg.sender].registered == false, "User already registered!");

        users[msg.sender].registered = true;
        users[msg.sender].mobile_price = mobile_price;

        total_users++;

        return true;
    }
    
    // @notice Create a claim
    // @dev Only if a claim was not created previously. Only for registered users
    // @param claim_type The type of claim (Loss = 1, Damage = 2)
    // @return Transaction execution status
    function createClaim(C_type claim_type) external returns (bool) {
        require(users[msg.sender].claim.claim_type == C_type.None, "Claim type already defined!");
        require(users[msg.sender].registered == true, "User not registered!");
        
        users[msg.sender].claim.claim_type = claim_type;

        total_claims++;
        
        return true;
    }
    
    // @notice Accept a claim
    // @dev Only registered users can accept claims from other users. It is required a #minimum_accepts of approvals
    // @param _address The address of the user whose request you want to accept
    // @return Transaction execution status    
    function acceptClaim(address _address) external returns (bool) {
        require(_address != msg.sender, "You cannot accept your own claim!");
        require(users[_address].claim.claim_status == C_status.Unaccepted, "Claim already accepted!");
        require(users[msg.sender].registered == true, "User not registered!");
        require(users[_address].claim.voted[msg.sender] == false, "You already voted for this claim!");
        require(users[_address].claim.votes < minimum_accepts, "Minimum number of accepts reached!");
        
        users[_address].claim.voted[msg.sender] = true;
        ++users[_address].claim.votes;
        
        if(users[_address].claim.votes == minimum_accepts){
            users[_address].claim.claim_status = C_status.Accepted;    
        }

        return true;
    }

    // @notice Execute the claim and withdraw the funds.
    // @dev Only for accecpted claims
    // @return Transaction execution status    
    function executeClaim() external returns (bool) {
        require(users[msg.sender].claim.claim_status == C_status.Accepted, "Claim does not have the Accepted status!");
        
        uint amount = users[msg.sender].mobile_price;
        
        if(users[msg.sender].claim.claim_type == C_type.Loss) {
            (bool success, ) = msg.sender.call{value: amount.mul(95).div(100)}("");
            require(success, "Transfer failed.");    
        } else {
            (bool success, ) = msg.sender.call{value: amount.mul(55).div(100)}("");
            require(success, "Transfer failed.");
        }

        delete users[msg.sender];
        
        return true;
    }

    // @notice Avoid sending Ether to the contract.
    receive() external payable {
        revert();
    }
    
    // @notice Get the total balance
    // @return The ether stored in the contract
    function getTotalBalance() public view returns (uint) {
        return address(this).balance;
    }

    // @notice Get the total of users registered
    // @return Number of users registered   
    function getTotalUsers() public view returns (uint) {
        return total_users;
    }

    // @notice Get the total of claims
    // @return Number of claims
    function getTotalClaims() public view returns (uint) {
        return total_claims;
    }

    // @notice Get the mobile phone price
    // @return The mobile phone value
    function getMobilePrice(address _address) public view returns (uint) {
        return (users[_address].mobile_price);
    }

    // @notice Get the status of a claim
    // @param _address The address of the user whose request status you want to check
    // @return The status of the claim
    function getClaimStatus (address _address) public view returns (C_status) {
        return users[_address].claim.claim_status;
    }
}