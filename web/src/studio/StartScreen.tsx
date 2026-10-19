import { Icon } from "../components/Icon";
import { href } from "../lib/route";
import { useStore } from "../store";

const STEPS = [
  { n: "1", icon: "image" as const, title: "Pick a photo", text: "Choose one from your device, take one, or use a sample." },
  { n: "2", icon: "seal" as const, title: "Press Seal", text: "We stamp that exact photo. It takes a few seconds." },
  { n: "3", icon: "verify" as const, title: "Check it", text: "Anyone can drop the photo in and see the seal is real." },
];

const WORDS = [
  ["Seal", "A tamper-proof stamp on one exact photo. Change a single pixel and the seal no longer matches."],
  ["Group", "The trusted people allowed to seal. A seal proves someone in the group approved the photo, never who."],
  ["Practice mode", "Everything runs inside your browser. Nothing is uploaded and nothing is saved when you reload."],
];

const MORE = [
  { tab: "desk" as const, title: "Review desk", text: "Editors check a sealed photo and decide to publish it." },
  { tab: "pool" as const, title: "Members", text: "See who is in the group and remove someone." },
  { tab: "relay" as const, title: "Privacy relay", text: "Hides when a photo was sent, so timing can't give someone away." },
  { tab: "attacks" as const, title: "Safety tests", text: "Try to cheat the seal and watch it say no." },
];

export function StartScreen() {
  const s = useStore();
  const sample = s.seals[0];
  function openSample() {
    if (sample) sessionStorage.setItem("unforged:verify", sample.id);
  }
  return (
    <div className="start">
      <header className="start-hero">
        <span className="label">WELCOME</span>
        <h1 className="display">Make a photo <em>tamper-proof.</em></h1>
        <p className="lede">A seal proves a photo is exactly the one a trusted group approved. Nobody can see who took it. Try it now, no account needed.</p>
        <div className="start-actions">
          <a className="start-card start-card-primary" href={href({ page: "studio", tab: "seal" })}>
            <span className="start-card-icon"><Icon name="seal" size={26} /></span>
            <strong>Seal a photo</strong>
            <span>Pick a photo and stamp it. Takes about 10 seconds.</span>
            <span className="start-card-go">Start <Icon name="arrow" size={18} /></span>
          </a>
          <a className="start-card" href={href({ page: "studio", tab: "verify" })}>
            <span className="start-card-icon"><Icon name="verify" size={26} /></span>
            <strong>Check a photo</strong>
            <span>Drop a photo in to see if it has a real seal.</span>
            <span className="start-card-go">Check <Icon name="arrow" size={18} /></span>
          </a>
        </div>
        {sample && (
          <a className="start-sample" href={href({ page: "studio", tab: "verify" })} onClick={openSample}>
            Just want to look? See a sample sealed photo <Icon name="arrow" size={16} />
          </a>
        )}
      </header>

      <section className="start-section" aria-labelledby="how-title">
        <h2 id="how-title" className="heading">How it works</h2>
        <ol className="start-steps">
          {STEPS.map((st) => (
            <li key={st.n}>
              <span className="start-step-n">{st.n}</span>
              <Icon name={st.icon} size={24} />
              <strong>{st.title}</strong>
              <span>{st.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="start-section" aria-labelledby="words-title">
        <h2 id="words-title" className="heading">Words you will see</h2>
        <dl className="start-words">
          {WORDS.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </section>

      <section className="start-section" aria-labelledby="more-title">
        <h2 id="more-title" className="heading">For teams and experts</h2>
        <p className="meta" style={{ margin: 0 }}>You don't need these to try Unforged. They show how a newsroom would run it.</p>
        <ul className="start-more">
          {MORE.map((m) => (
            <li key={m.tab}>
              <a href={href({ page: "studio", tab: m.tab })}><strong>{m.title}</strong><span>{m.text}</span><Icon name="arrow" size={16} /></a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
