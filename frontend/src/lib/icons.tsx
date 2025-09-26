// frontend/src/lib/icons.tsx
import React from "react";
type Props = React.SVGProps<SVGSVGElement> & { size?: number };
const make = (children: React.ReactNode) =>
  ({ size = 16, ...rest }: Props) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" {...rest}>{children}</svg>
  );
export const IconEdit = make(<><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></>);
export const IconTrash = make(<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>);
export const IconUserPlus = make(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></>);
export const IconEye = make(<><circle cx="12" cy="12" r="2"/><path d="M22 12s-4-7-10-7-10 7-10 7 4 7 10 7 10-7 10-7z"/></>);
export const IconKey = make(<><path d="M21 2l-2 2" /><path d="M7.5 7.5l9 9" /><circle cx="5" cy="19" r="3" /></>);
export const IconShield = make(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>);
export const IconRefresh = make(<><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15" /></>);
