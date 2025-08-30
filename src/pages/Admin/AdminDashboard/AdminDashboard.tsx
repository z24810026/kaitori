import { useAuth } from "../../../auth/AuthContext";

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h1>ダッシュボード</h1>
    </div>
  );
}
