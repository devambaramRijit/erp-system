import { Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute<T extends object>({ component: Component, ...rest }: { component: React.ComponentType<T> } & T & { path: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <Route path="/auth" component={() => <div />} />;
  return <Route {...(rest as any)} component={Component as any} />;
}
