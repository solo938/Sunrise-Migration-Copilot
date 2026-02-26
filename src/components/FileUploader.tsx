import { useState, useCallback, useRef } from "react";

interface Props {
  onFileLoaded: (source: string, fileName: string) => void;
}

// Sample ERC-20 contract for demo purposes
const SAMPLE_ERC20 = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SunriseToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;
    uint256 public mintingFee = 0.001 ether;

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public lastMintedAt;

    event Whitelisted(address indexed account, bool status);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address initialOwner)
        ERC20("Sunrise Token", "SUNR")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 100_000_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external payable {
        require(whitelist[msg.sender], "Not whitelisted");
        require(msg.value >= mintingFee, "Insufficient fee");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(block.timestamp >= lastMintedAt[msg.sender] + 1 days, "Cooldown active");
        lastMintedAt[msg.sender] = block.timestamp;
        _mint(to, amount);
    }

    function setWhitelist(address account, bool status) external onlyOwner {
        whitelist[account] = status;
        emit Whitelisted(account, status);
    }

    function setMintingFee(uint256 newFee) external onlyOwner {
        emit FeeUpdated(mintingFee, newFee);
        mintingFee = newFee;
    }

    function withdrawFees() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
}`;

const SAMPLE_ERC721 = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SunriseNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public maxSupply = 10000;
    mapping(uint256 => string) private _tokenURIs;
    mapping(address => uint256[]) private _ownedTokens;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor() ERC721("Sunrise NFT", "SNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, string calldata uri) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        _ownedTokens[to].push(tokenId);
        emit NFTMinted(to, tokenId, uri);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }
}`;

const SAMPLE_DEFI = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingPool is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public rewardRate = 100;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userRewardPerTokenPaid;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _stakingToken, address _rewardToken, address owner)
        Ownable(owner)
    {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        stakes[msg.sender] += amount;
        stakingToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        stakes[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        return rewardPerTokenStored;
    }

    function earned(address account) public view returns (uint256) {
        return stakes[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18 + rewards[account];
    }
}`;

const EXAMPLES = [
  { label: "ERC-20 Token", source: SAMPLE_ERC20, file: "SunriseToken.sol" },
  { label: "ERC-721 NFT", source: SAMPLE_ERC721, file: "SunriseNFT.sol" },
  { label: "DeFi Staking", source: SAMPLE_DEFI, file: "StakingPool.sol" },
];

export default function FileUploader({ onFileLoaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileLoaded(e.target?.result as string, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".sol")) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, letterSpacing: -0.5 }}>
          Migrate your EVM contract to{" "}
          <span style={{ background: "linear-gradient(90deg, #9945ff, #19fb9b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Solana
          </span>
        </h2>
        <p style={{ color: "var(--text2)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
          Upload a Solidity contract and get an instant analysis with Anchor skeleton generation,
          account model mappings, token bridge plan via Wormhole NTT, and cost comparison.
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone ${dragging ? "drag-over" : ""}`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".sol"
          onChange={onInputChange}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="upload-icon">📄</span>
        <h3 className="upload-title">Drop your .sol file here</h3>
        <p className="upload-sub">or click to browse — supports any EVM Solidity contract</p>
        <button className="upload-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
          Choose File
        </button>
      </div>

      {/* Example contracts */}
      <div className="example-contracts">
        <p className="example-title">Try an example</p>
        <div className="example-chips">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              className="example-chip"
              onClick={() => onFileLoaded(ex.source, ex.file)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid-3" style={{ marginTop: 48 }}>
        {[
          { icon: "🔍", title: "Contract Analysis", desc: "AST parsing extracts functions, state variables, events, and token standards" },
          { icon: "🗺", title: "Account Mapping", desc: "Rule-based EVM→Solana mapping with PDA suggestions and Anchor snippets" },
          { icon: "⚓", title: "Anchor Skeleton", desc: "Auto-generated lib.rs, Anchor.toml, Cargo.toml, and TypeScript tests" },
          { icon: "🌉", title: "Token Bridge", desc: "Step-by-step Wormhole NTT migration plan with Sunrise liquidity routing" },
          { icon: "💰", title: "Cost Comparison", desc: "Real-time gas vs. compute unit / rent cost breakdown" },
          { icon: "✅", title: "Migration Checklist", desc: "Exportable Markdown/PDF checklist covering security, deployment, and testing" },
        ].map((f) => (
          <div className="stat-box" key={f.title}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}