import { Badge } from "@/components/ui/badge";
import { ROLES, ROLE_COLORS } from "@/lib/constants";
import { Shield, UserCheck, User, UserX } from "lucide-react";

interface RoleBadgeProps {
  role: string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return <Shield size={12} />;
      case ROLES.OFFICER:
        return <UserCheck size={12} />;
      case ROLES.USER:
        return <User size={12} />;
      default:
        return <UserX size={12} />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Admin';
      case ROLES.OFFICER:
        return 'Officer';
      case ROLES.USER:
        return 'User';
      default:
        return 'Guest';
    }
  };

  const colorClass = ROLE_COLORS[role as keyof typeof ROLE_COLORS] || ROLE_COLORS[ROLES.NONE];

  return (
    <Badge className={`bg-gradient-to-r ${colorClass} text-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-center space-x-1">
        {getRoleIcon(role)}
        <span>{getRoleLabel(role)}</span>
      </div>
    </Badge>
  );
}
