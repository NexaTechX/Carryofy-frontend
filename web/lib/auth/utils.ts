/**
 * Utility function to get redirect path based on user role
 */
export const getRoleRedirect = (role: string | undefined | null): string => {
  if (!role) {
    return '/';
  }
  
  switch (role.toUpperCase()) {
    case 'SELLER':
      return '/seller';
    case 'BUYER':
      return '/buyer';
    case 'ADMIN':
      return '/admin';
    case 'RIDER':
      return '/rider';
    case 'FLEET_OPERATOR':
    case 'FLEET':
      return '/fleet';
    default:
      return '/';
  }
};

