import { useState } from "react";
import { Icon, Mark } from "../components/Icon";
import { continueAsGuest, hasSavedPasskey, realPasskeysAvailable, signInWithPasskey } from "../store";

type Problem = { title: string; detail: string };

/** First screen: sign in with a passkey, or continue as a guest. */
export function SignIn() {
  const real = realPasskeysAvailable();
  const returning = hasSavedPasskey();
  const [busy, setBusy] = useState<"passkey" | "guest">();
  const [problem, setProblem] = useState<Problem>();

  async function run(kind: "passkey" | "guest") {
    setBusy(kind);
    setProblem(undefined);
    try {
      if (kind === "passkey") await signInWithPasskey();
      else await continueAsGuest();
    } catch (e) {
      const err = e as Error;
      setProblem(
        err.name === "NotAllowedError"
          ? { title: "Sign-in was cancelled.", detail: "Nothing was saved. Press the button to try again, or continue as a guest." }
          : { title: "We couldn't sign you in with a passkey.", detail: `${err.message || "Your device did not respond."} You can try again or continue as a guest.` },
      );
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="signin">
      <div className="signin-card">
        <span className="signin-mark"><Mark size={52} /></span>
        <h1 className="headline">{returning ? "Welcome back" : "Sign in to Unforged"}</h1>
        <p className="body-2" style={{ margin: 0 }}>
          Use the passkey on this device: Face ID, fingerprint, Windows Hello or your PIN. There is no password and no email.
        </p>

        {real ? (
          <button className="btn btn-primary btn-big signin-main" onClick={() => void run("passkey")} aria-busy={busy === "passkey"} disabled={!!busy}>
            {busy === "passkey"
              ? <><span className="spinner" /> Waiting for your device…</>
              : <><Icon name="fingerprint" size={22} /> {returning ? "Sign in with your passkey" : "Continue with a passkey"}</>}
          </button>
        ) : (
          <div className="status status-info">
            <Icon name="info" />
            <p><strong>Passkeys aren't available at this address.</strong>Open Unforged at its main web address to use one, or continue as a guest.</p>
          </div>
        )}

        <div className="signin-or"><span>or</span></div>

        <button className="btn btn-secondary btn-big signin-main" onClick={() => void run("guest")} aria-busy={busy === "guest"} disabled={!!busy}>
          {busy === "guest" ? <><span className="spinner" /> Starting…</> : "Continue as a guest"}
        </button>
        <p className="meta" style={{ margin: 0 }}>Guest sessions use a temporary key and end when you close the tab.</p>

        {problem && (
          <div className="status status-error" role="alert">
            <Icon name="alert" />
            <p><strong>{problem.title}</strong>{problem.detail}</p>
          </div>
        )}

        <ul className="signin-facts">
          <li><Icon name="lock" size={16} /> Your passkey never leaves your device.</li>
          <li><Icon name="check" size={16} /> A seal proves a photo was approved. It never contains your name.</li>
        </ul>
      </div>
    </div>
  );
}
