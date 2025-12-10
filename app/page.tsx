// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Camera, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  Zap,
  ChevronRight,
  TrendingUp,
  FileText,
  Users,
  Cloud,
  Sparkles
} from "lucide-react";
import { href } from "react-router-dom";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const featureCards = [
    {
      icon: <Camera className="w-6 h-6" />,
      title: "AI OCR Processing",
      description: "Extract data from bill images using advanced AI technology",
      features: ["AI-Powered Extraction", "Real-time Processing", "Save to Sheets"],
      color: "from-blue-500 to-blue-600",
      href: "/shreelalji-dairy"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Real-time insights and sales trends from your data",
      features: ["Live Metrics", "Interactive Charts", "Customer Insights"],
      color: "from-purple-500 to-purple-600",
      href: "/dashboard"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Follow-Up Management",
      description: "Track and manage customer follow-ups efficiently",
      features: ["Smart Reminders", "Call Tracking", "Status Updates"],
      color: "from-emerald-500 to-emerald-600",
      href: "/follow-ups"
    }
  ];

  const stats = [
    { label: "Data Accuracy", value: "99.5%", icon: <CheckCircle className="w-5 h-5" /> },
    { label: "Processing Speed", value: "<2s", icon: <Zap className="w-5 h-5" /> },
    { label: "Customer Satisfaction", value: "98%", icon: <Users className="w-5 h-5" /> },
    { label: "Uptime", value: "99.9%", icon: <Shield className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Animated background gradient */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15), transparent 50%)`
        }}
      />

      {/* Header/Navigation */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">🥛</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ShreeLalJI Dairy</h1>
                <p className="text-sm text-gray-500">Sales Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Features</a>
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Pricing</a>
                <a href="#docs" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Documentation</a>
              </div>
              
<Link 
  href="/shreelalji-dairy"
  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all inline-block"
>
  Get Started
</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-8">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">Automated Sales Intelligence Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your Dairy Business
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                With AI-Powered Insights
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Automatically extract sales data, track performance, and manage customer relationships 
              in one unified platform powered by Google Sheets.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/shreelalji-dairy"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center space-x-3 group"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20" id="features">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need in One Platform</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Streamline your dairy business operations with our comprehensive suite of tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureCards.map((card, index) => (
              <Link
                key={index}
                href={card.href}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300" />
                <div className="relative bg-white rounded-2xl border border-gray-200 p-8 h-full hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-gray-600 mb-6">{card.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {card.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition">
                    <span>Explore Feature</span>
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-b from-white to-gray-50 py-20" id="docs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Simple three-step process to transform your business operations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload & Extract",
                  description: "Upload bill images and let AI extract data automatically",
                  icon: <FileText className="w-8 h-8" />
                },
                {
                  step: "02",
                  title: "Analyze & Insights",
                  description: "View real-time analytics and performance metrics",
                  icon: <TrendingUp className="w-8 h-8" />
                },
                {
                  step: "03",
                  title: "Engage & Grow",
                  description: "Follow up with customers and track relationships",
                  icon: <Users className="w-8 h-8" />
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="absolute -top-4 -left-4 text-6xl font-bold text-gray-100/50">{item.step}</div>
                  <div className="relative bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-blue-600 mb-6">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Integration Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white mb-6">
                  <Cloud className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">Seamless Integration</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Powered by Google Sheets & Gemini AI
                </h2>
                <p className="text-gray-600 mb-6">
                  Your data stays in Google Sheets. We enhance it with AI-powered insights 
                  and automation, keeping everything secure and accessible.
                </p>
                <ul className="space-y-4">
                  {[
                    "Real-time data synchronization",
                    "Advanced AI analytics",
                    "Secure cloud storage",
                    "No data migration required"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:w-2/5">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">🥛</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">ShreeLalJI Dairy</div>
                      <div className="text-sm text-gray-500">Google Sheets Connected</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Customers</span>
                      <span className="font-bold text-gray-900">1,248</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Sales</span>
                      <span className="font-bold text-gray-900">₹2.5L</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Data Accuracy</span>
                      <span className="font-bold text-green-600">99.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🥛</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">ShreeLalJI Dairy</div>
                  <div className="text-sm text-gray-500">Automated Sales Platform</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Transform your dairy business with AI-powered insights
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-500 text-sm mb-2">
                Built with ❤️ by EI Team
              </p>
              <p className="text-gray-400 text-xs">
                © {new Date().getFullYear()} ShreeLalJI Dairy Platform. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link
          href="/shreelalji-dairy"
          className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all group animate-bounce"
        >
          <span>Start Free Trial</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </div>
  );
}