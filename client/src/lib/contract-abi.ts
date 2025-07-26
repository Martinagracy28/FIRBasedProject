export const CONTRACT_ADDRESS = "0x05d897619f5B6F83e949704951FF76ffAE5c4fBf";

export const CONTRACT_ABI = [
	{
		"inputs": [],
		"name": "AccessControlBadConfirmation",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "neededRole",
				"type": "bytes32"
			}
		],
		"name": "AccessControlUnauthorizedAccount",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "officer",
				"type": "address"
			}
		],
		"name": "addOfficer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "officerAddr",
				"type": "address"
			}
		],
		"name": "assignOfficerToFIR",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "closureComment",
				"type": "string"
			}
		],
		"name": "closeFIR",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "complainantName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "complainantContact",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "incidentType",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "incidentDateTime",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "incidentLocation",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string[]",
				"name": "suspects",
				"type": "string[]"
			},
			{
				"internalType": "string[]",
				"name": "victims",
				"type": "string[]"
			},
			{
				"internalType": "string[]",
				"name": "witnesses",
				"type": "string[]"
			},
			{
				"internalType": "bytes32[]",
				"name": "evidenceHashes",
				"type": "bytes32[]"
			}
		],
		"name": "fileFIR",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "role",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "grantRole",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "admin",
				"type": "address"
			}
		],
		"name": "initialize",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "InvalidInitialization",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotInitializing",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "officer",
				"type": "address"
			}
		],
		"name": "FIRAssigned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "officer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "closureComment",
				"type": "string"
			}
		],
		"name": "FIRClosed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "complainant",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "complainantName",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "incidentType",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "incidentDateTime",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "incidentLocation",
				"type": "string"
			}
		],
		"name": "FIRRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "status",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "officer",
				"type": "address"
			}
		],
		"name": "FIRStatusUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isValid",
				"type": "bool"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "officer",
				"type": "address"
			}
		],
		"name": "FIRValidated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint64",
				"name": "version",
				"type": "uint64"
			}
		],
		"name": "Initialized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes32[]",
				"name": "documentHashes",
				"type": "bytes32[]"
			}
		],
		"name": "RegistrationRequested",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "role",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "callerConfirmation",
				"type": "address"
			}
		],
		"name": "renounceRole",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32[]",
				"name": "documentHashes",
				"type": "bytes32[]"
			}
		],
		"name": "requestRegistration",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "role",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "revokeRole",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "role",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "previousAdminRole",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "newAdminRole",
				"type": "bytes32"
			}
		],
		"name": "RoleAdminChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "role",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "RoleGranted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "role",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "RoleRevoked",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "UserVerified",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isValid",
				"type": "bool"
			}
		],
		"name": "validateFIR",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "verifyUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "status",
				"type": "string"
			}
		],
		"name": "updateFIRStatus",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "role",
				"type": "bytes32"
			}
		],
		"name": "getRoleAdmin",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "role",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "hasRole",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes4",
				"name": "interfaceId",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "DEFAULT_ADMIN_ROLE",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "OFFICER_ROLE",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "firs",
		"outputs": [
			{
				"internalType": "string",
				"name": "complainantName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "complainantContact",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "incidentType",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "incidentDateTime",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "incidentLocation",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "complainantAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assignedOfficer",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "status",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "updatedAt",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isValid",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "firCounter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userRegistrationRequests",
		"outputs": [
			{
				"internalType": "bool",
				"name": "requested",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "verified",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "firId",
				"type": "uint256"
			}
		],
		"name": "getFIR",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "complainantName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "complainantContact",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "incidentType",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "incidentDateTime",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "incidentLocation",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string[]",
						"name": "suspects",
						"type": "string[]"
					},
					{
						"internalType": "string[]",
						"name": "victims",
						"type": "string[]"
					},
					{
						"internalType": "string[]",
						"name": "witnesses",
						"type": "string[]"
					},
					{
						"internalType": "bytes32[]",
						"name": "evidenceHashes",
						"type": "bytes32[]"
					},
					{
						"internalType": "address",
						"name": "complainantAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "assignedOfficer",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "status",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "updatedAt",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isValid",
						"type": "bool"
					}
				],
				"internalType": "struct SecureFIR.FIR",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] as const;