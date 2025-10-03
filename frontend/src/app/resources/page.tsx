'use client';

export default function ResourcesPage() {
  return (
    <>
      <style jsx global>{`
        .content {
          padding: 0 !important;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Downloads Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Downloads</h2>
            <p className="text-gray-600">Essential materials to help you understand and promote our services.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {downloads.map((item) => (
              <a
                key={item.id}
                href={item.href}
                download
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 hover:border-blue-300"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Download Resource
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Partnership Agreement Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Partnership Agreement</h2>
              <div className="prose prose-blue">
                <p className="text-gray-700 mb-4">
                  As an Azor referral partner, you're part of a trusted network helping businesses find the right
                  technology solutions. Our partnership is built on transparency, mutual success, and exceptional service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Terms</h3>
                <ul className="space-y-2 text-gray-700 mb-4">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span><strong>Commission Structure:</strong> Earn competitive commissions on all qualified referrals that convert to active customers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span><strong>Qualified Referrals:</strong> Businesses with 10+ users actively seeking IT services or improvements.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span><strong>Support:</strong> Full sales support, technical resources, and dedicated account management.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span><strong>Transparency:</strong> Real-time tracking of your referrals through our partner portal.</span>
                  </li>
                </ul>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong className="text-gray-900">Questions about the partnership agreement?</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Contact our partner success team for clarification on any terms or to discuss your specific situation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Overview Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Services</h2>
            <p className="text-gray-600">
              Learn about the enterprise solutions we provide to businesses across all industries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* NEW: Service Catalog Comparison Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Service Catalog & Pricing</h2>
            <p className="text-gray-600">
              Detailed comparison of all service tiers, features, and pricing to help you understand our offerings.
            </p>
          </div>

          {/* Legend */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-8">
            <div className="font-semibold text-gray-900 mb-3">Legend</div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-xl">●</span>
                <span className="text-gray-700">= Included in tier</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg font-bold">+</span>
                <span className="text-gray-700">= Available as optional add-on</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Empty cell</span>
                <span className="text-gray-700">= Not available</span>
              </div>
            </div>
          </div>

          {/* Managed IT Services Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8 overflow-x-auto">
            <h3 className="text-2xl font-bold text-blue-600 mb-6">Managed IT Services (MSP)</h3>

            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-3 text-left font-semibold border border-white">Feature / Service</th>
                  <th className="p-3 text-center font-semibold border border-white bg-green-100 text-green-800">
                    Essential-Care<br/><span className="text-xs font-normal">$95/user/mo</span>
                  </th>
                  <th className="p-3 text-center font-semibold border border-white bg-blue-50 text-blue-800">
                    Core-Care<br/><span className="text-xs font-normal">$125/user/mo</span>
                  </th>
                  <th className="p-3 text-center font-semibold border border-white bg-blue-50 text-yellow-800">
                    Guardian-Care<br/><span className="text-xs font-normal">$165/user/mo</span>
                  </th>
                  <th className="p-3 text-center font-semibold border border-white bg-red-50 text-red-800">
                    Total-Care+<br/><span className="text-xs font-normal">$225/user/mo</span>
                  </th>
                  <th className="p-3 text-center font-semibold border border-white bg-green-600">Add-Ons</th>
                </tr>
              </thead>
              <tbody>
                {/* Core Support */}
                <tr className="bg-gray-100">
                  <td className="p-3 font-bold text-xs uppercase tracking-wide">Core Support & Response Times</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">Unlimited Remote Helpdesk Support</td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">Onsite Support Included</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">2 visits/month</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">2 visits/month</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">4 visits/month</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">Unlimited</td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">Critical Issue Response SLA</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">4 hours</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">2 hours</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">1 hour</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">30 minutes</td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">24/7 Emergency Remote Support</td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200 text-xs">Billable</td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>

                {/* Security & Protection */}
                <tr className="bg-gray-100">
                  <td className="p-3 font-bold text-xs uppercase tracking-wide">Security & Protection</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">Endpoint Protection</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">Basic</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">Basic</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">Advanced</td>
                  <td className="p-3 text-center border border-gray-200 text-xs">Advanced</td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">Security Awareness Training</td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">Identity Threat Protection</td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>

                {/* Backup & Data Protection */}
                <tr className="bg-gray-100">
                  <td className="p-3 font-bold text-xs uppercase tracking-wide">Backup & Data Protection</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">BaaS - Endpoint Backup</td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">M365 Tenant Backup</td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>

                {/* vCIO & Planning */}
                <tr className="bg-gray-100">
                  <td className="p-3 font-bold text-xs uppercase tracking-wide">Strategic Planning</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">vCIO Quarterly Reviews</td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200 text-xs">Light</td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200 text-xs">● + Budget</td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 pl-6 border border-gray-200">Dedicated Account Manager</td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-blue-600 text-xl">●</span></td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>

                {/* Onboarding Fee */}
                <tr className="bg-gray-100">
                  <td className="p-3 font-bold text-xs uppercase tracking-wide">One-Time Onboarding Fee</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-yellow-50">
                  <td className="p-3 pl-6 border border-gray-200 font-semibold">Initial Setup & Configuration</td>
                  <td className="p-3 text-center border border-gray-200 text-xs font-semibold">$900<br/>(4-6 hrs)</td>
                  <td className="p-3 text-center border border-gray-200 text-xs font-semibold">$1,400<br/>(6-10 hrs)</td>
                  <td className="p-3 text-center border border-gray-200 text-xs font-semibold">$2,000<br/>(10-14 hrs)</td>
                  <td className="p-3 text-center border border-gray-200 text-xs font-semibold">$3,000<br/>(14-20 hrs)</td>
                  <td className="p-3 text-center border border-gray-200"><span className="text-green-600 font-bold">+</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Additional Services - Simplified Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h4 className="text-lg font-bold text-blue-600 mb-3">Firewall & Network</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Incident-Based:</strong> $50/site</div>
                <div><strong>Manage:</strong> $75/site</div>
                <div><strong>Optimize:</strong> $125/site</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h4 className="text-lg font-bold text-blue-600 mb-3">Hosted Voice</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Incident-Based:</strong> $50/location</div>
                <div><strong>Manage:</strong> $75/location</div>
                <div><strong>Enhance:</strong> $100/location</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h4 className="text-lg font-bold text-blue-600 mb-3">Surveillance</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Incident-Based:</strong> TBD</div>
                <div><strong>Manage:</strong> $6/camera</div>
                <div><strong>Optimize:</strong> $8/camera</div>
              </div>
            </div>
          </div>

          {/* Volume Pricing Note */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h4 className="font-bold text-gray-900 mb-3">Volume Pricing & Additional Information</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>MSP Volume Discounts:</strong> 11-25 users (save $5-10/user) | 26-50 users (save $10-20/user) | 51-100 users (save $15-35/user)</li>
              <li>• <strong>Post-Onboarding:</strong> Add New User = $175 | Add New Device = $95 | Offboard User = $87.50</li>
              <li>• <strong>Break-Fix Rates:</strong> IT/MSP = $175/hr | Network = $175/hr | Voice = $95 flat | Surveillance = Region 1: $125/hr, Region 2: $165/hr</li>
              <li>• <strong>Compliance Bundles Available:</strong> HIPAA (+$25/user/mo) | NIST CSF (+$40/user/mo) | Data Retention (+$15/user/mo)</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}

// Sample data - replace with actual data
const downloads = [
  {
    id: 1,
    title: 'Service Catalog PDF',
    description: 'Comprehensive overview of all our services and pricing',
    href: '#',
    color: 'blue',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
  },
  {
    id: 2,
    title: 'Quick Reference Guide',
    description: 'One-page summary for quick client discussions',
    href: '#',
    color: 'green',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  }
];

const services = [
  {
    title: 'Managed IT Services (MSP)',
    description: 'Comprehensive IT support and management for businesses of all sizes',
    features: ['24/7 helpdesk support', 'Proactive monitoring', 'Security & compliance', 'Strategic planning']
  },
  {
    title: 'Network & Infrastructure',
    description: 'Enterprise-grade networking, firewall management, and infrastructure solutions',
    features: ['Firewall management', 'Network optimization', 'VPN & remote access', 'WiFi solutions']
  },
  {
    title: 'Cloud Solutions',
    description: 'Microsoft 365, Azure, and cloud migration services',
    features: ['M365 administration', 'Cloud backup', 'Email security', 'Collaboration tools']
  },
  {
    title: 'Voice & Communications',
    description: 'Hosted VoIP and unified communications',
    features: ['Hosted PBX', 'Call routing', 'Conference bridging', 'Mobile integration']
  }
];
