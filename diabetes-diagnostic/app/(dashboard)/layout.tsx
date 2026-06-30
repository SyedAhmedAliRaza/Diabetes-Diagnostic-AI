"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Brain, LayoutDashboard, History, LogOut, ChevronDown, User, Activity, Search, LineChart, Menu } from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && globalSearch.trim() !== "") {
      router.push(`/history?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const navLinks = [
    { href: "/overview", label: "Overview", icon: LineChart },
    { href: "/dashboard", label: "New Diagnostic", icon: Activity },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 bg-[#F3F4F6] ${isSidebarOpen ? 'border-r border-gray-200' : 'border-r-0'} flex flex-col z-30 overflow-hidden whitespace-nowrap
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-0 md:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200/50">
          <button onClick={() => router.push("/overview")} className="flex items-center gap-1 group w-full text-left cursor-pointer">
            <img src="/logo.png" alt="Diabetes Diagnostic Logo" className="w-10 h-10 object-contain" />
            <span className="font-bold text-gray-900 leading-none tracking-tight group-hover:text-blue-600 transition-colors">
              Diabetes Diagnostic AI
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Optional) */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-gray-700">System Online</span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">ANN Model — 75% Accuracy</p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10">
          {/* Hamburger Menu & Global Search */}
          <div className="flex items-center flex-1 max-w-md relative">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
                placeholder="Search patients by ID (Press Enter)..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-400"
              />
            </div>
          </div>

          {/* Spacer for mobile */}
          <div className="sm:hidden flex-1"></div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 pl-4 rounded-lg hover:bg-gray-50 py-1 transition-all"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {session?.user?.name || "Dr. Anya Sharma"}
                </p>
                <p className="text-xs text-gray-500 font-medium">{session?.user?.email || "anya@clinic.com"}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">{session?.user?.name || "Dr. Anya Sharma"}</p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email || "anya@clinic.com"}</p>
                  </div>
                  <div className="p-1">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                      <User className="w-4 h-4 text-gray-400" />
                      My Profile
                    </button>
                  </div>
                  <div className="border-t border-gray-100 p-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F9FAFB] p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
