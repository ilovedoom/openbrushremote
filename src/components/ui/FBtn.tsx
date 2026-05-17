import { useRef, useState, type CSSProperties, type ReactNode, type MouseEvent } from "react";

export type FBtnToast = { msg: string; type: "ok" | "err" | "warn" } | null | void;

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  title?: string;
  onClickAsync?: (e: MouseEvent<HTMLButtonElement>) => Promise<FBtnToast> | FBtnToast;
};

export function FBtn({ children, className = "", style, disabled, title, onClickAsync }: Props) {
  const [ripple, setRipple] = useState<CSSProperties | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "warn" } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 1.5;
      setRipple({ left: x - size / 2, top: y - size / 2, width: size, height: size });
      setTimeout(() => setRipple(null), 600);
    }
    if (onClickAsync) {
      try {
        const result = await onClickAsync(e);
        if (result && typeof result === "object" && "msg" in result) {
          setToast(result);
          setTimeout(() => setToast(null), 2400);
        }
      } catch (err) {
        setToast({ msg: "❌ " + (err instanceof Error ? err.message : "Error"), type: "err" });
        setTimeout(() => setToast(null), 2400);
      }
    }
  };

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      {toast && <span className={`local-toast ${toast.type}`}>{toast.msg}</span>}
      <button
        ref={btnRef}
        type="button"
        title={title}
        className={`btn ${className}`}
        onClick={handleClick}
        disabled={disabled}
        style={{ overflow: "hidden", position: "relative", ...style }}
      >
        {ripple && <span className="ripple" style={ripple} />}
        {children}
      </button>
    </span>
  );
}
