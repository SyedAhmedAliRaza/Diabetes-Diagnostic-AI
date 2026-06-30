"use client";

import { useRouter } from "next/navigation";
import { Brain, UploadCloud, Cpu, FileText } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-0">
            <img src="/logo.png" alt="Diabetes Diagnostic Logo" className="w-16 h-16 object-contain" />
            <span className="-ml-1 font-bold text-gray-900 text-2xl tracking-tight">Diabetes Diagnostic AI</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push("/register")} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              Register
            </button>
            <button
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all px-6 py-2.5 rounded-lg shadow-sm cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center justify-between gap-12 w-full">
        {/* Left Content */}
        <div className="flex-1 space-y-6 max-w-2xl">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            AI-Powered Diabetes Diagnosis.<br />
            The Future of Early Detection.
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
            Leveraging advanced Artificial Neural Networks for precision medical analysis and proactive care.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => router.push("/register")}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Right Content - Brain Illustration */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg aspect-square opacity-90 flex items-center justify-center">
            <img src="/hero-image.png" alt="AI Brain Diagnostic Network" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
        </div>
      </section>

      {/* Feature Cards - How Our Technology Works */}
      <section className="max-w-7xl mx-auto px-6 pb-24 w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How Our Technology Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <UploadCloud className="w-8 h-8 text-gray-800 mb-4" strokeWidth={1.5} />
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Upload</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Securely upload patient data and clinical records.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <Cpu className="w-8 h-8 text-gray-800 mb-4" strokeWidth={1.5} />
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Analyze</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Our AI model processes data to identify patterns.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <FileText className="w-8 h-8 text-gray-800 mb-4" strokeWidth={1.5} />
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Result</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Receive a comprehensive diagnostic report.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center">
        <p className="text-sm text-gray-500 font-medium">© 2026 Diabetes Diagnostic AI. All rights reserved</p>
      </footer>
    </div>
  );
}
