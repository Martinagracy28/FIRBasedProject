export const ROLES = {
  NONE: 'none',
  USER: 'user',
  OFFICER: 'officer',
  ADMIN: 'admin',
} as const;

export const FIR_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
  REJECTED: 'rejected',
} as const;

export const USER_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const INCIDENT_TYPES = [
  { value: 'theft', label: 'Theft' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'assault', label: 'Assault' },
  { value: 'cyber-crime', label: 'Cyber Crime' },
  { value: 'vandalism', label: 'Vandalism' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

export const SEPOLIA_CHAIN_ID = '0xAA36A7'; // 11155111 in hex
export const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/';

// Role-based navigation items
export const NAVIGATION = {
  [ROLES.ADMIN]: [
    { href: '/dashboard', label: 'Dashboard', icon: 'chart-line' },
    { href: '/manage-officers', label: 'Manage Officers', icon: 'user-plus' },
    { href: '/fir-tracking', label: 'All FIRs', icon: 'tasks' },
  ],
  [ROLES.OFFICER]: [
    { href: '/dashboard', label: 'Dashboard', icon: 'chart-line' },
    { href: '/verify-users', label: 'Verify Users', icon: 'user-check' },
    { href: '/fir-tracking', label: 'My FIRs', icon: 'folder-open' },
  ],
  [ROLES.USER]: [
    { href: '/dashboard', label: 'Dashboard', icon: 'chart-line' },
    { href: '/file-fir', label: 'File FIR', icon: 'file-plus' },
    { href: '/fir-tracking', label: 'My Reports', icon: 'history' },
  ],
  [ROLES.NONE]: [
    { href: '/dashboard', label: 'Dashboard', icon: 'chart-line' },
    { href: '/register', label: 'Register', icon: 'user-plus' },
    { href: '/waiting-approval', label: 'Approval Status', icon: 'clock' },
  ],
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: 'from-purple-600 to-violet-700',
  [ROLES.OFFICER]: 'from-pink-500 to-purple-600',
  [ROLES.USER]: 'from-purple-400 to-pink-500',
  [ROLES.NONE]: 'from-gray-400 to-gray-500',
};

export const STATUS_COLORS = {
  [FIR_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [FIR_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [FIR_STATUS.CLOSED]: 'bg-green-100 text-green-800',
  [FIR_STATUS.REJECTED]: 'bg-red-100 text-red-800',
};
