// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract FIRSystem is Initializable, AccessControlUpgradeable {
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    struct FIR {
        string complainantName;
        string complainantContact;
        string incidentType;
        uint256 incidentDateTime;
        string incidentLocation;
        string description;
        string[] suspects;
        string[] victims;
        string[] witnesses;
        address complainant;
        uint256 timestampFiled;
        address officer; // Assigned officer (set by admin)
        string status;   // "Filed", "In Progress", "Not Valid", "Closed"
        bytes32[] evidenceHashes;
        string closureComment;
    }

    struct RegistrationRequest {
        bytes32[] documentHashes;
        bool exists;
    }

    mapping(uint256 => FIR) private firs;
    uint256 public firCount;

    mapping(address => RegistrationRequest) private pendingUsers;
    address[] private pendingUsersList;

    // Events
    event RegistrationRequested(address indexed user, bytes32[] documentHashes);
    event UserVerified(address indexed user);
    event FIRRegistered(
        uint256 indexed firId,
        address indexed complainant,
        string complainantName,
        string incidentType,
        uint256 incidentDateTime,
        string incidentLocation
    );
    event FIRAssigned(uint256 indexed firId, address indexed officer);
    event FIRValidated(uint256 indexed firId, bool isValid, address indexed officer);
    event FIRStatusUpdated(uint256 indexed firId, string status, address indexed officer);
    event FIRClosed(uint256 indexed firId, address indexed officer, string closureComment);

    function initialize(address admin) public initializer {
        require(admin != address(0), "Invalid admin address");
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        firCount = 0;
    }

    // ========== User Registration ==========
    function requestRegistration(bytes32[] memory documentHashes) external {
        require(!pendingUsers[msg.sender].exists, "Already pending");
        require(!hasRole(USER_ROLE, msg.sender), "Already registered");
        require(!hasRole(OFFICER_ROLE, msg.sender), "Officers cannot self-register as users");
        require(documentHashes.length > 0, "At least one document hash");

        pendingUsers[msg.sender] = RegistrationRequest({
            documentHashes: documentHashes,
            exists: true
        });
        pendingUsersList.push(msg.sender);

        emit RegistrationRequested(msg.sender, documentHashes);
    }

    function getPendingUsers() public view returns (address[] memory) {
        return pendingUsersList;
    }

    function getUserDocumentHashes(address user) public view returns (bytes32[] memory) {
        require(pendingUsers[user].exists, "User not found");
        return pendingUsers[user].documentHashes;
    }

    function verifyUser(address user) external onlyRole(OFFICER_ROLE) {
        require(pendingUsers[user].exists, "User not pending verification");
        delete pendingUsers[user];
        for (uint256 i = 0; i < pendingUsersList.length; i++) {
            if (pendingUsersList[i] == user) {
                pendingUsersList[i] = pendingUsersList[pendingUsersList.length - 1];
                pendingUsersList.pop();
                break;
            }
        }
        _grantRole(USER_ROLE, user);
        emit UserVerified(user);
    }

    // =========== Officer/Admin Management ==============
    function addOfficer(address officer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(officer != address(0), "Invalid officer address");
        _grantRole(OFFICER_ROLE, officer);
    }

    // Admin assigns an officer to a FIR
    function assignOfficerToFIR(uint256 firId, address officerAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        FIR storage fir = firs[firId];
        require(fir.complainant != address(0), "FIR does not exist");
        require(officerAddr != address(0), "Invalid officer address");
        require(hasRole(OFFICER_ROLE, officerAddr), "Address is not an officer");
        require(fir.officer == address(0), "Officer already assigned");
        fir.officer = officerAddr;
        emit FIRAssigned(firId, officerAddr);
    }

    // Anyone with permission can view the assigned officer
    function getFIROfficer(uint256 firId) public view returns (address) {
        FIR storage fir = firs[firId];
        require(fir.complainant != address(0), "FIR does not exist");
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(OFFICER_ROLE, msg.sender) ||
            msg.sender == fir.complainant,
            "Access denied"
        );
        return fir.officer;
    }

    // ========== FIR Filing and Workflow ==========
    function fileFIR(
        string memory complainantName,
        string memory complainantContact,
        string memory incidentType,
        uint256 incidentDateTime,
        string memory incidentLocation,
        string memory description,
        string[] memory suspects,
        string[] memory victims,
        string[] memory witnesses,
        bytes32[] memory evidenceHashes
    ) external onlyRole(USER_ROLE) {
        require(bytes(complainantName).length > 0, "Complainant name required");
        require(bytes(incidentType).length > 0, "Incident type required");
        require(incidentDateTime <= block.timestamp, "Incident date can't be in future");
        require(bytes(incidentLocation).length > 0, "Incident location required");
        require(bytes(description).length > 0, "Description cannot be empty");

        firCount++;
        firs[firCount] = FIR({
            complainantName: complainantName,
            complainantContact: complainantContact,
            incidentType: incidentType,
            incidentDateTime: incidentDateTime,
            incidentLocation: incidentLocation,
            description: description,
            suspects: suspects,
            victims: victims,
            witnesses: witnesses,
            complainant: msg.sender,
            timestampFiled: block.timestamp,
            officer: address(0),
            status: "Filed",
            evidenceHashes: evidenceHashes,
            closureComment: ""
        });

        emit FIRRegistered(firCount, msg.sender, complainantName, incidentType, incidentDateTime, incidentLocation);
    }

    // Officer validates FIR: true (In Progress) or false (Not Valid)
    function validateFIR(uint256 firId, bool isValid) external onlyRole(OFFICER_ROLE) {
        FIR storage fir = firs[firId];
        require(fir.complainant != address(0), "FIR does not exist");
        require(fir.officer == msg.sender, "Officer not assigned to this FIR");
        require(_compareStrings(fir.status, "Filed"), "Already validated");

        if (isValid) {
            fir.status = "In Progress";
        } else {
            fir.status = "Not Valid";
        }
        emit FIRValidated(firId, isValid, msg.sender);
        emit FIRStatusUpdated(firId, fir.status, msg.sender);
    }

    // Officer can close FIR only if 'In Progress'; logs comment
    function closeFIR(uint256 firId, string memory closureComment) external onlyRole(OFFICER_ROLE) {
        FIR storage fir = firs[firId];
        require(fir.complainant != address(0), "FIR does not exist");
        require(fir.officer == msg.sender, "Officer not assigned to this FIR");
        require(_compareStrings(fir.status, "In Progress"), "FIR not In Progress");

        fir.status = "Closed";
        fir.closureComment = closureComment;
        emit FIRClosed(firId, msg.sender, closureComment);
        emit FIRStatusUpdated(firId, "Closed", msg.sender);
    }

    // Strict view: only admin, assigned officer, or complainant
   function getFIR(uint256 firId) external view returns (FIR memory) {
        FIR memory fir = firs[firId];
        require(fir.complainant != address(0), "FIR does not exist");

        // Access restriction:
        // Only Admin, Officer or the FIR filing user can view
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(OFFICER_ROLE, msg.sender) ||
            msg.sender == fir.complainant,
            "Access denied: only Admin, Officer or complainant can view this FIR"
        );
        return firs[firId];
    }


    // Helper: string comparison
    function _compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
