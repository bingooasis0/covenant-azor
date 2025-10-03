// frontend/src/app/resources/page.tsx
"use client";

import React from "react";

export default function ResourcesPage() {
  const downloads = [
    {
      id: "program-overview",
      title: "Program Overview",
      description: "Comprehensive guide to our referral program, commission structure, and partnership benefits.",
      href: "/assets/program_overview.zip",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
      color: "blue",
    },
    {
      id: "sales-kit",
      title: "Agent Sales Kit",
      description: "Marketing materials, pitch decks, and collateral to help you close more deals.",
      href: "/assets/agent_sales_kit.zip",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      ),
      color: "indigo",
    },
  ];

  const services = [
    {
      title: "Managed IT Services",
      description: "Comprehensive IT support and infrastructure management for businesses of all sizes.",
      features: ["24/7 Monitoring", "Helpdesk Support", "Network Management", "Cloud Services"],
    },
    {
      title: "Hosted Voice Solutions",
      description: "Enterprise-grade VoIP and unified communications for modern workplaces.",
      features: ["Cloud PBX", "Video Conferencing", "Mobile Integration", "Call Analytics"],
    },
    {
      title: "Cybersecurity",
      description: "Advanced threat protection and compliance solutions to keep your business secure.",
      features: ["Threat Detection", "Data Backup", "Security Training", "Compliance Support"],
    },
    {
      title: "Internet & Connectivity",
      description: "High-speed, reliable internet and network connectivity solutions.",
      features: ["Fiber Connections", "SD-WAN", "Failover Protection", "Bandwidth Management"],
    },
  ];

  return (
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
      </div>
    </div>
  );
}
