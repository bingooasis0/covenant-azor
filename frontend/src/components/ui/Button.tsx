/* frontend/src/components/ui/Button.tsx */
"use client";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary"|"ghost"|"danger" };
export default function Button({ tone="primary", className="", ...rest }: Props) {
  return <button className={`btn ${tone} ${className}`} {...rest} />;
}
