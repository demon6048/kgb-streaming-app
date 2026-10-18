import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  MonitorPlay, X, LayoutDashboard, ShieldCheck, Server, RefreshCw, 
  AlertTriangle, Cloud, MessageCircle, Edit, Trash2, Plus, Search, 
  Smartphone, Check, Calendar, MoreVertical, Key, Gift, Menu, 
  Briefcase, Settings, Lock, Shield, Terminal, Loader2, UserPlus, 
  ChevronDown, Star, Download, LogOut 
} from 'lucide-react';
import './index.css';

// ==========================================
// 1. CONFIGURACIÓN Y CONSTANTES
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJZ-EimBapTatv0qpBFTTZ3UyiIB_lh9nZ1zagAJ6-ylxfQUvRKPkJMC_MIvkJUjIy/exec"; 
const parametros = { nombreNegocio: 'KGB Streaming', codigoPais: '51', diasAlerta: 5 };
const ADMIN_PASSWORD = "S15t3w4s4860"; 

// ==========================================
// 2. UTILIDADES (Lógica Pura)
// ==========================================
const getToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const parseDateString = (dateString) => {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('T')[0].split('-');
  return new Date(y, m - 1, d);
};

const formatDateToLocal = (dateString) => {
  if (!dateString) return '-';
  const d = parseDateString(dateString);
  if (!d) return '-';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getDaysRemaining = (expiryDateString) => {
  if (!expiryDateString) return 0;
  const today = getToday();
  const expDate = parseDateString(expiryDateString);
  return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
};

const addMonthsToDate = (dateString, months) => {
  const d = parseDateString(dateString) || getToday();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const parseLicenseText = (text) => {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length === 0) return null;
  const data = {};
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('código de la suscripción')) data.codigo = line.split(':')[1]?.trim();
    else if (lowerLine.includes('nombre de usuario')) data.usuario = line.split(':')[1]?.trim();
    else if (lowerLine.includes('nombre del dispositivo')) data.dispositivo = line.split(':')[1]?.trim();
    else if (lowerLine.includes('máquina')) data.maquina = line.split(':')[1]?.trim();
  });
  return Object.keys(data).length > 0 ? data : null;
};

