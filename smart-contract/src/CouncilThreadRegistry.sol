// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @notice On-chain record of every debate thread: who submitted it, and every AI-generated
/// post and verdict tied to it (hash only, full text lives off-chain). Data lives in real
/// contract storage, not just emitted events — readable back in full via getThread(). A post
/// or verdict must be recorded here successfully before it is ever accepted off-chain.
/// Each agent's post/verdict must be submitted by the wallet that actually owns that agent's
/// ERC-8004 identity NFT (from the real IdentityRegistry) — not a shared backend key.
contract CouncilThreadRegistry is Ownable {
    struct Post {
        uint256 agentId;
        uint8 round;
        uint16 sequence;
        bytes32 contentHash;
        uint40 timestamp;
    }

    struct Verdict {
        uint256 agentId;
        uint8 score;
        bytes32 verdictHash;
        uint40 timestamp;
    }

    struct Thread {
        address author;
        bytes32 ideaHash;
        uint40 openedAt;
        bool opened;
        bool hasVerdict;
        Verdict verdict;
        Post[] posts;
    }

    event ThreadOpened(bytes32 indexed threadId, address indexed author, bytes32 ideaHash, uint256 timestamp);
    event PostRecorded(
        bytes32 indexed threadId,
        uint256 agentId,
        uint8 round,
        uint16 sequence,
        bytes32 contentHash,
        uint256 timestamp
    );
    event VerdictRecorded(bytes32 indexed threadId, uint256 agentId, uint8 score, bytes32 verdictHash, uint256 timestamp);

    mapping(bytes32 => Thread) private threads;
    address public writer;
    IERC721 public immutable identityRegistry;

    modifier onlyWriter() {
        require(msg.sender == writer, "Not authorized writer");
        _;
    }

    modifier onlyAgentOwner(uint256 agentId) {
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not this agent's registered wallet");
        _;
    }

    constructor(address initialOwner, address initialWriter, address identityRegistryAddress) Ownable(initialOwner) {
        writer = initialWriter;
        identityRegistry = IERC721(identityRegistryAddress);
    }

    function setWriter(address newWriter) external onlyOwner {
        writer = newWriter;
    }

    function openThread(bytes32 threadId, address author, bytes32 ideaHash) external onlyWriter {
        require(!threads[threadId].opened, "Thread already opened");
        Thread storage t = threads[threadId];
        t.author = author;
        t.ideaHash = ideaHash;
        t.openedAt = uint40(block.timestamp);
        t.opened = true;
        emit ThreadOpened(threadId, author, ideaHash, block.timestamp);
    }

    function recordPost(
        bytes32 threadId,
        uint256 agentId,
        uint8 round,
        bytes32 contentHash
    ) external onlyAgentOwner(agentId) returns (uint16 sequence) {
        Thread storage t = threads[threadId];
        require(t.opened, "Thread not opened");
        sequence = uint16(t.posts.length + 1);
        t.posts.push(
            Post({
                agentId: agentId,
                round: round,
                sequence: sequence,
                contentHash: contentHash,
                timestamp: uint40(block.timestamp)
            })
        );
        emit PostRecorded(threadId, agentId, round, sequence, contentHash, block.timestamp);
    }

    function recordVerdict(
        bytes32 threadId,
        uint256 agentId,
        uint8 score,
        bytes32 verdictHash
    ) external onlyAgentOwner(agentId) {
        Thread storage t = threads[threadId];
        require(t.opened, "Thread not opened");
        require(!t.hasVerdict, "Verdict already recorded");
        t.verdict = Verdict({ agentId: agentId, score: score, verdictHash: verdictHash, timestamp: uint40(block.timestamp) });
        t.hasVerdict = true;
        emit VerdictRecorded(threadId, agentId, score, verdictHash, block.timestamp);
    }

    function getThread(bytes32 threadId) external view returns (Thread memory) {
        return threads[threadId];
    }

    function getPostCount(bytes32 threadId) external view returns (uint256) {
        return threads[threadId].posts.length;
    }
}
