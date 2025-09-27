
// frontend/src/app/resources/page.tsx
import { IconDownload } from "@/lib/icons";

export default function ResourcesPage(){
  const items = [
    { href: "/assets/program_overview.zip", label: "Program Overview" },
    { href: "/assets/agent_sales_kit.zip", label: "Agent Sales Kit" },
    { href: "/assets/quick_pricing_reference.pdf", label: "Pricing Reference Guide", target: "_blank" },
  ];
  return (
    <div className="wrap">
      <h1 style={{fontSize:"20px", fontWeight:600}}>Resources</h1>
      <div className="card" style={{padding:16, marginTop:12}}>
        <div className="space-y-3">
          {items.map((it) => (
            <a key={it.href} href={it.href} target={it.target as any} className="flex items-center gap-2 hover:underline">
              <IconDownload className="icon" />
              <span>{it.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
