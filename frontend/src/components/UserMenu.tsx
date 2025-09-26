
"use client";
import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu({ name, role }:{ name:string; role:"AZOR"|"COVENANT"|string }){
  const router = useRouter();
  const [open,setOpen] = useState(false);
  function logout(){ localStorage.clear(); document.cookie="token=; Max-Age=0; path=/"; document.cookie="role=; Max-Age=0; path=/"; router.push("/"); }
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center gap-2 text-white">
        <span className="hidden sm:inline">Logged in as {name}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
        <div className="px-4 py-3 text-sm text-gray-700">Logged in as {name}</div>
        <div className="py-1">
          <Menu.Item>{({active}) => <a href="/dashboard" className={`${active?"bg-gray-100":""} block px-4 py-2 text-sm text-gray-700`}>Dashboard</a>}</Menu.Item>
          {role==="COVENANT" && <Menu.Item>{({active}) => <a href="http://localhost:3001/admin" className={`${active?"bg-gray-100":""} block px-4 py-2 text-sm text-gray-700`}>Admin portal</a>}</Menu.Item>}
          <Menu.Item>{({active}) => <button onClick={()=>router.push('/referral')} className={`${active?"bg-gray-100":""} w-full text-left px-4 py-2 text-sm text-gray-700`}>Submit a referral</button>}</Menu.Item>
          <Menu.Item>{({active}) => <button onClick={logout} className={`${active?"bg-gray-100":""} w-full text-left px-4 py-2 text-sm text-gray-700`}>Logout</button>}</Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  );
}
