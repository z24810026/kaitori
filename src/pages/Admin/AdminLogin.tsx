import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../../components/common/LoadingOverlay"; // ← 追加
import "./CSS/Login.css";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ← ローディング状態

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true); // ローディング開始
    try {
      await login(email, password);
    } catch (e: any) {
      setErr(e?.message ?? "ログインに失敗しました");
      setLoading(false); // エラーならローディング解除
    }
  };

  return (
    <div className="login-container">
      {loading && <LoadingOverlay message="ログイン中です…" />} {/* ← ローディング */}

      <h2>管理者ログイン</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレスを入力してください"
          />
        </div>

        <div className="form-group password-field">
          <label>パスワード</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力してください"
            />
            <i
              className={`bx ${showPassword ? "bx-show" : "bx-hide"}`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>
        </div>

        {err && <p style={{ color: "#d33", fontSize: 12 }}>{err}</p>}
        <button type="submit" className="login-btn" disabled={loading}>
          ログイン
        </button>
      </form>

      {/* 新規登録ボタン */}
      <div style={{ marginTop: "16px" }}>
        <button
          type="button"
          className="register-btn"
          onClick={() => navigate("/admin/register")}
          disabled={loading}
        >
          新規登録はこちら
        </button>
      </div>
    </div>
  );
}
