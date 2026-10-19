import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Supplementary acknowledgements only. Anything the user must act on is shown inline.
let push: (msg: string) => void = () => {};
export const toast = (msg: string) => push(msg);

export function Toaster() {
  const [msg, setMsg] = useState<string>();
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    push = (m) => { setMsg(m); setN((x) => x + 1); };
    return () => { push = () => {}; };
  }, []);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(undefined), 2600);
    return () => clearTimeout(id);
  }, [msg, n]);
  return (
    <div role="status" aria-live="polite">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={n}
            className="toast"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, x: "-50%" }}
            transition={{ duration: 0.18 }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
