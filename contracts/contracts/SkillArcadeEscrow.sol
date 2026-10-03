// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract SkillArcadeEscrow is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant MATCHMAKER_ROLE = keccak256("MATCHMAKER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint16 public constant P1_BPS = 5000;
    uint16 public constant P2_BPS = 2833;
    uint16 public constant P3_BPS = 1667;
    uint16 public constant BPS = 10000;

    enum MatchState { NONE, FORMING, LOCKED, SETTLED, CANCELLED }
    struct MatchInfo {
        uint96 entryAmount;
        uint64 joinDeadline;
        uint8 maxPlayers;
        uint8 joined;
        MatchState state;
    }

    IERC20 public immutable token;
    address public treasury;
    address public resultSigner;
    mapping(bytes32 => MatchInfo) public matches;
    mapping(bytes32 => mapping(address => bool)) public joined;
    mapping(bytes32 => mapping(address => bool)) public refundClaimed;

    event MatchCreated(bytes32 indexed matchId, uint256 entryAmount, uint8 maxPlayers, uint64 joinDeadline);
    event EntryLocked(bytes32 indexed matchId, address indexed player, uint256 amount, uint8 seatNumber);
    event MatchLocked(bytes32 indexed matchId);
    event MatchCancelled(bytes32 indexed matchId);
    event RefundClaimed(bytes32 indexed matchId, address indexed player, uint256 amount);
    event MatchSettled(bytes32 indexed matchId, address first, address second, address third, uint256 treasuryAmount, bytes32 resultHash);
    event ResultSignerChanged(address indexed signer);
    event TreasuryChanged(address indexed treasury);

    constructor(IERC20 token_, address treasury_, address admin_, address matchmaker_, address resultSigner_) {
        require(address(token_) != address(0) && treasury_ != address(0) && admin_ != address(0) && matchmaker_ != address(0) && resultSigner_ != address(0), "zero address");
        token = token_;
        treasury = treasury_;
        resultSigner = resultSigner_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(MATCHMAKER_ROLE, matchmaker_);
        _grantRole(PAUSER_ROLE, admin_);
    }

    function createMatch(bytes32 matchId, uint96 entryAmount, uint8 maxPlayers, uint64 joinDeadline) external onlyRole(MATCHMAKER_ROLE) whenNotPaused {
        require(matches[matchId].state == MatchState.NONE, "match exists");
        require(entryAmount > 0, "entry zero");
        require(maxPlayers >= 2 && maxPlayers <= 32, "bad player count");
        require(joinDeadline > block.timestamp, "bad deadline");
        matches[matchId] = MatchInfo(entryAmount, joinDeadline, maxPlayers, 0, MatchState.FORMING);
        emit MatchCreated(matchId, entryAmount, maxPlayers, joinDeadline);
    }

    function joinMatch(bytes32 matchId) external nonReentrant whenNotPaused {
        MatchInfo storage m = matches[matchId];
        require(m.state == MatchState.FORMING, "not forming");
        require(block.timestamp <= m.joinDeadline, "join closed");
        require(m.joined < m.maxPlayers, "full");
        require(!joined[matchId][msg.sender], "already joined");
        joined[matchId][msg.sender] = true;
        m.joined += 1;
        token.safeTransferFrom(msg.sender, address(this), m.entryAmount);
        emit EntryLocked(matchId, msg.sender, m.entryAmount, m.joined);
        if (m.joined == m.maxPlayers) {
            m.state = MatchState.LOCKED;
            emit MatchLocked(matchId);
        }
    }

    function cancelMatch(bytes32 matchId) external onlyRole(MATCHMAKER_ROLE) {
        MatchInfo storage m = matches[matchId];
        require(m.state == MatchState.FORMING || m.state == MatchState.LOCKED, "not cancellable");
        m.state = MatchState.CANCELLED;
        emit MatchCancelled(matchId);
    }

    function cancelExpiredMatch(bytes32 matchId) external {
        MatchInfo storage m = matches[matchId];
        require(m.state == MatchState.FORMING, "not forming");
        require(block.timestamp > m.joinDeadline, "not expired");
        m.state = MatchState.CANCELLED;
        emit MatchCancelled(matchId);
    }

    function claimRefund(bytes32 matchId) external nonReentrant {
        MatchInfo storage m = matches[matchId];
        require(m.state == MatchState.CANCELLED, "not cancelled");
        require(joined[matchId][msg.sender], "not participant");
        require(!refundClaimed[matchId][msg.sender], "already refunded");
        refundClaimed[matchId][msg.sender] = true;
        token.safeTransfer(msg.sender, m.entryAmount);
        emit RefundClaimed(matchId, msg.sender, m.entryAmount);
    }

    function settleMatch(bytes32 matchId, address[3] calldata winners, bytes32 resultHash, bytes calldata signature) external nonReentrant whenNotPaused {
        MatchInfo storage m = matches[matchId];
        require(m.state == MatchState.LOCKED, "not locked");
        require(winners[0] != winners[1] && winners[0] != winners[2] && winners[1] != winners[2], "duplicate winner");
        require(joined[matchId][winners[0]] && joined[matchId][winners[1]] && joined[matchId][winners[2]], "winner not participant");

        bytes32 payload = keccak256(abi.encode(address(this), block.chainid, matchId, winners, resultHash));
        address recovered = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(payload), signature);
        require(recovered == resultSigner, "bad result signature");

        m.state = MatchState.SETTLED;
        uint256 pool = uint256(m.entryAmount) * uint256(m.joined);
        uint256 p1 = pool * P1_BPS / BPS;
        uint256 p2 = pool * P2_BPS / BPS;
        uint256 p3 = pool * P3_BPS / BPS;
        uint256 fee = pool - p1 - p2 - p3; // includes rounding remainder

        token.safeTransfer(winners[0], p1);
        token.safeTransfer(winners[1], p2);
        token.safeTransfer(winners[2], p3);
        token.safeTransfer(treasury, fee);
        emit MatchSettled(matchId, winners[0], winners[1], winners[2], fee, resultHash);
    }

    function setResultSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) { require(signer != address(0), "zero signer"); resultSigner = signer; emit ResultSignerChanged(signer); }
    function setTreasury(address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) { require(treasury_ != address(0), "zero treasury"); treasury = treasury_; emit TreasuryChanged(treasury_); }
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
}
