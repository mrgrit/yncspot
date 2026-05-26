import { Navigate } from "react-router-dom";
import { useAuth, type AppRole } from "@/contexts/AuthContext";

export function homePathFor(role: AppRole): string {
  switch (role) {
    case "youth":
      return "/me";
    case "company":
      return "/company";
    case "operator":
    case "admin":
      return "/admin";
  }
}

export function Protected({
  roles,
  children,
}: {
  roles: AppRole[];
  children: React.ReactNode;
}) {
  const { account } = useAuth();
  if (!account) return <Navigate to="/login" replace />;
  if (!roles.includes(account.role))
    return <Navigate to={homePathFor(account.role)} replace />;
  return <>{children}</>;
}
