// frontend/src/app/resources/page.tsx
export default function ResourcesPage(){
  return (
    <div className="wrap">
      <h1 style={{fontSize:"20px", fontWeight:600}}>Resources</h1>
      <div className="card" style={{padding:16, marginTop:12}}>
        <ul style={{paddingLeft:18, lineHeight:1.9}}>
          <li><a href="/assets/program_overview.zip">Program Overview</a></li>
          <li><a href="/assets/agent_sales_kit.zip">Agent Sales Kit</a></li>
          <li><a href="/assets/quick_pricing_reference.pdf" target="_blank">Pricing Reference Guide</a></li>
        </ul>
      </div>
    </div>
  );
}
