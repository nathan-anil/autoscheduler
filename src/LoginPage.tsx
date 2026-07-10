import { useState } from "react";
import { CalendarCheck } from "lucide-react";

import "./Login.css";

type Props = {
  onLogin: (username: string) => void;
};

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onLogin(username.trim() || "Student");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <CalendarCheck size={32} strokeWidth={2.2} />
          </div>
          <span>AutoSchedule</span>
        </div>

        <h1>Sign in</h1>
        <p>Plan your week.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="login-submit">
            Go
          </button>
        </form>

        <p className="login-note">Anything works — it&apos;s a demo.</p>
      </div>
    </div>
  );
}
