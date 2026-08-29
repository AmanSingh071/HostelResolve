"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const [message, setMessage] = useState("Signing you in with Google...");

  useEffect(() => {
    const finishLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        setMessage("No login code was received. Please try again.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage("Login failed: " + error.message);
        return;
      }

      window.location.replace("/?student=1");
    };

    finishLogin();
  }, []);

  return (
    <main>
      <section className="page">
        <div className="login-card">
          <div className="eyebrow">HOSTELRESOLVE</div>
          <h2>{message}</h2>
          <p>Please wait while we securely finish your Google sign-in.</p>
        </div>
      </section>
    </main>
  );
}