// ==========================================
// 3. COMPONENTES DE INTERFAZ (UI)
// ==========================================
const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen, activeTab, setActiveTab, setIsAuthenticated }) => (
  <>
    {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm animate-fadeIn" onClick={() => setIsMobileMenuOpen(false)} />}
    <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-2xl`}>
      <div className="p-6 bg-slate-950 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center text-white font-black text-xl tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20"><MonitorPlay className="w-5 h-5 text-white" /></div>
          KGB <span className="text-blue-500 ml-1.5">App</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 flex flex-col space-y-1 px-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-4">Principal</div>
        <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><LayoutDashboard className="w-5 h-5 mr-3" /> Panel de Control</button>
        <button onClick={() => { setActiveTab('campanas'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'campanas' ? 'bg-pink-600/10 text-pink-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><Gift className="w-5 h-5 mr-3" /> Campañas y Regalos</button>

        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Servicios y Licencias</div>
        <button onClick={() => { setActiveTab('streaming'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'streaming' ? 'bg-blue-600/10 text-blue-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><MonitorPlay className="w-5 h-5 mr-3" /> Streaming</button>
        <button onClick={() => { setActiveTab('software'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'software' ? 'bg-cyan-600/10 text-cyan-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><Briefcase className="w-5 h-5 mr-3" /> Software Profesional</button>
        <button onClick={() => { setActiveTab('antivirus'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'antivirus' ? 'bg-purple-600/10 text-purple-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><ShieldCheck className="w-5 h-5 mr-3" /> Antivirus</button>
        <button onClick={() => { setActiveTab('masters'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'masters' ? 'bg-orange-600/10 text-orange-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><Server className="w-5 h-5 mr-3" /> Cuentas Máster</button>
        <button onClick={() => { setActiveTab('stock_av'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'stock_av' ? 'bg-emerald-600/10 text-emerald-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><Key className="w-5 h-5 mr-3" /> Stock Antivirus</button>
        
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Administración</div>
        <button onClick={() => { setActiveTab('configuracion'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'configuracion' ? 'bg-slate-700 text-white font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><Settings className="w-5 h-5 mr-3" /> Configuración</button>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button onClick={() => {
          localStorage.removeItem('kgb_auth');
          setIsAuthenticated(false);
        }} className="flex items-center justify-center w-full px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all font-bold text-sm">
          <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
        </button>
      </div>
    </aside>
  </>
);

// ==========================================
// 4. VISTAS PRINCIPALES (MÓDULOS)
// ==========================================
const Dashboard = ({ stats, urgentClients, setWaActionModal }) => {
  const [filtroAlertas, setFiltroAlertas] = useState('todas');
  
  const alertasFiltradas = urgentClients.filter(c => {
    if (filtroAlertas === 'propias') return c.categoria === 'streaming' && c.idMaster && c.daysRemaining >= 0;
    if (filtroAlertas === 'externas') return c.categoria === 'streaming' && !c.idMaster && c.daysRemaining >= 0;
    if (filtroAlertas === 'antivirus') return c.categoria === 'antivirus';
    if (filtroAlertas === 'software') return c.categoria === 'software';
    if (filtroAlertas === 'inactivos') return c.daysRemaining < 0;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold text-slate-800">Panel de Control</h1><p className="text-slate-500 mt-1">Resumen general y alertas operativas sincronizadas.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"><div className="flex-1"> <div className="text-slate-500 text-sm font-bold mb-1">Cuentas Propias</div> <div className="text-3xl font-black text-blue-600">{stats.streamingPropios}</div> </div><div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center"><MonitorPlay className="w-6 h-6 text-blue-500" /></div></div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"><div className="flex-1"> <div className="text-slate-500 text-sm font-bold mb-1">Cuentas Externas</div> <div className="text-3xl font-black text-indigo-600">{stats.streamingExternos}</div> </div><div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center"><Cloud className="w-6 h-6 text-indigo-500" /></div></div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"><div className="flex-1"> <div className="text-slate-500 text-sm font-bold mb-1">Stock Antivirus</div> <div className="text-3xl font-black text-emerald-600">{stats.llavesDisponibles}</div> </div><div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center"><Key className="w-6 h-6 text-emerald-500" /></div></div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"><div className="flex-1"> <div className="text-slate-500 text-sm font-bold mb-1">Clientes Software</div> <div className="text-3xl font-black text-cyan-600">{stats.software}</div> </div><div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center"><Briefcase className="w-6 h-6 text-cyan-500" /></div></div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-orange-500"/> Alertas de Vencimientos</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFiltroAlertas('todas')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'todas' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Todas</button>
            <button onClick={() => setFiltroAlertas('propias')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'propias' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>Streaming Propio</button>
            <button onClick={() => setFiltroAlertas('antivirus')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'antivirus' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>Antivirus</button>
            <button onClick={() => setFiltroAlertas('software')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'software' ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}>Software</button>
            <button onClick={() => setFiltroAlertas('inactivos')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${filtroAlertas === 'inactivos' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300'}`}>Olvidados</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase">
              <tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Servicio</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alertasFiltradas.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500 flex items-center mt-0.5">+{client.telefono}</div></td>
                  <td className="px-6 py-4"><div className="font-bold text-slate-700">{client.servicio}</div><div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{client.categoria === 'antivirus' ? '🛡️ Antivirus' : client.categoria === 'software' ? '💼 Software' : client.idMaster ? '📺 Máster Propia' : '☁️ Externo'}</div></td>
                  <td className="px-6 py-4"><div className="font-medium text-slate-700">{formatDateToLocal(client.fechaVencimiento)}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span></td>
                  <td className="px-6 py-4 text-right"><button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"><MessageCircle className="w-4 h-4" /></button></td>
                </tr>
              ))}
              {alertasFiltradas.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-medium">No hay alertas para esta categoría.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StreamingList = ({ processedClients, cuentasMaster, setWaActionModal, setEditingClient, setInitialCategory, setIsClientModalOpen, handleDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredClients = processedClients.filter(c => c.categoria === 'streaming' && (c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono?.includes(searchTerm))).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><MonitorPlay className="w-8 h-8 mr-3 text-blue-600"/> Cuentas Streaming</h1></div>
        <button onClick={() => { setInitialCategory('streaming'); setEditingClient(null); setIsClientModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-md w-full md:w-auto justify-center transition-colors"><Plus className="w-5 h-5 mr-2" /> Vender Perfil</button>
      </div>
      <div className="relative"><Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Buscar cliente o número..." className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-white focus:border-blue-500 outline-none transition-colors font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase"><tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Servicio / Cuenta</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500 flex items-center mt-0.5">+{client.telefono}</div></td>
                  <td className="px-6 py-4"><div className="font-bold text-slate-700 flex items-center">{client.servicio} <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">{client.perfil && client.idMaster ? `P${client.perfil}` : client.perfilExterno}</span></div><div className="text-[11px] font-medium text-slate-500 mt-1">{client.idMaster ? cuentasMaster.find(m => m.id === client.idMaster)?.correo || 'Master eliminada' : client.correoExterno ? `${client.correoExterno} (Ext)` : null}</div></td>
                  <td className="px-6 py-4"><div className="font-medium text-slate-700">{formatDateToLocal(client.fechaVencimiento)}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span></td>
                  <td className="px-6 py-4 text-right"><div className="flex items-center justify-end space-x-2"><button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><MessageCircle className="w-4 h-4" /></button><button onClick={() => { setEditingClient(client); setInitialCategory('streaming'); setIsClientModalOpen(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SoftwareList = ({ processedClients, setWaActionModal, setEditingClient, setInitialCategory, setIsClientModalOpen, handleDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredClients = processedClients.filter(c => c.categoria === 'software' && (c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.servicio?.toLowerCase().includes(searchTerm.toLowerCase()))).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><Briefcase className="w-8 h-8 mr-3 text-cyan-600"/> Software Profesional</h1></div>
        <button onClick={() => { setInitialCategory('software'); setEditingClient(null); setIsClientModalOpen(true); }} className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-md w-full md:w-auto justify-center"><UserPlus className="w-5 h-5 mr-2" /> Vender / Prospectar</button>
      </div>
      <div className="relative"><Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Buscar profesional o programa..." className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-white focus:border-cyan-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase"><tr><th className="px-6 py-4">Profesional</th><th className="px-6 py-4">Software</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500">+{client.telefono}</div></td>
                  <td className="px-6 py-4"><div className="font-bold text-cyan-700">{client.servicio}</div><div className="text-[11px] font-medium text-slate-500">{client.correoExterno || 'Sin correo guardado'}</div></td>
                  <td className="px-6 py-4"><div className="font-medium text-slate-700">{formatDateToLocal(client.fechaVencimiento)}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span></td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end space-x-2"><button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><MessageCircle className="w-4 h-4" /></button><button onClick={() => { setEditingClient(client); setInitialCategory('software'); setIsClientModalOpen(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-100 text-red-700 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AntivirusList = ({ processedClients, setWaActionModal, setEditingClient, setInitialCategory, setIsClientModalOpen, handleDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredClients = processedClients.filter(c => c.categoria === 'antivirus' && (c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.proveedorKey?.toLowerCase().includes(searchTerm.toLowerCase()))).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><ShieldCheck className="w-8 h-8 mr-3 text-purple-600"/> Clientes Antivirus</h1></div>
        <button onClick={() => { setInitialCategory('antivirus'); setEditingClient(null); setIsClientModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-md w-full md:w-auto justify-center"><Plus className="w-5 h-5 mr-2" /> Vender Licencia</button>
      </div>
      <div className="relative"><Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Buscar cliente o código KEY..." className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-white focus:border-purple-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase"><tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Key y Equipo</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => {
                const parsedData = parseLicenseText(client.detallesLicencia);
                return (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500">+{client.telefono}</div></td>
                    <td className="px-6 py-4"><div className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded inline-block">{client.proveedorKey || 'Sin KEY guardada'}</div>{parsedData?.maquina && <div className="text-[11px] font-medium text-slate-500 mt-1">🖥️ {parsedData.maquina}</div>}</td>
                    <td className="px-6 py-4"><div className="font-medium text-slate-700">{formatDateToLocal(client.fechaVencimiento)}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span></td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end space-x-2"><button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg"><MessageCircle className="w-4 h-4" /></button><button onClick={() => { setEditingClient(client); setInitialCategory('antivirus'); setIsClientModalOpen(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-100 text-red-700 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CampanasList = ({ processedClients, stockAV, handleGiveGift, triggerWhatsAppAlert, syncStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredClients = processedClients.filter(c => c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono?.includes(searchTerm)).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
  const freeEsetKeys = stockAV.filter(k => k.producto.includes('ESET') && k.estado === 'Disponible').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center"><Gift className="w-8 h-8 mr-3 text-pink-500"/> Campañas y Regalos</h1>
          <p className="text-slate-500 mt-1">Fideliza a tus clientes regalando meses de antivirus. Base unificada.</p>
        </div>
        <div className="bg-pink-50 border-2 border-pink-200 text-pink-700 px-4 py-2 rounded-xl flex items-center font-bold">
          <Key className="w-5 h-5 mr-2" /> ESET Libres: {freeEsetKeys}
        </div>
      </div>
      
      <div className="relative"><Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input type="text" placeholder="Buscar cualquier cliente (Streaming, Software o Antivirus)..." className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-white focus:border-pink-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase">
              <tr><th className="px-6 py-4">Cliente Unificado</th><th className="px-6 py-4">Servicio Actual</th><th className="px-6 py-4">Vencimiento Actual</th><th className="px-6 py-4 text-right">Acción Comercial</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500">+{client.telefono}</div></td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${client.categoria === 'streaming' ? 'bg-blue-100 text-blue-800' : client.categoria === 'antivirus' ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800'}`}>
                      {client.categoria}
                    </span>
                    <div className="font-medium text-slate-700 mt-1">{client.servicio}</div>
                  </td>
                  <td className="px-6 py-4"><div className="font-medium text-slate-700">{formatDateToLocal(client.fechaVencimiento)}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span></td>
                  <td className="px-6 py-4 text-right flex justify-end space-x-2">
                    <button onClick={() => triggerWhatsAppAlert(client, 'alerta')} className="px-3 py-2 bg-orange-100 text-orange-700 font-bold rounded-lg hover:bg-orange-200 text-xs flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1"/> Renovar
                    </button>
                    <button onClick={() => handleGiveGift(client)} disabled={syncStatus === 'sincronizando' || freeEsetKeys === 0} className="px-3 py-2 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 text-xs flex items-center disabled:opacity-50">
                      <Gift className="w-4 h-4 mr-1"/> Regalar ESET
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StockAntivirusList = ({ stockAV, setStockAV, syncToSheets, showToast, setConfirmAction, syncStatus }) => {
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [newProduct, setNewProduct] = useState('ESET NOD32 Premium');
  const [keysRaw, setKeysRaw] = useState('');

  const productosSugeridos = Array.from(new Set(['ESET NOD32 Premium', 'ESET Internet Security', 'ESET Mobile Security', 'Kaspersky Plus', 'McAfee Total Protection', ...stockAV.map(k => k.producto)])).filter(Boolean).sort();

  const handleAddKeys = async (e) => {
    e.preventDefault();
    const lines = keysRaw.split('\n').map(l => l.trim()).filter(l => l);
    if(lines.length === 0) return;
    const newKeys = lines.map(line => ({
      id: `K_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
      producto: newProduct, llave: line, estado: 'Disponible',
      fechaAgregado: getToday().toISOString().split('T')[0], idCliente: ''
    }));
    setStockAV(prev => [...newKeys, ...prev]);
    showToast(`${newKeys.length} Licencias Agregadas a Inventario`);
    setKeysRaw('');
    await syncToSheets('guardarMultiplesLlaves', newKeys);
  };

  const handleDeleteKey = async (id) => {
    setConfirmAction({
      message: '¿Eliminar esta licencia del inventario?',
      onConfirm: async () => {
        setStockAV(prev => prev.filter(k => k.id !== id));
        setConfirmAction(null); showToast('Licencia eliminada');
        await syncToSheets('eliminarLlave', { id });
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><Key className="w-8 h-8 mr-3 text-emerald-600"/> Inventario de Licencias</h1></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form onSubmit={handleAddKeys} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center mb-4"><Plus className="w-5 h-5 mr-2 text-emerald-500"/> Agregar Llaves en Masa</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Producto</label>
              {!isCustomProduct ? (
                <select className="w-full border-2 border-emerald-200 rounded-xl p-3 focus:border-emerald-500 font-bold bg-white" value={newProduct} onChange={e => {
                  if(e.target.value === 'OTRO') { setIsCustomProduct(true); setNewProduct(''); }
                  else setNewProduct(e.target.value);
                }}>
                  {productosSugeridos.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="OTRO">➕ Agregar otro antivirus...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input type="text" autoFocus required className="w-full border-2 border-emerald-200 rounded-xl p-3 focus:border-emerald-500 font-bold bg-white" value={newProduct} onChange={e=>setNewProduct(e.target.value)} placeholder="Ej. Norton 360" />
                  <button type="button" onClick={() => {setIsCustomProduct(false); setNewProduct('ESET NOD32 Premium');}} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"><X className="w-5 h-5"/></button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Pega las llaves (Una por línea)</label>
              <textarea required rows="5" className="w-full border-2 border-emerald-200 rounded-xl p-3 font-mono text-sm bg-white focus:border-emerald-500 uppercase" placeholder="AAAA-BBBB-CCCC-DDDD&#10;XXXX-YYYY-ZZZZ-WWWW" value={keysRaw} onChange={e=>setKeysRaw(e.target.value)} />
            </div>
            <button type="submit" disabled={syncStatus === 'sincronizando' || !keysRaw.trim() || !newProduct.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl p-3 shadow-md flex justify-center items-center transition-colors disabled:opacity-50"><Server className="w-5 h-5 mr-2"/> Guardar Licencias en Bóveda</button>
          </form>
        </div>
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase sticky top-0 backdrop-blur-sm z-10">
                <tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4">Key de Activación</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Borrar</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockAV.map(k => (
                  <tr key={k.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-bold text-slate-700">{k.producto}</td>
                    <td className="px-6 py-3"><div className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded inline-block font-bold">{k.llave}</div></td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${k.estado === 'Disponible' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>{k.estado === 'Disponible' ? 'Libre' : 'Usada'}</span></td>
                    <td className="px-6 py-3 text-right"><button onClick={() => handleDeleteKey(k.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const MasterAccountsList = ({ cuentasMaster, setCuentasMaster, clientes, syncToSheets, showToast, syncStatus }) => {
  const [newMaster, setNewMaster] = useState({ id: null, correo: '', clave: '', plataforma: 'Netflix', limitePerfiles: 5, fechaRenovacion: getToday().toISOString().split('T')[0] });
  const [isCustomPlatform, setIsCustomPlatform] = useState(false);
  const plataformasSugeridas = Array.from(new Set(['Netflix', 'Disney+', 'Max', 'Gemini Pro', 'Amazon Prime', 'Spotify', 'Crunchyroll', 'YouTube Premium', 'Paramount+', ...cuentasMaster.map(m => m.plataforma)])).filter(Boolean).sort();

  const handleAdd = async (e) => {
    e.preventDefault();
    const isEditing = !!newMaster.id;
    const newId = isEditing ? newMaster.id : `M_${Date.now()}`;
    const newMasterObj = { ...newMaster, id: newId };
    
    if (isEditing) setCuentasMaster(prev => prev.map(m => m.id === newId ? newMasterObj : m));
    else setCuentasMaster(prev => [...prev, newMasterObj]); 

    setNewMaster({ id: null, correo: '', clave: '', plataforma: 'Netflix', limitePerfiles: 5, fechaRenovacion: getToday().toISOString().split('T')[0] });
    setIsCustomPlatform(false); showToast(isEditing ? 'Cuenta Master Actualizada' : 'Cuenta Master Agregada');
    await syncToSheets('guardarMaster', newMasterObj);
  };

  const handleDelete = async (id) => {
    setCuentasMaster(prev => prev.filter(m => m.id !== id));
    showToast('Cuenta Máster Eliminada'); await syncToSheets('eliminarMaster', { id });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><Server className="w-8 h-8 mr-3 text-orange-500"/> Cuentas Máster</h1></div>
      <div className={`p-6 rounded-2xl shadow-sm border ${newMaster.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
          <div className="xl:col-span-1">
            <label className="block text-xs font-bold text-slate-500 mb-2">Plataforma</label>
            {!isCustomPlatform ? (
              <select required className="w-full border-2 rounded-xl p-3 font-bold bg-white" value={newMaster.plataforma} onChange={e => { if (e.target.value === 'OTRA_NUEVA') { setIsCustomPlatform(true); setNewMaster({...newMaster, plataforma: ''}); } else setNewMaster({...newMaster, plataforma: e.target.value}); }}>
                {plataformasSugeridas.map(plat => <option key={plat} value={plat}>{plat}</option>)}
                <option value="OTRA_NUEVA">➕ Añadir otra nueva...</option>
              </select>
            ) : (
              <input required type="text" autoFocus className="w-full border-2 rounded-xl p-3 font-bold" placeholder="Escribe aquí..." value={newMaster.plataforma} onChange={e => setNewMaster({...newMaster, plataforma: e.target.value})} />
            )}
          </div>
          <div className="xl:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-2">Correo de la Cuenta</label><input required type="email" className="w-full border-2 rounded-xl p-3 bg-white font-medium" value={newMaster.correo} onChange={e=>setNewMaster({...newMaster, correo: e.target.value})} /></div>
          <div className="xl:col-span-1"><label className="block text-xs font-bold text-slate-500 mb-2">Clave Maestra</label><input required type="text" className="w-full border-2 rounded-xl p-3 bg-white font-medium" value={newMaster.clave} onChange={e=>setNewMaster({...newMaster, clave: e.target.value})} /></div>
          <div className="xl:col-span-1 flex space-x-2">
            <div className="w-1/2"><label className="block text-xs font-bold text-slate-500 mb-2">Perfiles</label><input required type="number" min="1" className="w-full border-2 rounded-xl p-3 bg-white font-bold" value={newMaster.limitePerfiles} onChange={e=>setNewMaster({...newMaster, limitePerfiles: e.target.value})} /></div>
            <div className="w-1/2"><label className="block text-xs font-bold text-slate-500 mb-2">Renovación</label><input required type="date" className="w-full border-2 rounded-xl p-3 bg-white font-bold text-xs" value={newMaster.fechaRenovacion} onChange={e=>setNewMaster({...newMaster, fechaRenovacion: e.target.value})} /></div>
          </div>
          <div className="xl:col-span-1">
            <button type="submit" disabled={syncStatus === 'sincronizando'} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl p-3 shadow-lg flex justify-center items-center disabled:opacity-50">{newMaster.id ? <RefreshCw className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />} {newMaster.id ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cuentasMaster.map(master => {
          const ocupados = clientes.filter(c => c.idMaster === master.id).length;
          const limit = parseInt(master.limitePerfiles) || 5;
          const isFull = ocupados >= limit;
          return (
            <div key={master.id} className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden ${isFull ? 'bg-slate-50 border-slate-200' : 'bg-white border-orange-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div><div className="font-bold text-orange-700 text-lg flex items-center">{master.plataforma} {isFull && <Lock className="w-4 h-4 ml-2 text-slate-400"/>}</div><div className="font-mono text-sm mt-1 font-medium">{master.correo}</div><div className="text-xs text-slate-500 mt-1">Renueva: {formatDateToLocal(master.fechaRenovacion)}</div></div>
                <div className="flex space-x-1"><button onClick={() => {setNewMaster(master); setIsCustomPlatform(false);}} className="p-2 text-slate-400 hover:text-blue-500"><Edit className="w-4 h-4"/></button><button onClick={() => handleDelete(master.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>
              </div>
              <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2"><span>Perfiles Ocupados</span><span className={isFull ? 'text-red-600' : 'text-emerald-600'}>{ocupados} / {limit}</span></div>
                <div className="w-full bg-slate-200 rounded-full h-2.5"><div className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${(ocupados/limit)*100}%`}}></div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Configuracion = ({ plantillas, setPlantillas, showToast, syncToSheets, syncStatus }) => {
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);

  const handleAdd = () => {
    const newTemplate = { id: `PL_${Date.now()}`, nombre: 'Nuevo Software', beneficios: '🚀 *BENEFICIOS INCLUIDOS:*\n✅ Licencia oficial completa', ofrecer: ['¡Hola {nombre}! Te escribimos para ofrecerte...'] };
    setEditingId(newTemplate.id); setFormData(newTemplate);
  };

  const handleSave = async () => {
    const isNew = !plantillas.some(p => p.id === formData.id);
    if (isNew) setPlantillas(prev => [...prev, formData]);
    else setPlantillas(prev => prev.map(p => p.id === formData.id ? formData : p));
    setEditingId(null); showToast('Enviando a Google Sheets...');
    await syncToSheets('guardarPlantilla', formData);
  };

  const handleDelete = async (id) => {
    setPlantillas(prev => prev.filter(p => p.id !== id));
    setEditingId(null); showToast('Borrando de Google Sheets...');
    await syncToSheets('eliminarPlantilla', { id });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><Settings className="w-8 h-8 mr-3 text-slate-600"/> Plantillas y Productos</h1><p className="text-slate-500 mt-1">Agrega nuevos programas de software y personaliza sus mensajes automáticos.</p></div>
      <div className="flex justify-end"><button onClick={handleAdd} disabled={syncStatus === 'sincronizando'} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-md disabled:opacity-50"><Plus className="w-5 h-5 mr-2" /> Nuevo Producto</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {plantillas.map(p => (
            <div key={p.id} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${editingId === p.id ? 'border-slate-800 bg-slate-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-400'}`} onClick={() => { setEditingId(p.id); setFormData(p); }}>
              <div className="font-bold text-slate-800">{p.nombre}</div>
              <div className="text-xs text-slate-500 mt-1">{p.ofrecer.length} variantes de prospección</div>
            </div>
          ))}
          {plantillas.length === 0 && <p className="text-sm text-slate-500">Crea tu primer producto para empezar a sincronizar.</p>}
        </div>

        {editingId && formData && (
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5 animate-fadeIn">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Producto *</label>
              <input className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:border-slate-500 font-bold" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Canva Pro Equipos" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Beneficios (Se envía al Entregar Credenciales)</label>
              <textarea rows="4" className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:border-slate-500 text-sm" value={formData.beneficios} onChange={e => setFormData({...formData, beneficios: e.target.value})} placeholder="Lista de beneficios..."></textarea>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">Mensajes de Prospección (Al Ofrecer)</label>
                <button onClick={() => setFormData({...formData, ofrecer: [...formData.ofrecer, '¡Hola {nombre}! Te ofrecemos...']})} className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200">+ Añadir Variante</button>
              </div>
              <p className="text-xs text-slate-500 mb-3">Usa <code className="bg-slate-100 px-1 rounded font-bold text-blue-600">{'{nombre}'}</code> para que el sistema ponga el nombre del cliente automáticamente.</p>
              <div className="space-y-3">
                {formData.ofrecer.map((msg, index) => (
                  <div key={index} className="relative">
                    <textarea rows="3" className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:border-slate-500 text-sm pr-10" value={msg} onChange={e => { const newOfrecer = [...formData.ofrecer]; newOfrecer[index] = e.target.value; setFormData({...formData, ofrecer: newOfrecer}); }} />
                    {formData.ofrecer.length > 1 && (<button onClick={() => { const newOfrecer = formData.ofrecer.filter((_, i) => i !== index); setFormData({...formData, ofrecer: newOfrecer}); }} className="absolute top-3 right-3 p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><Trash2 className="w-4 h-4"/></button>)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button disabled={syncStatus === 'sincronizando'} onClick={() => handleDelete(formData.id)} className="px-4 py-2.5 text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center disabled:opacity-50"><Trash2 className="w-4 h-4 mr-2"/> Eliminar Producto</button>
              <button disabled={syncStatus === 'sincronizando'} onClick={handleSave} className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 flex items-center disabled:opacity-50"><Server className="w-4 h-4 mr-2"/> Guardar Cambios</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5. APLICACIÓN PRINCIPAL (ESTADOS Y LÓGICA)
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('kgb_auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [cuentasMaster, setCuentasMaster] = useState([]);
  const [stockAV, setStockAV] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [integrantes, setIntegrantes] = useState([{ id: 'int1', nombre: 'Equipo Principal', telefono: '51999999999' }]);
  
  const [syncStatus, setSyncStatus] = useState('conectando'); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [initialCategory, setInitialCategory] = useState('streaming');
  const [waActionModal, setWaActionModal] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setLoginError(false);
    setTimeout(() => {
      if (passwordInput === ADMIN_PASSWORD) {
        localStorage.setItem('kgb_auth', 'true');
        setIsAuthenticated(true);
      } else { 
        setLoginError(true); 
        setIsAuthenticating(false); 
      }
    }, 2000); 
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDataFromSheets = useCallback(async () => {
    if (!SCRIPT_URL) return;
    setSyncStatus('sincronizando');
    try {
      const fetchUrl = `${SCRIPT_URL}?nocache=${new Date().getTime()}`;
      const response = await fetch(fetchUrl);
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setClientes(data.clientes || []);
        setCuentasMaster(data.masters || []);
        setStockAV(data.stockAV || []);
        setPlantillas(data.plantillas || []);
        if(data.integrantes && data.integrantes.length > 0) setIntegrantes(data.integrantes);
        setSyncStatus('sincronizado');
      } catch (parseError) { 
        throw new Error('Error al leer Google'); 
      }
    } catch (error) { 
      setSyncStatus('error'); 
    }
  }, []);

  const syncToSheets = async (accion, payload) => {
    setSyncStatus('sincronizando');
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion: accion, action: accion, datos: payload, payload: payload })
      });
      const text = await response.text();
      const result = JSON.parse(text);
      if(result.exito || result.status === 'success') { 
        setSyncStatus('sincronizado'); 
        fetchDataFromSheets(); 
        return true; 
      }
      else throw new Error(result.mensaje || 'Error desconocido');
    } catch (error) {
      setSyncStatus('error'); showToast(`Error al sincronizar`, 'error'); return false;
    }
  };

  useEffect(() => { fetchDataFromSheets(); }, [fetchDataFromSheets]);

  const processedClients = useMemo(() => {
    return clientes.map(client => {
      const days = getDaysRemaining(client.fechaVencimiento);
      let statusInfo = { text: 'Activo', color: 'bg-green-100 text-green-800', urgency: 0 };
      if (days < 0) statusInfo = { text: 'Vencido', color: 'bg-gray-200 text-gray-800', urgency: 5 };
      else if (days === 0) statusInfo = { text: 'Vence hoy', color: 'bg-red-600 text-white', urgency: 4 };
      else if (days === 1) statusInfo = { text: 'Vence mañana', color: 'bg-red-100 text-red-800', urgency: 3 };
      else if (days <= 3) statusInfo = { text: 'Aviso Importante', color: 'bg-orange-100 text-orange-800', urgency: 2 };
      else if (days <= parametros.diasAlerta) statusInfo = { text: 'Próximo a vencer', color: 'bg-yellow-100 text-yellow-800', urgency: 1 };
      return { ...client, daysRemaining: days, statusInfo };
    });
  }, [clientes]);

  const urgentClients = useMemo(() => { return processedClients.filter(c => c.statusInfo.urgency > 0).sort((a, b) => a.daysRemaining - b.daysRemaining); }, [processedClients]);

  const stats = useMemo(() => {
    return {
      streamingPropios: clientes.filter(c => c.categoria === 'streaming' && c.idMaster).length,
      streamingExternos: clientes.filter(c => c.categoria === 'streaming' && !c.idMaster).length,
      software: clientes.filter(c => c.categoria === 'software').length,
      alertasPropias: urgentClients.filter(c => c.categoria === 'streaming' && c.idMaster && c.daysRemaining >= 0).length,
      alertasExternas: urgentClients.filter(c => c.categoria === 'streaming' && !c.idMaster && c.daysRemaining >= 0).length,
      antivirus: clientes.filter(c => c.categoria === 'antivirus').length,
      inactivos: processedClients.filter(c => c.daysRemaining < 0).length,
      llavesDisponibles: stockAV.filter(k => k.estado === 'Disponible').length
    };
  }, [clientes, urgentClients, processedClients, stockAV]);

  const handleDeleteClient = (id) => {
    setConfirmAction({
      message: '¿Eliminar este registro permanentemente?',
      onConfirm: async () => {
        setClientes(prev => prev.filter(c => c.id !== id));
        setConfirmAction(null); showToast('Registro eliminado');
        await syncToSheets('eliminarCliente', { id });
      }
    });
  };

  const handleSaveClient = async (clientData, sendWhatsApp = false, tipoCuenta = 'master', idLlaveUsada = null, perfilesAdicionales = []) => {
    setIsClientModalOpen(false); 
    showToast('Guardando datos...');

    const isNew = !clientData.id;
    const finalClient = { ...clientData, id: isNew ? `C_${Date.now()}` : clientData.id };
    
    const clientesAGuardar = [finalClient];

    perfilesAdicionales.forEach((extraProfile, index) => {
       if(extraProfile.idMaster || extraProfile.perfilExterno || extraProfile.correoExterno) {
          clientesAGuardar.push({
             ...finalClient,
             id: `C_${Date.now()}_${index + 1}`,
             idMaster: extraProfile.idMaster || '',
             perfil: extraProfile.perfil || '',
             pin: extraProfile.pin || '',
             correoExterno: extraProfile.correoExterno || '',
             claveExterna: extraProfile.claveExterna || '',
             perfilExterno: extraProfile.perfilExterno || ''
          });
       }
    });

    let newClientesList = [...clientes];
    clientesAGuardar.forEach(c => {
       if (isNew) newClientesList.unshift(c);
       else newClientesList = newClientesList.map(existente => existente.id === c.id ? c : existente);
    });
    setClientes(newClientesList);

    for (let c of clientesAGuardar) {
       await syncToSheets('guardarCliente', c);
    }

    if (idLlaveUsada) {
       const llave = stockAV.find(k => k.id === idLlaveUsada);
       if(llave) {
           const updatedLlave = { ...llave, estado: 'Usada', idCliente: finalClient.id };
           setStockAV(prev => prev.map(k => k.id === idLlaveUsada ? updatedLlave : k));
           await syncToSheets('guardarLlave', updatedLlave);
       }
    }
    
    if (sendWhatsApp) {
       triggerWhatsAppAlert(finalClient, 'venta', tipoCuenta, clientesAGuardar);
    }
  };

  const triggerWhatsAppAlert = (client, type, tipoCuenta, arrayClientesMultiples = null) => {
    let msg = ``;
    const isMaster = !!client.idMaster;
    const fechaVencimiento = formatDateToLocal(client.fechaVencimiento);
    const configSoft = plantillas.find(p => p.nombre && client.servicio && String(p.nombre).trim().toLowerCase() === String(client.servicio).trim().toLowerCase());

    if (type === 'ofrecer') {
      let opcionesOfrecer = [];
      if (client.categoria === 'software' && configSoft) {
        let msgs = configSoft.ofrecer;
        if (typeof msgs === 'string') { try { msgs = JSON.parse(msgs); } catch (e) { msgs = [msgs]; } }
        if (Array.isArray(msgs) && msgs.length > 0) opcionesOfrecer = msgs;
      }
      if (opcionesOfrecer.length === 0) {
        if (configSoft && configSoft.beneficios) opcionesOfrecer = [`¡Hola {nombre}! 👋 Te contactamos para ofrecerte *${client.servicio}*.\n\n${configSoft.beneficios}\n\n¿Te interesa?`];
        else opcionesOfrecer = [`¡Hola {nombre}! 👋 Desde *${parametros.nombreNegocio}* te presentamos *${client.servicio}*.\n\nUna herramienta esencial para optimizar tu trabajo y mejorar tu productividad.\n\n¿Te gustaría recibir más información o conocer nuestros precios? ¡Escríbenos! 🚀`];
      }
      msg = opcionesOfrecer[Math.floor(Math.random() * opcionesOfrecer.length)];
      msg = msg.replace(/{nombre}/gi, client.nombre || 'Cliente');

    } else if (type === 'venta') {
      msg += `¡Hola ${client.nombre}! 👋\nTe escribimos de *${parametros.nombreNegocio}*.\n\nTu cuenta de *${client.servicio}* ha sido activada con éxito.\n\n`;
      
      if (client.categoria === 'software' && configSoft) {
        msg += `${configSoft.beneficios || ''}\n\n`;
      }

      msg += `*TUS CREDENCIALES DE ACCESO:*\n`;
      if (client.categoria === 'antivirus') {
         msg += `🛡️ Key de Activación: *${client.proveedorKey}*\n\n`;
         msg += `*INSTRUCCIONES DE INSTALACIÓN:*\n`;
         
         const servicioLower = (client.servicio || '').toLowerCase();
         if (servicioLower.includes('mobile') || servicioLower.includes('celular') || servicioLower.includes('android')) {
            msg += `1️⃣ Entra a la Play Store o App Store en tu celular y descarga la app *ESET Mobile Security*.\n`;
            msg += `2️⃣ Abre la aplicación, omite los pasos iniciales y ve a la opción de 'Suscripción' o 'Ingresar clave de licencia'.\n`;
            msg += `3️⃣ Pega la Key de Activación que te enviamos arriba.\n`;
         } else if (servicioLower.includes('eset') || servicioLower.includes('nod32') || servicioLower.includes('internet security')) {
            msg += `1️⃣ Descarga el instalador oficial desde este enlace: https://download.eset.com/com/eset/tools/installers/live_eav/latest/eset_nod32_antivirus_live_installer.exe\n`;
            msg += `2️⃣ Abre el archivo descargado y presiona "Siguiente" hasta que el programa te pida la clave de activación.\n`;
            msg += `3️⃣ Escribe o pega la Key de Activación que te hemos enviado.\n`;
            msg += `4️⃣ Continúa presionando "Siguiente" para finalizar y ¡listo! Disfruta de tu equipo totalmente protegido.\n`;
         } else {
            msg += `Ingresa al sitio oficial de tu antivirus y utiliza la Key de Activación proporcionada para validar tu versión Premium.\n`;
         }
      } else if (client.categoria === 'software') {
         msg += `👤 Correo de acceso: ${client.correoExterno}\n🔑 Contraseña: ${client.claveExterna}\n`;
      } else if (isMaster || tipoCuenta === 'master') {
         const listaParaMsg = arrayClientesMultiples || [client];
         listaParaMsg.forEach((c, idx) => {
            msg += `📺 Perfil Asignado: P${c.perfil}\n`;
            if (c.pin) {
                if (c.pin.includes('@')) msg += `📧 Invitación: ${c.pin}\n`;
                else msg += `🔐 PIN: ${c.pin}\n`;
            }
            if(idx < listaParaMsg.length - 1) msg += `\n`;
         });
      } else if (!isMaster && client.correoExterno) {
         const listaParaMsg = arrayClientesMultiples || [client];
         listaParaMsg.forEach((c, idx) => {
            if(idx === 0) msg += `👤 Correo: ${c.correoExterno}\n🔑 Clave: ${c.claveExterna}\n`;
            msg += `📺 Perfil: ${c.perfilExterno}\n`;
            if (c.pin) {
                if (c.pin.includes('@')) msg += `📧 Invitación: ${c.pin}\n`;
                else msg += `🔐 PIN: ${c.pin}\n`;
            }
            if(idx < listaParaMsg.length - 1) msg += `\n`;
         });
      }
      msg += `\n📅 Vencimiento programado: ${fechaVencimiento}\n\n¡Gracias por confiar en ${parametros.nombreNegocio}! 💼💙`;
    } 
    else if (type === 'reenganche') {
      msg += `¡Hola ${client.nombre}! 👋\nTe escribimos de *${parametros.nombreNegocio}*.\n\n`;
      const opcionesReenganche = [
        `Hace un tiempo disfrutaste de nuestros servicios y queríamos pasar a saludarte. ✨\n\nSi en algún momento deseas volver a activar tu cuenta de *${client.servicio}* o explorar otras plataformas profesionales y de entretenimiento, ¡avísanos!\n\nEstaremos muy felices de volver a atenderte. 😊💙`,
        `Esperamos que te encuentres súper bien. 🌟\n\nNotamos que hace tiempo no tienes activa tu cuenta de *${client.servicio}*. Si deseas retomarla o probar alguna otra plataforma con nosotros, aquí seguimos a tu disposición. ¡Te extrañamos por ${parametros.nombreNegocio}! 🚀`
      ];
      msg += opcionesReenganche[Math.floor(Math.random() * opcionesReenganche.length)];
    }
    else {
      msg += `¡Hola ${client.nombre}! 👋\nTe escribimos de *${parametros.nombreNegocio}*.\n\n`;
      let opcionesAlerta = [];
      if (client.categoria === 'software') {
         opcionesAlerta = [
           `Pasábamos a recordarte amablemente que tu licencia profesional de *${client.servicio}* culmina el *${fechaVencimiento}*.\n\nSi deseas renovar tu cuenta para no perder acceso a tus herramientas de trabajo, escríbenos por aquí y lo gestionamos de inmediato. 💼😊`,
           `¡Atención con tus herramientas! ⚙️ Tu cuenta de *${client.servicio}* se vence el *${fechaVencimiento}*.\n\nPara no interrumpir tus proyectos, confírmanos si gustas renovar y lo preparamos todo. ¡Saludos profesionales!`
         ];
      } else if (isMaster) {
         const accesoStr = `\n📺 Perfil: P${client.perfil}\n${client.pin ? (client.pin.includes('@') ? `📧 Invitación: ${client.pin}\n` : `🔐 PIN: ${client.pin}\n`) : ''}`;
         opcionesAlerta = [
           `Pasábamos a recordarte amablemente que tu servicio de *${client.servicio}* culmina el *${fechaVencimiento}*.\n\nPara tu comodidad, te recordamos tu acceso:${accesoStr}\nSi deseas continuar disfrutando del servicio, con gusto te ayudamos. Estaremos felices de mantenerte con nosotros. 😊🍿`,
           `¡Aviso de vencimiento! ⚠ Tu cuenta de *${client.servicio}* vence el *${fechaVencimiento}*.\n\nAquí tienes tus datos de acceso actuales:${accesoStr}\nPara no perder el acceso a tus perfiles, confírmanos por aquí si deseas renovar. ¡Gracias por elegirnos! 💙`
         ];
      } else if (client.categoria === 'antivirus') {
         opcionesAlerta = [
           `Pasábamos a recordarte amablemente que tu licencia de *${client.servicio}* culmina el *${fechaVencimiento}*.\n\nSi deseas renovar tu licencia anual para mantener la seguridad de tu equipo, escríbenos por aquí y con gusto te ayudamos con la actualización. 🛡️😊`
         ];
      } else {
         opcionesAlerta = [
           `Pasábamos a recordarte amablemente que tu servicio de *${client.servicio}* culmina el *${fechaVencimiento}*.\n\nSi te gustaría continuar disfrutando del servicio, por favor avísanos por este medio y con mucho gusto te ayudamos a gestionarlo. 😊💙`
         ];
      }
      msg += opcionesAlerta[Math.floor(Math.random() * opcionesAlerta.length)];
    }
    
    window.open(`https://wa.me/${parametros.codigoPais}${client.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
    setWaActionModal(null);
  };

  const handleGiveGift = async (client) => {
    const isAsiduo = window.confirm("¿Es un cliente asiduo? (Dará instrucciones para reclamar cada mes)");
    const mesesRegalo = 1;

    const llaveDisponible = stockAV.find(k => k.producto.includes('ESET') && k.estado === 'Disponible');
    if (!llaveDisponible) {
      showToast('No hay llaves de ESET disponibles en inventario', 'error');
      return;
    }

    const updatedLlave = { ...llaveDisponible, estado: 'Usada', idCliente: client.id };
    setStockAV(prev => prev.map(k => k.id === updatedLlave.id ? updatedLlave : k));
    await syncToSheets('guardarLlave', updatedLlave);

    const fechaInicio = getToday().toISOString().split('T')[0];
    const fechaVencimiento = addMonthsToDate(fechaInicio, mesesRegalo);
    
    const registroRegalo = {
      id: `C_${Date.now()}_GIFT`,
      nombre: client.nombre,
      telefono: client.telefono,
      servicio: 'ESET Mobile Security',
      categoria: 'antivirus',
      fechaInicio: fechaInicio,
      fechaVencimiento: fechaVencimiento,
      idIntegrante: integrantes[0]?.id || '',
      proveedorKey: llaveDisponible.llave,
      detallesLicencia: 'Regalo Promocional',
      idMaster: '', perfil: '', pin: '', correoExterno: '', claveExterna: '', perfilExterno: ''
    };

    setClientes(prev => [registroRegalo, ...prev]);
    showToast('Regalo registrado y llave descontada');
    await syncToSheets('guardarCliente', registroRegalo);

    const mensajeAsiduo = isAsiduo ? `\n\n⭐ *BENEFICIO EXCLUSIVO:* Al ser uno de nuestros clientes más fieles, ¡no te olvides de reclamar tu nueva clave cada mes con nosotros! 🚀` : '';

    let msg = `¡Hola ${client.nombre}! 👋 Te escribimos de *${parametros.nombreNegocio}*.

¡Queremos agradecerte por tu constante preferencia! 🎉 Como muestra de nuestro aprecio, te hemos obsequiado una licencia Premium de *ESET Mobile Security* exclusivamente para tu celular, totalmente GRATIS. 🎁

*TUS DATOS DE ACTIVACIÓN:*
🛡️ Key de Activación: *${llaveDisponible.llave}*
📅 Válida hasta: ${formatDateToLocal(fechaVencimiento)}

*INSTRUCCIONES DE INSTALACIÓN:*
1️⃣ Entra a la Play Store o App Store en tu celular y descarga la aplicación *ESET Mobile Security*.
2️⃣ Abre la app, omite los pasos iniciales y ve a la opción de 'Suscripción' o 'Ingresar clave de licencia'.
3️⃣ Pega el código de activación que te hemos enviado arriba.${mensajeAsiduo}

¡Disfruta tu regalo y gracias por confiar siempre en ${parametros.nombreNegocio}! 💙`;

    window.open(`https://wa.me/${parametros.codigoPais}${client.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const ClientFormModal = () => {
    if (!isClientModalOpen) return null;
    const isEdit = !!editingClient;
    const isAntivirus = initialCategory === 'antivirus';
    const isSoftware = initialCategory === 'software';
    
    const [formData, setFormData] = useState(editingClient || { 
      nombre: '', telefono: '', servicio: isAntivirus ? 'ESET NOD32 Premium' : isSoftware ? (plantillas[0]?.nombre || 'Software') : 'Netflix', 
      categoria: initialCategory, 
      fechaInicio: getToday().toISOString().split('T')[0], fechaVencimiento: getToday().toISOString().split('T')[0], 
      idIntegrante: integrantes[0]?.id || '', proveedorKey: '', detallesLicencia: '',
      idMaster: '', perfil: '', pin: '', correoExterno: '', claveExterna: '', perfilExterno: ''
    });

    const [tipoCuenta, setTipoCuenta] = useState(editingClient ? (editingClient.idMaster ? 'master' : 'externo') : isSoftware ? 'externo' : 'master');
    const [origenKey, setOrigenKey] = useState(editingClient ? 'manual' : 'inventario');
    const [idLlaveSeleccionada, setIdLlaveSeleccionada] = useState('');
    
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [perfilesAdicionales, setPerfilesAdicionales] = useState([]);

    const clientesUnicos = useMemo(() => {
      const map = new Map();
      clientes.forEach(c => {
         if(!map.has(c.telefono) && c.nombre) map.set(c.telefono, c);
      });
      return Array.from(map.values());
    }, [clientes]);

    const filteredSuggestions = clientesUnicos.filter(c => c.nombre.toLowerCase().includes(formData.nombre.toLowerCase()) || String(c.telefono).includes(formData.nombre));
    const existingClient = clientes.find(c => c.telefono === formData.telefono && (!editingClient || c.id !== editingClient.id));
    
    const plataformasAntivirus = Array.from(new Set(['ESET NOD32 Premium', 'ESET Internet Security', 'ESET Mobile Security', 'Kaspersky Plus', 'McAfee Total Protection', ...stockAV.map(k => k.producto)])).sort();
    let plataformasDisponibles = [];
    if (isAntivirus) plataformasDisponibles = plataformasAntivirus;
    else if (isSoftware) plataformasDisponibles = plantillas.map(p => p.nombre);
    else plataformasDisponibles = Array.from(new Set(['Netflix', 'Disney+', 'Max', 'Amazon Prime', 'Spotify', ...cuentasMaster.map(m => m.plataforma)])).sort();

    const llavesDisponibles = stockAV.filter(k => k.producto === formData.servicio && k.estado === 'Disponible');

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] animate-fadeIn">
          <div className={`p-6 text-white flex justify-between items-center ${isAntivirus ? 'bg-gradient-to-r from-purple-700 to-purple-500' : isSoftware ? 'bg-gradient-to-r from-cyan-700 to-cyan-500' : 'bg-gradient-to-r from-blue-700 to-blue-500'}`}>
            <h3 className="font-bold text-2xl flex items-center">{isAntivirus ? <ShieldCheck className="w-7 h-7 mr-2"/> : isSoftware ? <Briefcase className="w-7 h-7 mr-2"/> : <MonitorPlay className="w-7 h-7 mr-2"/>} {isAntivirus ? 'Vender Antivirus' : isSoftware ? 'Prospecto / Profesional' : 'Vender Perfil de Streaming'}</h3>
            <button onClick={() => setIsClientModalOpen(false)} className="bg-black/20 p-2 rounded-full hover:bg-black/40"><X className="w-6 h-6"/></button>
          </div>
          
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800 flex items-center"><Smartphone className="w-5 h-5 mr-2 text-slate-400"/> Datos del {isSoftware ? 'Profesional' : 'Cliente'}</h4>
                <div className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded border border-blue-200">⚡ {clientesUnicos.length} en memoria</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-2">Nombre *</label>
                  <input className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:bg-white" value={formData.nombre} 
                    onFocus={() => setShowAutocomplete(true)}
                    onChange={e => { setFormData({...formData, nombre: e.target.value}); setShowAutocomplete(true); }} 
                    placeholder={isSoftware ? "Ej. Ing. Sofía" : "Ej. Carlos Pérez"} 
                    onKeyDown={(e) => {
                      if((e.key === 'Tab' || e.key === 'Enter') && showAutocomplete && filteredSuggestions.length > 0) {
                        e.preventDefault();
                        setFormData({...formData, nombre: filteredSuggestions[0].nombre, telefono: filteredSuggestions[0].telefono});
                        setShowAutocomplete(false);
                      }
                    }}
                  />
                  {showAutocomplete && formData.nombre.length > 0 && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {filteredSuggestions.map(s => (
                        <div key={s.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between items-center" 
                          onClick={() => { setFormData({...formData, nombre: s.nombre, telefono: s.telefono}); setShowAutocomplete(false); }}>
                          <span className="font-bold text-slate-700">{s.nombre}</span><span className="text-xs text-slate-400">+{s.telefono}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {showAutocomplete && formData.nombre.length > 0 && filteredSuggestions.length > 0 && (
                    <div className="text-[10px] text-blue-500 mt-1 font-bold text-right">Presiona Tab o Enter para autocompletar</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">WhatsApp (Sin código) *</label><input type="tel" className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:bg-white font-medium" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})} placeholder="999888777" />
                  {existingClient && <div className="text-xs text-orange-600 mt-2 font-bold flex items-center bg-orange-50 p-2 rounded-lg border border-orange-200"><AlertTriangle className="w-4 h-4 mr-1.5"/>Ya registrado: {existingClient.nombre}</div>}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Server className="w-5 h-5 mr-2 text-slate-400"/> Asignación de Servicio</h4>
               <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 mb-2">Software / Producto *</label>
                <select className="w-full border-2 rounded-xl p-3 font-bold bg-slate-50" value={formData.servicio} onChange={e => {setFormData({...formData, servicio: e.target.value, idMaster: '', proveedorKey: ''}); setIdLlaveSeleccionada(''); setPerfilesAdicionales([]);}}>
                  {plataformasDisponibles.map(plat => <option key={plat} value={plat}>{plat}</option>)}
                </select>
                {isSoftware && plantillas.length === 0 && <p className="text-xs text-red-500 mt-2 font-bold">⚠ No has creado ningún producto. Ve a la pestaña "Configuración".</p>}
              </div>

              {!isAntivirus && (
                <div className={`${isSoftware ? 'bg-cyan-50 border-cyan-100' : 'bg-orange-50 border-orange-100'} border-2 rounded-2xl p-5 space-y-4`}>
                  <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                     <button type="button" onClick={() => setTipoCuenta('externo')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${tipoCuenta === 'externo' ? (isSoftware ? 'bg-cyan-600 text-white' : 'bg-indigo-500 text-white') : 'text-slate-500'}`}>Asignar Acceso / Invitación</button>
                     {!isSoftware && <button type="button" onClick={() => setTipoCuenta('master')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${tipoCuenta === 'master' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>Mis Cuentas Máster</button>}
                  </div>
                  
                  {tipoCuenta === 'master' && !isSoftware ? (
                    <div>
                      <select className="w-full border-2 border-orange-200 rounded-xl p-3 font-medium bg-white" value={formData.idMaster} onChange={e => {
                          const mId = e.target.value;
                          if(!mId) return setFormData({...formData, idMaster: '', perfil: ''});
                          const ocupados = clientes.filter(c => c.idMaster === mId && c.id !== editingClient?.id).map(c => parseInt(c.perfil));
                          let sigPerfil = 1; while(ocupados.includes(sigPerfil)) sigPerfil++;
                          setFormData({...formData, idMaster: mId, perfil: sigPerfil.toString() });
                      }}>
                        <option value="">-- Seleccionar Cuenta Máster --</option>
                        {cuentasMaster.filter(m => formData.servicio.includes(m.plataforma) || m.plataforma.includes(formData.servicio)).map(m => (
                          <option key={m.id} value={m.id}>{m.correo} (Libres: {(parseInt(m.limitePerfiles)||5) - clientes.filter(c => c.idMaster === m.id && c.id !== editingClient?.id).length})</option>
                        ))}
                      </select>
                      {formData.idMaster && (
                         <div className="space-y-3 mt-4">
                           <div className="flex gap-4 items-start">
                             <div className="w-1/3 flex items-center justify-center text-sm font-bold text-green-800 bg-green-100 rounded-xl border border-green-200 h-[52px]">Perfil {formData.perfil}</div>
                             <div className="w-2/3"><input type="text" className="w-full border-2 border-orange-200 rounded-xl p-3.5 font-bold text-orange-900 bg-white" value={formData.pin || ''} onChange={(e) => setFormData({...formData, pin: e.target.value})} placeholder="PIN o Correo (Invitación)" /></div>
                           </div>
                           
                           {perfilesAdicionales.map((extra, idx) => (
                             <div key={idx} className="flex gap-4 items-start relative bg-orange-100/50 p-2 rounded-xl border border-orange-200 border-dashed">
                               <div className="w-1/3"><input type="text" className="w-full border-2 border-orange-200 rounded-xl p-2.5 font-bold text-center text-green-800 bg-white" value={extra.perfil || ''} onChange={(e) => { const n = [...perfilesAdicionales]; n[idx].perfil = e.target.value; setPerfilesAdicionales(n); }} placeholder="Nº Perfil" /></div>
                               <div className="w-2/3 relative"><input type="text" className="w-full border-2 border-orange-200 rounded-xl p-2.5 font-bold text-orange-900 bg-white pr-10" value={extra.pin || ''} onChange={(e) => { const n = [...perfilesAdicionales]; n[idx].pin = e.target.value; setPerfilesAdicionales(n); }} placeholder="PIN o Correo (Extra)" /><button type="button" onClick={() => setPerfilesAdicionales(perfilesAdicionales.filter((_, i) => i !== idx))} className="absolute right-2 top-2.5 text-red-500 hover:text-red-700"><X className="w-5 h-5"/></button></div>
                             </div>
                           ))}

                           <button type="button" onClick={() => {
                              const mId = formData.idMaster;
                              const ocupados = clientes.filter(c => c.idMaster === mId && c.id !== editingClient?.id).map(c => parseInt(c.perfil));
                              const ocupadosLocales = [parseInt(formData.perfil), ...perfilesAdicionales.map(p => parseInt(p.perfil))];
                              const todosOcupados = [...ocupados, ...ocupadosLocales];
                              let sigPerfil = 1; while(todosOcupados.includes(sigPerfil)) sigPerfil++;
                              setPerfilesAdicionales([...perfilesAdicionales, { idMaster: mId, perfil: sigPerfil.toString(), pin: '' }]);
                           }} className="w-full py-3 mt-2 bg-white border-2 border-orange-300 border-dashed text-orange-600 font-bold rounded-xl hover:bg-orange-50 flex items-center justify-center transition-colors">
                              <UserPlus className="w-5 h-5 mr-2" /> + Añadir otro perfil a esta venta
                           </button>
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <input type="email" placeholder="Correo Asignado" value={formData.correoExterno || ''} onChange={e=>setFormData({...formData, correoExterno: e.target.value})} className={`col-span-2 md:col-span-1 border-2 ${isSoftware ? 'border-cyan-200' : 'border-indigo-100'} rounded-xl p-3 font-medium`} />
                         <input type="text" placeholder="Clave (Opcional)" value={formData.claveExterna || ''} onChange={e=>setFormData({...formData, claveExterna: e.target.value})} className={`col-span-2 md:col-span-1 border-2 ${isSoftware ? 'border-cyan-200' : 'border-indigo-100'} rounded-xl p-3 font-medium`} />
                         {!isSoftware && <input type="text" placeholder="Perfil (Ej. P3)" value={formData.perfilExterno || ''} onChange={e=>setFormData({...formData, perfilExterno: e.target.value})} className="border-2 border-indigo-100 rounded-xl p-3 font-bold text-center" />}
                         {!isSoftware && <input type="text" placeholder="PIN / Invitación" value={formData.pin || ''} onChange={e=>setFormData({...formData, pin: e.target.value})} className="border-2 border-indigo-100 rounded-xl p-3 font-bold text-center" />}
                       </div>
                       
                       {!isSoftware && perfilesAdicionales.map((extra, idx) => (
                         <div key={idx} className="flex gap-4 items-center bg-indigo-50/50 p-2 rounded-xl border border-indigo-200 border-dashed relative">
                           <div className="w-1/2"><input type="text" placeholder="Perfil Extra (Ej. P4)" value={extra.perfilExterno || ''} onChange={(e) => { const n = [...perfilesAdicionales]; n[idx].perfilExterno = e.target.value; setPerfilesAdicionales(n); }} className="w-full border-2 border-indigo-100 rounded-xl p-2.5 font-bold text-center" /></div>
                           <div className="w-1/2 relative"><input type="text" placeholder="PIN Extra" value={extra.pin || ''} onChange={(e) => { const n = [...perfilesAdicionales]; n[idx].pin = e.target.value; setPerfilesAdicionales(n); }} className="w-full border-2 border-indigo-100 rounded-xl p-2.5 font-bold text-center pr-8" /><button type="button" onClick={() => setPerfilesAdicionales(perfilesAdicionales.filter((_, i) => i !== idx))} className="absolute right-2 top-2.5 text-red-500 hover:text-red-700"><X className="w-5 h-5"/></button></div>
                         </div>
                       ))}
                       
                       {!isSoftware && (
                         <button type="button" onClick={() => setPerfilesAdicionales([...perfilesAdicionales, { correoExterno: formData.correoExterno, claveExterna: formData.claveExterna, perfilExterno: '', pin: '' }])} className="w-full py-3 bg-white border-2 border-indigo-200 border-dashed text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 flex items-center justify-center transition-colors">
                            <UserPlus className="w-5 h-5 mr-2" /> + Añadir otro perfil externo a esta venta
                         </button>
                       )}
                    </div>
                  )}
                </div>
              )}

              {isAntivirus && (
                 <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5 mt-4">
                    {!isEdit && (
                       <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-purple-200 mb-4">
                         <button type="button" onClick={() => setOrigenKey('inventario')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${origenKey === 'inventario' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Key className="w-4 h-4 inline mr-1"/> Usar de Inventario</button>
                         <button type="button" onClick={() => { setOrigenKey('manual'); setFormData({...formData, proveedorKey: ''}); setIdLlaveSeleccionada(''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg ${origenKey === 'manual' ? 'bg-purple-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Edit className="w-4 h-4 inline mr-1"/> Ingreso Manual</button>
                       </div>
                    )}
                    
                    {origenKey === 'inventario' && !isEdit ? (
                       <div>
                         <label className="block text-xs font-bold text-emerald-800 mb-2">Selecciona una KEY disponible ({llavesDisponibles.length} Libres)</label>
                         <select className="w-full border-2 border-emerald-300 rounded-xl p-4 font-mono font-bold text-emerald-900 bg-white" value={idLlaveSeleccionada} onChange={e => {
                            const selectedId = e.target.value; setIdLlaveSeleccionada(selectedId);
                            const keyObj = stockAV.find(k => k.id === selectedId);
                            if(keyObj) setFormData({...formData, proveedorKey: keyObj.llave});
                         }}>
                            <option value="">-- Elige una KEY del inventario --</option>
                            {llavesDisponibles.map(k => <option key={k.id} value={k.id}>{k.llave}</option>)}
                         </select>
                         {llavesDisponibles.length === 0 && <p className="text-xs text-red-500 mt-2 font-bold">No tienes llaves disponibles para este producto.</p>}
                       </div>
                    ) : (
                       <div>
                         <label className="block text-sm font-black text-purple-900 mb-3 tracking-wide">KEY DEL PROVEEDOR *</label>
                         <input className="w-full border-2 border-purple-300 rounded-xl p-4 font-mono font-bold text-lg text-center uppercase bg-white focus:border-purple-600" value={formData.proveedorKey || ''} onChange={e => setFormData({...formData, proveedorKey: e.target.value.toUpperCase()})} placeholder="XXXX-XXXX-XXXX-XXXX" />
                       </div>
                    )}
                 </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-slate-400"/> Duración del Servicio</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Inicio del Servicio *</label>
                  <input type="date" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-slate-50" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
                 </div>
                 <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Calcular automáticamente</label>
                  <select className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-medium" onChange={(e) => {
                      if(e.target.value) setFormData({...formData, fechaVencimiento: addMonthsToDate(formData.fechaInicio, parseInt(e.target.value))});
                  }}>
                    <option value="">-- Añadir Tiempo --</option>
                    <option value="1">1 Mes</option><option value="3">3 Meses</option><option value="6">6 Meses</option><option value="12">12 Meses</option>
                  </select>
                 </div>
                 <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Vencimiento Exacto *</label>
                  <input type="date" className="w-full border-2 border-blue-200 rounded-xl p-3 font-bold text-blue-900 bg-blue-50" value={formData.fechaVencimiento} onChange={e => setFormData({...formData, fechaVencimiento: e.target.value})} />
                 </div>
               </div>
            </div>
          </div>
          
          <div className="p-6 border-t bg-white flex flex-col-reverse md:flex-row justify-end gap-3 rounded-b-3xl">
            <button onClick={() => setIsClientModalOpen(false)} className="px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Cancelar</button>
            <button onClick={() => handleSaveClient(formData, false, tipoCuenta, idLlaveSeleccionada, perfilesAdicionales)} disabled={syncStatus === 'sincronizando' || !formData.nombre} className="px-6 py-3.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50 flex items-center justify-center">Solo Guardar {perfilesAdicionales.length > 0 && `(${perfilesAdicionales.length + 1})`}</button>
            <button onClick={() => handleSaveClient(formData, true, tipoCuenta, idLlaveSeleccionada, perfilesAdicionales)} disabled={syncStatus === 'sincronizando' || !formData.nombre || (isSoftware && plantillas.length === 0)} className={`px-6 py-3.5 ${isAntivirus ? 'bg-purple-600' : isSoftware ? 'bg-cyan-600' : 'bg-green-500'} text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center`}><MessageCircle className="w-5 h-5 mr-2"/> Guardar y Notificar {perfilesAdicionales.length > 0 && `(${perfilesAdicionales.length + 1})`}</button>
          </div>
        </div>
      </div>
    );
  };

  const WaActionModal = () => {
    if (!waActionModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center"><MessageCircle className="w-6 h-6 mr-2 text-green-500"/> Notificar Cliente</h3>
            <button onClick={() => setWaActionModal(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5"/></button>
          </div>
          <div className="space-y-3">
            {waActionModal.categoria === 'software' ? (
              <>
                <button onClick={() => triggerWhatsAppAlert(waActionModal, 'ofrecer')} className="w-full p-4 bg-cyan-50 border-2 border-cyan-200 rounded-2xl flex items-center text-left hover:bg-cyan-100"><div className="bg-cyan-500 text-white p-2.5 rounded-xl mr-3"><Briefcase className="w-5 h-5"/></div><div><div className="font-bold text-cyan-900">Ofrecer / Prospectar 🚀</div></div></button>
                <button onClick={() => triggerWhatsAppAlert(waActionModal, 'venta')} className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center text-left hover:bg-green-100"><div className="bg-green-500 text-white p-2.5 rounded-xl mr-3"><Plus className="w-5 h-5"/></div><div><div className="font-bold text-green-900">Entregar Credenciales</div></div></button>
                <button onClick={() => triggerWhatsAppAlert(waActionModal, 'alerta')} className="w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center text-left hover:bg-orange-100"><div className="bg-orange-500 text-white p-2.5 rounded-xl mr-3"><AlertTriangle className="w-5 h-5"/></div><div><div className="font-bold text-orange-900">Alerta Vencimiento</div></div></button>
              </>
            ) : (
              <>
                <button onClick={() => triggerWhatsAppAlert(waActionModal, 'venta')} className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center text-left hover:bg-green-100"><div className="bg-green-500 text-white p-2.5 rounded-xl mr-3"><Plus className="w-5 h-5"/></div><div><div className="font-bold text-green-900">Entregar Credenciales</div></div></button>
                <button onClick={() => triggerWhatsAppAlert(waActionModal, 'alerta')} className="w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center text-left hover:bg-orange-100"><div className="bg-orange-500 text-white p-2.5 rounded-xl mr-3"><AlertTriangle className="w-5 h-5"/></div><div><div className="font-bold text-orange-900">Alerta Vencimiento</div></div></button>
                <button onClick={() => triggerWhatsAppAlert(waActionModal, 'reenganche')} className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center text-left hover:bg-purple-100"><div className="bg-purple-500 text-white p-2.5 rounded-xl mr-3"><RefreshCw className="w-5 h-5"/></div><div><div className="font-bold text-purple-900">Reconectar (Ex-Cliente)</div></div></button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ConfirmModal = () => {
    if (!confirmAction) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center animate-fadeIn">
          <h3 className="text-xl font-bold text-slate-800 mb-2">¿Estás seguro?</h3>
          <p className="text-slate-600 mb-6">{confirmAction.message}</p>
          <div className="flex space-x-3 justify-center">
            <button onClick={() => setConfirmAction(null)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
            <button onClick={confirmAction.onConfirm} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700">Sí, Ejecutar</button>
          </div>
        </div>
      </div>
    );
  };

  const ToastContainer = () => {
    if (!toast) return null;
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[300] animate-fadeIn">
        <div className={`px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}><Check className="w-5 h-5 mr-2 text-green-400" />{toast.message}</div>
      </div>
    );
  };

  const SyncIndicator = () => (
    <div className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${syncStatus === 'sincronizado' ? 'bg-green-50 text-green-700 border-green-200' : syncStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : syncStatus === 'sincronizando' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
       {syncStatus === 'sincronizando' ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin"/> : syncStatus === 'error' ? <AlertTriangle className="w-3.5 h-3.5 mr-1.5"/> : <Cloud className="w-3.5 h-3.5 mr-1.5"/>}
       {syncStatus === 'sincronizado' ? <span className="hidden sm:inline">Conectado a Sheets</span> : syncStatus === 'error' ? 'Falla en Sinc.' : syncStatus === 'sincronizando' ? 'Sincronizando...' : 'Desconectado'}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center font-sans text-slate-300 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] mix-blend-screen"></div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative z-10 w-full max-w-md p-8 animate-fadeIn">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-[0_0_40px_rgba(37,99,235,0.15)] flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 relative">
              {isAuthenticating ? <Loader2 className="w-10 h-10 text-blue-500 animate-spin" /> : <Shield className="w-10 h-10 text-blue-500" />}
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"></div>
            </div>
            
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">{parametros.nombreNegocio}</h1>
            <p className="text-slate-400 text-sm font-medium mb-8 text-center">
              {isAuthenticating ? 'Desencriptando base de datos y cargando sistema...' : 'Acceso restringido al personal autorizado'}
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-5">
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                <input type="password" autoFocus disabled={isAuthenticating} placeholder="Ingrese su contraseña" 
                  className={`w-full bg-slate-950 border ${loginError ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'} rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all font-mono tracking-widest`}
                  value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                />
                {loginError && <p className="text-xs text-red-500 font-bold mt-2 absolute -bottom-5 left-1">Contraseña incorrecta, acceso denegado.</p>}
              </div>

              <button type="submit" disabled={isAuthenticating || !passwordInput}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3.5 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                {isAuthenticating ? <>Iniciando Sistema <Loader2 className="w-5 h-5 ml-2 animate-spin" /></> : <>Autenticar <Terminal className="w-5 h-5 ml-2" /></>}
              </button>
            </form>
          </div>
          <div className="text-center mt-6 text-xs text-slate-600 font-mono">SECURE CONNECTION • 256-BIT ENCRYPTED</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`.animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} activeTab={activeTab} setActiveTab={setActiveTab} setIsAuthenticated={setIsAuthenticated} />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="bg-white shadow-sm border-b px-4 md:px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-3 text-slate-500 hover:bg-slate-100 p-1 rounded-md"><Menu className="w-6 h-6" /></button>
              <div className="font-bold text-slate-800 md:text-slate-400 uppercase text-xs md:text-sm truncate"><span className="hidden sm:inline">Plataforma Operativa - </span>{parametros.nombreNegocio}</div>
            </div>
            <SyncIndicator />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'dashboard' && <Dashboard stats={stats} urgentClients={urgentClients} setWaActionModal={setWaActionModal} />}
              {activeTab === 'streaming' && <StreamingList processedClients={processedClients} cuentasMaster={cuentasMaster} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'software' && <SoftwareList processedClients={processedClients} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'antivirus' && <AntivirusList processedClients={processedClients} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'campanas' && <CampanasList processedClients={processedClients} stockAV={stockAV} handleGiveGift={handleGiveGift} triggerWhatsAppAlert={triggerWhatsAppAlert} syncStatus={syncStatus} />}
              {activeTab === 'masters' && <MasterAccountsList cuentasMaster={cuentasMaster} setCuentasMaster={setCuentasMaster} clientes={clientes} syncToSheets={syncToSheets} showToast={showToast} syncStatus={syncStatus} />}
              {activeTab === 'stock_av' && <StockAntivirusList stockAV={stockAV} setStockAV={setStockAV} syncToSheets={syncToSheets} showToast={showToast} setConfirmAction={setConfirmAction} syncStatus={syncStatus} />}
              {activeTab === 'configuracion' && <Configuracion plantillas={plantillas} setPlantillas={setPlantillas} showToast={showToast} syncToSheets={syncToSheets} syncStatus={syncStatus} />}
            </div>
          </main>
        </div>
        <ClientFormModal /><WaActionModal /><ToastContainer /><ConfirmModal />
      </div>
    </>
  );
}