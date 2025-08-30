import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import "./CSS/Login.css";

export default function Register() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ← パスワード表示切替
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (password !== confirmPassword) {
      setErr("パスワードが一致しません");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMsg("登録が完了しました。ログイン中です...");
      await login(email, password);
    } catch (e: any) {
      setErr(e?.message ?? "登録に失敗しました");
    }
  };

  return (
    <div className="login-container">
      <h2>新規ユーザー登録</h2>
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

        <div className="form-group password-field">
          <label>パスワード（確認用）</label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度パスワードを入力してください"
            />
            <i
              className={`bx ${showConfirmPassword ? "bx-show" : "bx-hide"}`}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            ></i>
          </div>
        </div>

        {err && <p style={{ color: "#d33", fontSize: 12 }}>{err}</p>}
        {msg && <p style={{ color: "green", fontSize: 12 }}>{msg}</p>}

        <button type="submit" className="login-btn">
          登録
        </button>
      </form>
    </div>
  );
}
