import { useAuth } from "../../../auth/AuthContext";

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h1>後臺儀表板</h1>
      <p>目前登入：{user?.email}</p>
      <button onClick={logout}>登出</button>
    </div>
  );
}
