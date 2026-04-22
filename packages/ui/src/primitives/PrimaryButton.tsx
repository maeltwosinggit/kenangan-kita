import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", ...props }: Props) {
  return (
    <button
      className={`rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

