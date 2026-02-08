'use client';

import { AuthProvider } from '@/hooks/useNostr';

export function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
