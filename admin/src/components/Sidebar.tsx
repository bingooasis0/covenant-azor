
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconTasks, IconInbox, IconCalendar, IconUser, IconBox, IconSearch } from "./Icons";

export default function Sidebar() {
  const p = usePathname();
  const Item = ({href, icon, label}:{href:string; icon:JSX.Element; label:string}) => {
    const active = p.startsWith(href);
    return <Link href={href} className={`flex items-center gap-3 ${active?'active':''}`}><span>{icon}</span><span>{label}</span></Link>;
  };
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-dot" /> Overlay</div>
      <div className="search mt-4"><IconSearch /> <span className="text-sm">Search</span><span className="ml-auto kbd">/</span></div>
      <nav className="nav mt-4">
        <Item href="/dashboard" icon={<IconHome/>} label="Dashboard" />
        <Item href="/admin" icon={<IconTasks/>} label="Submit Referral" />
        <Item href="/resources" icon={<IconInbox/>} label="Resources" />
        <Item href="/account" icon={<IconUser/>} label="Account" />
        <Item href="/assets" icon={<IconBox/>} label="Assets" />
      </nav>
    </aside>
  );
}
