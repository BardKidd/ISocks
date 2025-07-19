import React from 'react';
import { Link } from 'react-router-dom';
import { useAbility } from '../contexts';

interface PermissionLinkProps {
  to: string;
  subject: string;
  children: React.ReactNode;
  className?: string;
}

export function PermissionLink({ to, subject, children, className }: PermissionLinkProps) {
  const ability = useAbility();

  const canAccess =
    ability?.can('read', subject) || ability?.can('manage', subject);

  // disabled 效果
  const styles: React.CSSProperties = {
    pointerEvents: canAccess ? 'auto' : 'none',
    opacity: canAccess ? 1 : 0.5,
    textDecoration: 'none',
    marginRight: '1rem',
  };

  if (!canAccess) {
    return null;
  }

  return (
    <Link to={to} style={styles} className={className}>
      {children}
    </Link>
  );
}