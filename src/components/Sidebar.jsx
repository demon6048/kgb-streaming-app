import React from 'react';
import { MonitorPlay, X, LayoutDashboard, ShieldCheck, Server, Key } from 'lucide-react';

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, activeTab, setActiveTab, parametros }) {
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-2xl flex flex-col`}>
      <div className="flex items-center justify-between p-6 bg-slate-950">
        <div className="flex items-center space-x-3 text-white font-bold text-xl truncate">
          <div className="bg-blue-600 p-2 rounded-lg"><MonitorPlay className="w-6 h-6 text-white" /></div>
          <span className="truncate">{parametros.nombreNegocio}</span>
        </div>
        <button className="md:hidden text-slate-400 p-1 hover:bg-slate-800 rounded-md" onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
      </div>
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-6 py-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Principal</div>
          <nav className="space-y-2">
            <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard className="w-5 h-5" /> <span className="font-medium">Panel de Control</span></button>
          </nav>
        </div>
        <div className="px-6 py-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Servicios</div>
          <nav className="space-y-2">
            <button onClick={() => { setActiveTab('streaming'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'streaming' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}><MonitorPlay className="w-5 h-5" /> <span className="font-medium">Streaming</span></button>
            <button onClick={() => { setActiveTab('masters'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'masters' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'hover:bg-slate-800 hover:text-white'}`}><Server className="w-5 h-5" /> <span className="font-medium">Cuentas Máster</span></button>
            <button onClick={() => { setActiveTab('antivirus'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'antivirus' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'hover:bg-slate-800 hover:text-white'}`}><ShieldCheck className="w-5 h-5" /> <span className="font-medium">Antivirus</span></button>
            <button onClick={() => { setActiveTab('stock_av'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stock_av' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'hover:bg-slate-800 hover:text-white'}`}><Key className="w-5 h-5" /> <span className="font-medium">Stock Antivirus</span></button>
          </nav>
        </div>
      </div>
    </div>
  );
}