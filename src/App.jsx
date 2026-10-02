import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MonitorPlay, X, Server, RefreshCw, AlertTriangle, Cloud, MessageCircle,
  ShieldCheck, Plus, Search, Smartphone, Check, Calendar, Key, Gift, Menu,
  Briefcase, Settings, Edit, Star, LayoutDashboard, Trash2
} from 'lucide-react';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJZ-EimBapTatv0qpBFTTZ3UyiIB_lh9nZ1zagAJ6-ylxfQUvRKPkJMC_MIvkJUjIy/exec";
const parametros = { nombreNegocio: 'KGB Streaming', codigoPais: '51', diasAlerta: 5 };

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
  d.setMonth(d.getMonth() + parseInt(months));
  return d.toISOString().split('T')[0];
};

const parseLicenseText = (text) => {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length === 0) return null;
  const data = {};
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('código') || lowerLine.includes('key')) data.codigo = line.split(':')[1]?.trim();
    else if (lowerLine.includes('usuario')) data.usuario = line.split(':')[1]?.trim();
    else if (lowerLine.includes('dispositivo') || lowerLine.includes('máquina')) data.maquina = line.split(':')[1]?.trim();
  });
  return Object.keys(data).length > 0 ? data : null;
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`p-5 rounded-2xl shadow-sm border bg-white ${color} transition-all hover:shadow-md`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 mt-2">{value}</h3>
      </div>
      <div className={`p-3.5 rounded-xl ${color.replace('border-', 'bg-').replace('200', '100')} text-${color.split('-')[1]}-600`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const SyncIndicator = ({ syncStatus }) => (
  <div className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${syncStatus === 'sincronizado' ? 'bg-green-50 text-green-700 border-green-200' : syncStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : syncStatus === 'sincronizando' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
    {syncStatus === 'sincronizando' ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : syncStatus === 'error' ? <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> : <Cloud className="w-3.5 h-3.5 mr-1.5" />}
    {syncStatus === 'sincronizado' ? <span className="hidden sm:inline">Conectado a Sheets</span> : syncStatus === 'error' ? 'Falla en Sinc.' : syncStatus === 'sincronizando' ? 'Sincronizando...' : 'Desconectado'}
  </div>
);

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen, activeTab, setActiveTab, parametros }) => {
  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'campanas', label: 'Campañas', icon: Gift },
    { id: 'streaming', label: 'Streaming', icon: MonitorPlay },
    { id: 'software', label: 'Software / Prof.', icon: Briefcase },
    { id: 'antivirus', label: 'Antivirus', icon: ShieldCheck },
    { id: 'masters', label: 'Cuentas Máster', icon: Server },
    { id: 'stock_av', label: 'Stock Antivirus', icon: Key },
    { id: 'configuracion', label: 'Configuración', icon: Settings }
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/50 z-20 md:hidden transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 z-30 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">{parametros.nombreNegocio}</h1>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Plataforma Operativa</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-inner">OP</div>
            <div>
              <p className="text-sm font-bold text-white">Operador</p>
              <p className="text-xs text-slate-500 font-medium">Administrador</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const Dashboard = ({ stats, urgentClients, setWaActionModal }) => {
  const [filtroAlertas, setFiltroAlertas] = useState('todas');

  const alertasFiltradas = urgentClients.filter(c => {
    if (filtroAlertas === 'propias') return c.categoria === 'streaming' && c.idMaster && c.daysRemaining >= 0;
    if (filtroAlertas === 'externas') return c.categoria === 'streaming' && !c.idMaster && c.daysRemaining >= 0;
    if (filtroAlertas === 'software') return c.categoria === 'software';
    if (filtroAlertas === 'antivirus') return c.categoria === 'antivirus';
    if (filtroAlertas === 'inactivos') return c.daysRemaining < 0;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Panel de Control</h2>
        <p className="text-slate-500 mt-1">Resumen general y alertas operativas sincronizadas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Alertas (Propias)" value={stats.alertasPropias} icon={AlertTriangle} color="border-orange-200" />
        <StatCard title="Streaming Activos" value={stats.streamingPropios + stats.streamingExternos} icon={MonitorPlay} color="border-blue-200" />
        <StatCard title="Software Profesional" value={stats.software} icon={Briefcase} color="border-cyan-200" />
        <StatCard title="Llaves Antivirus" value={stats.llavesDisponibles} icon={Key} color="border-emerald-200" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 flex items-center text-lg"><AlertTriangle className="w-5 h-5 mr-2 text-orange-500" /> Alertas de Vencimientos</h3>
          <div className="flex flex-wrap gap-2">
            {['todas', 'propias', 'externas', 'software', 'antivirus', 'inactivos'].map(f => (
              <button key={f} onClick={() => setFiltroAlertas(f)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors capitalize border ${filtroAlertas === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <th className="p-4">Cliente</th><th className="p-4">Servicio</th><th className="p-4">Vencimiento</th><th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alertasFiltradas.map(client => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="p-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500 font-mono mt-0.5">+{client.telefono}</div></td>
                  <td className="p-4">
                    <div className="font-bold text-slate-700">{client.servicio}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{client.categoria === 'software' ? 'Software' : client.categoria === 'antivirus' ? 'Antivirus' : client.idMaster ? 'Máster Propia' : 'Externo'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{formatDateToLocal(client.fechaVencimiento)}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => setWaActionModal(client)} className="p-2.5 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors shadow-sm" title="Contactar"><MessageCircle className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
              {alertasFiltradas.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-medium">No hay alertas pendientes para esta categoría.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CampanasList = ({ processedClients, setGiftClientTarget, setIsAsiduo, setIsGiftModalOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = processedClients.filter(c => c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono?.includes(searchTerm));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center"><Gift className="w-8 h-8 mr-3 text-pink-500" /> Campañas y Fidelización</h2>
        <p className="text-slate-500 mt-1">Historial unificado de clientes para enviar regalos y promociones.</p>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar en toda la base de clientes..." className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 focus:border-pink-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
              <th className="p-4">Cliente Unificado</th><th className="p-4">Servicio Actual</th><th className="p-4">Vencimiento</th><th className="p-4 text-center">Fidelización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(client => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="p-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500 font-mono">+{client.telefono}</div></td>
                <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${client.categoria === 'antivirus' ? 'bg-purple-100 text-purple-700' : client.categoria === 'software' ? 'bg-cyan-100 text-cyan-700' : 'bg-blue-100 text-blue-700'}`}>{client.servicio}</span></td>
                <td className="p-4"><div className="font-medium text-slate-700">{formatDateToLocal(client.fechaVencimiento)}</div></td>
                <td className="p-4 text-center">
                  <button onClick={() => { setGiftClientTarget(client); setIsAsiduo(false); setIsGiftModalOpen(true); }} className="px-4 py-2 bg-pink-100 text-pink-700 hover:bg-pink-200 rounded-xl font-bold inline-flex items-center transition-colors"><Gift className="w-4 h-4 mr-2" /> Regalar ESET</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StreamingList = ({ processedClients, cuentasMaster, setWaActionModal, setEditingClient, setInitialCategory, setIsClientModalOpen, handleDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = processedClients.filter(c => c.categoria === 'streaming' && (c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono?.includes(searchTerm))).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center"><MonitorPlay className="w-8 h-8 mr-3 text-blue-500" /> Streaming</h2>
          <p className="text-slate-500 mt-1">Gestión de cuentas de entretenimiento.</p>
        </div>
        <button onClick={() => { setInitialCategory('streaming'); setEditingClient(null); setIsClientModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center font-bold shadow-lg transition-colors"><Plus className="w-5 h-5 mr-2" /> Vender Perfil</button>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar cliente o número..." className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 focus:border-blue-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
              <th className="p-4">Cliente</th><th className="p-4">Servicio / Perfil</th><th className="p-4">Cuenta / Master</th><th className="p-4">Vencimiento</th><th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(client => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="p-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500 font-mono">+{client.telefono}</div></td>
                <td className="p-4">
                  <div className="font-bold text-slate-700">{client.servicio}</div>
                  <div className="text-xs font-bold text-blue-600 mt-0.5">{client.perfil && client.idMaster && `Perfil: P${client.perfil}`}{client.perfilExterno && !client.idMaster && `Perfil: ${client.perfilExterno}`}</div>
                </td>
                <td className="p-4 font-mono text-sm text-slate-600">{client.idMaster ? cuentasMaster.find(m => m.id === client.idMaster)?.correo || 'Master eliminada' : client.correoExterno ? `${client.correoExterno} (Ext)` : '-'}</td>
                <td className="p-4"><div className="font-medium text-slate-800">{formatDateToLocal(client.fechaVencimiento)}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span></td>
                <td className="p-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><MessageCircle className="w-5 h-5" /></button>
                    <button onClick={() => { setEditingClient(client); setInitialCategory('streaming'); setIsClientModalOpen(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SoftwareList = ({ processedClients, setWaActionModal, setEditingClient, setInitialCategory, setIsClientModalOpen, handleDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = processedClients.filter(c => c.categoria === 'software' && (c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono?.includes(searchTerm))).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center"><Briefcase className="w-8 h-8 mr-3 text-cyan-500" /> Software y Profesionales</h2>
          <p className="text-slate-500 mt-1">Suscripciones de herramientas de diseño y trabajo.</p>
        </div>
        <button onClick={() => { setInitialCategory('software'); setEditingClient(null); setIsClientModalOpen(true); }} className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-3 rounded-xl flex items-center font-bold shadow-lg transition-colors"><Plus className="w-5 h-5 mr-2" /> Nuevo Software</button>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar cliente o número..." className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 focus:border-cyan-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
              <th className="p-4">Cliente / Profesional</th><th className="p-4">Software</th><th className="p-4">Accesos de Trabajo</th><th className="p-4">Vencimiento</th><th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(client => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="p-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500 font-mono">+{client.telefono}</div></td>
                <td className="p-4"><span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-100 text-cyan-800">{client.servicio}</span></td>
                <td className="p-4">
                  {client.correoExterno ? (
                    <div><div className="font-mono text-sm text-slate-700">{client.correoExterno}</div><div className="text-xs text-slate-500">Clave: {client.claveExterna || 'Oculta'}</div></div>
                  ) : <span className="text-xs text-slate-400 italic">No registrados</span>}
                </td>
                <td className="p-4"><div className="font-medium text-slate-800">{formatDateToLocal(client.fechaVencimiento)}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span></td>
                <td className="p-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><MessageCircle className="w-5 h-5" /></button>
                    <button onClick={() => { setEditingClient(client); setInitialCategory('software'); setIsClientModalOpen(true); }} className="p-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AntivirusList = ({ processedClients, setWaActionModal, setEditingClient, setInitialCategory, setIsClientModalOpen, handleDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = processedClients.filter(c => c.categoria === 'antivirus' && (c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.proveedorKey?.toLowerCase().includes(searchTerm.toLowerCase()))).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center"><ShieldCheck className="w-8 h-8 mr-3 text-purple-500" /> Antivirus</h2>
          <p className="text-slate-500 mt-1">Gestión de licencias de seguridad.</p>
        </div>
        <button onClick={() => { setInitialCategory('antivirus'); setEditingClient(null); setIsClientModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl flex items-center font-bold shadow-lg transition-colors"><Plus className="w-5 h-5 mr-2" /> Vender Licencia</button>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar cliente o KEY..." className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 focus:border-purple-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
              <th className="p-4">Cliente</th><th className="p-4">Producto</th><th className="p-4">Key de Activación</th><th className="p-4">Vencimiento</th><th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(client => {
              const parsedData = parseLicenseText(client.detallesLicencia);
              return (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="p-4"><div className="font-bold text-slate-800">{client.nombre}</div><div className="text-xs text-slate-500 font-mono">+{client.telefono}</div></td>
                  <td className="p-4 font-bold text-slate-700">{client.servicio}</td>
                  <td className="p-4">
                    <div className="font-mono text-sm text-purple-700 font-bold bg-purple-50 px-2 py-1 rounded inline-block border border-purple-100">{client.proveedorKey || 'Sin KEY guardada'}</div>
                    {parsedData?.maquina && <div className="text-xs text-slate-500 mt-1">Dispositivo: {parsedData.maquina}</div>}
                  </td>
                  <td className="p-4"><div className="font-medium text-slate-800">{formatDateToLocal(client.fechaVencimiento)}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span></td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><MessageCircle className="w-5 h-5" /></button>
                      <button onClick={() => { setEditingClient(client); setInitialCategory('antivirus'); setIsClientModalOpen(true); }} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockAntivirusList = ({ stockAV, setStockAV, syncToSheets, showToast, setConfirmAction, syncStatus }) => {
  const [newProduct, setNewProduct] = useState('ESET NOD32 Premium');
  const [keysRaw, setKeysRaw] = useState('');

  const handleAddKeys = async (e) => {
    e.preventDefault();
    const lines = keysRaw.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;
    const newKeys = lines.map(line => ({
      id: `K_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      producto: newProduct, llave: line, estado: 'Disponible',
      fechaAgregado: getToday().toISOString().split('T')[0], idCliente: ''
    }));
    setStockAV(prev => [...newKeys, ...prev]);
    showToast(`${newKeys.length} Licencias agregadas al inventario.`);
    setKeysRaw('');
    await syncToSheets('guardarMultiplesLlaves', newKeys);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center"><Key className="w-8 h-8 mr-3 text-emerald-500" /> Inventario Antivirus</h2>
        <p className="text-slate-500 mt-1">Bóveda segura de códigos de activación listos para usar.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form onSubmit={handleAddKeys} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center border-b pb-3"><Plus className="w-5 h-5 mr-2 text-emerald-500" /> Cargar Lote de Licencias</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Producto</label>
              <select className="w-full border-2 border-emerald-100 rounded-xl p-3 font-bold bg-emerald-50/30 focus:border-emerald-500 outline-none" value={newProduct} onChange={e => setNewProduct(e.target.value)}>
                <option value="ESET NOD32 Premium">ESET NOD32 Premium (30 Días)</option>
                <option value="ESET Internet Security">ESET Internet Security</option>
                <option value="Kaspersky Plus">Kaspersky Plus</option>
                <option value="McAfee Total Protection">McAfee Total Protection</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Pegar KEYS (Una por línea)</label>
              <textarea required rows="6" className="w-full border-2 border-slate-200 rounded-xl p-3 font-mono text-sm bg-slate-50 focus:border-emerald-500 outline-none uppercase" placeholder="AAAA-BBBB-CCCC-DDDD&#10;XXXX-YYYY-ZZZZ-WWWW" value={keysRaw} onChange={e => setKeysRaw(e.target.value)}></textarea>
            </div>
            <button type="submit" disabled={syncStatus === 'sincronizando' || !keysRaw.trim()} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">Guardar en Bóveda</button>
          </form>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700 text-sm">Historial de Bóveda ({stockAV.length} registros)</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b">
                  <tr className="text-xs uppercase text-slate-500 font-bold">
                    <th className="p-4">Producto</th><th className="p-4">Key</th><th className="p-4 text-center">Estado</th><th className="p-4 text-center">Borrar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockAV.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-700">{k.producto}</td>
                      <td className="p-4 font-mono text-sm font-bold text-slate-600">{k.llave}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${k.estado === 'Disponible' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{k.estado === 'Disponible' ? 'Libre' : 'Usada'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => {
                          setConfirmAction({
                            message: '¿Eliminar esta licencia del inventario?',
                            onConfirm: async () => {
                              setStockAV(prev => prev.filter(key => key.id !== k.id));
                              setConfirmAction(null); showToast('Licencia eliminada');
                              await syncToSheets('eliminarLlave', { id: k.id });
                            }
                          });
                        }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MasterAccountsList = ({ cuentasMaster, setCuentasMaster, clientes, syncToSheets, showToast, syncStatus }) => {
  const [newMaster, setNewMaster] = useState({ id: null, correo: '', clave: '', plataforma: 'Netflix', limitePerfiles: 5, fechaRenovacion: getToday().toISOString().split('T')[0] });
  const [isCustomPlatform, setIsCustomPlatform] = useState(false);
  const plataformasSugeridas = Array.from(new Set(['Netflix', 'Disney+', 'Max', 'Amazon Prime', 'Spotify', 'Crunchyroll', 'Paramount+', ...cuentasMaster.map(m => m.plataforma)])).filter(Boolean).sort();

  const handleAdd = async (e) => {
    e.preventDefault();
    const isEditing = !!newMaster.id;
    const finalMaster = { ...newMaster, id: isEditing ? newMaster.id : `M_${Date.now()}` };
    setCuentasMaster(prev => isEditing ? prev.map(m => m.id === finalMaster.id ? finalMaster : m) : [...prev, finalMaster]);
    setNewMaster({ id: null, correo: '', clave: '', plataforma: 'Netflix', limitePerfiles: 5, fechaRenovacion: getToday().toISOString().split('T')[0] });
    setIsCustomPlatform(false);
    showToast(isEditing ? 'Cuenta Master actualizada.' : 'Cuenta Master agregada.');
    await syncToSheets('guardarMaster', finalMaster);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center"><Server className="w-8 h-8 mr-3 text-orange-500" /> Cuentas Máster Propias</h2>
        <p className="text-slate-500 mt-1">Administra tus cuentas principales y el límite de perfiles.</p>
      </div>
      <div className={`p-6 rounded-3xl shadow-sm border ${newMaster.id ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Plus className="w-5 h-5 mr-2 text-orange-500" /> {newMaster.id ? 'Editando Cuenta Máster' : 'Registrar Nueva Cuenta'}</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Plataforma</label>
            {!isCustomPlatform ? (
              <select required className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500 font-bold bg-slate-50" value={newMaster.plataforma} onChange={e => {
                if (e.target.value === 'OTRA_NUEVA') { setIsCustomPlatform(true); setNewMaster({ ...newMaster, plataforma: '' }); }
                else setNewMaster({ ...newMaster, plataforma: e.target.value });
              }}>
                {plataformasSugeridas.map(plat => <option key={plat} value={plat}>{plat}</option>)}
                <option value="OTRA_NUEVA">➕ Añadir otra nueva...</option>
              </select>
            ) : <input required autoFocus className="w-full border-2 border-orange-400 rounded-xl p-3 outline-none" value={newMaster.plataforma} onChange={e => setNewMaster({ ...newMaster, plataforma: e.target.value })} placeholder="Escribe el nombre..." />}
          </div>
          <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1.5">Correo</label><input required type="email" className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500" value={newMaster.correo} onChange={e => setNewMaster({ ...newMaster, correo: e.target.value })} /></div>
          <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1.5">Clave</label><input required type="text" className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500 font-mono" value={newMaster.clave} onChange={e => setNewMaster({ ...newMaster, clave: e.target.value })} /></div>
          <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1.5">Perfiles Totales</label><input required type="number" min="1" className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500" value={newMaster.limitePerfiles} onChange={e => setNewMaster({ ...newMaster, limitePerfiles: e.target.value })} /></div>
          <div className="md:col-span-1"><button type="submit" disabled={syncStatus === 'sincronizando'} className="w-full bg-orange-600 text-white font-bold rounded-xl py-3.5 shadow-md hover:bg-orange-700 disabled:opacity-50 transition-colors">{newMaster.id ? 'Actualizar' : 'Guardar'}</button></div>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cuentasMaster.map(master => {
          const ocupados = clientes.filter(c => c.idMaster === master.id).length;
          const limit = parseInt(master.limitePerfiles) || 5;
          const isFull = ocupados >= limit;
          return (
            <div key={master.id} className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden transition-colors ${isFull ? 'bg-slate-50 border-slate-200' : 'bg-white border-orange-200 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                <div><div className="font-bold text-orange-700 text-lg">{master.plataforma}</div><div className="font-mono text-sm text-slate-600 mt-1">{master.correo}</div></div>
                <div className="flex space-x-1">
                  <button onClick={() => { setNewMaster(master); setIsCustomPlatform(false); }} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={async () => {
                    if (confirm('¿Eliminar esta cuenta Master? Se perderá la referencia de los clientes asociados.')) {
                      setCuentasMaster(prev => prev.filter(m => m.id !== master.id));
                      showToast('Cuenta eliminada'); await syncToSheets('eliminarMaster', { id: master.id });
                    }
                  }} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2"><span>Ocupación de Perfiles</span><span>{ocupados} / {limit}</span></div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden"><div className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((ocupados / limit) * 100, 100)}%` }}></div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Configuracion = ({ plantillas, setPlantillas, showToast, syncToSheets, syncStatus }) => {
  const [newPlantilla, setNewPlantilla] = useState({ id: null, nombre: '', beneficios: '', ofrecer: [''] });

  const handleSave = async (e) => {
    e.preventDefault();
    const isEditing = !!newPlantilla.id;
    const finalPlantilla = { ...newPlantilla, id: isEditing ? newPlantilla.id : `P_${Date.now()}` };
    setPlantillas(prev => isEditing ? prev.map(p => p.id === finalPlantilla.id ? finalPlantilla : p) : [...prev, finalPlantilla]);
    setNewPlantilla({ id: null, nombre: '', beneficios: '', ofrecer: [''] });
    showToast(isEditing ? 'Plantilla actualizada' : 'Plantilla guardada');
    const dbPayload = { ...finalPlantilla, ofrecer: JSON.stringify(finalPlantilla.ofrecer) };
    await syncToSheets('guardarPlantilla', dbPayload);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center"><Settings className="w-8 h-8 mr-3 text-slate-600" /> Configuración de Plantillas</h2>
        <p className="text-slate-500 mt-1">Administra los textos y productos para Software y Profesionales.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center border-b pb-3"><Briefcase className="w-5 h-5 mr-2 text-cyan-600" /> {newPlantilla.id ? 'Editar Producto' : 'Crear Nuevo Producto / Software'}</h3>
          <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Nombre del Software / Herramienta *</label><input required className="w-full border-2 rounded-xl p-3 outline-none focus:border-cyan-500" value={newPlantilla.nombre} onChange={e => setNewPlantilla({ ...newPlantilla, nombre: e.target.value })} placeholder="Ej. Canva Pro, AutoCAD..." /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Beneficios (Aparecerá en mensaje de venta)</label><textarea className="w-full border-2 rounded-xl p-3 outline-none focus:border-cyan-500" rows="3" value={newPlantilla.beneficios} onChange={e => setNewPlantilla({ ...newPlantilla, beneficios: e.target.value })} placeholder="Ej. Acceso ilimitado a plantillas, almacenamiento en la nube..."></textarea></div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Opciones de Mensaje para Prospectar (Ofrecer)</label>
            {newPlantilla.ofrecer.map((msg, i) => (
              <div key={i} className="flex mb-2">
                <textarea required className="flex-1 border-2 rounded-l-xl p-3 text-sm outline-none focus:border-cyan-500" rows="2" value={msg} onChange={e => {
                  const arr = [...newPlantilla.ofrecer]; arr[i] = e.target.value; setNewPlantilla({ ...newPlantilla, ofrecer: arr });
                }} placeholder="¡Hola {nombre}! Te ofrecemos..." />
                <button type="button" onClick={() => {
                  const arr = newPlantilla.ofrecer.filter((_, idx) => idx !== i);
                  setNewPlantilla({ ...newPlantilla, ofrecer: arr.length ? arr : [''] });
                }} className="bg-red-50 text-red-500 px-3 rounded-r-xl border-y-2 border-r-2 border-red-100 hover:bg-red-100"><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setNewPlantilla({ ...newPlantilla, ofrecer: [...newPlantilla.ofrecer, ''] })} className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center mt-2"><Plus className="w-3 h-3 mr-1" /> Añadir otra variante de mensaje</button>
          </div>
          <button type="submit" disabled={syncStatus === 'sincronizando'} className="w-full bg-slate-800 text-white rounded-xl py-3.5 font-bold hover:bg-slate-900 transition-colors shadow-lg">Guardar Producto</button>
        </form>
        <div className="space-y-4">
          {plantillas.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start">
              <div className="flex-1 pr-4">
                <h4 className="font-bold text-slate-800 text-lg">{p.nombre}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.beneficios}</p>
                <div className="mt-3 inline-flex items-center text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md">{p.ofrecer?.length || 0} mensajes configurados</div>
              </div>
              <div className="flex flex-col space-y-2">
                <button onClick={() => setNewPlantilla(p)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><Edit className="w-4 h-4" /></button>
                <button onClick={async () => {
                  if (confirm('¿Eliminar plantilla?')) {
                    setPlantillas(prev => prev.filter(x => x.id !== p.id)); showToast('Eliminada'); await syncToSheets('eliminarPlantilla', { id: p.id });
                  }
                }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {plantillas.length === 0 && <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">Aún no has configurado ningún producto.</div>}
        </div>
      </div>
    </div>
  );
};

const ClientFormModal = ({ isOpen, onClose, editingClient, initialCategory, integrantes, clientes, cuentasMaster, stockAV, plantillas, syncStatus, onSave }) => {
  if (!isOpen) return null;
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

  let plataformasDisponibles = [];
  if (isAntivirus) plataformasDisponibles = ['ESET NOD32 Premium', 'ESET Internet Security', 'Kaspersky Plus', 'McAfee Total Protection'];
  else if (isSoftware) plataformasDisponibles = plantillas.map(p => p.nombre);
  else plataformasDisponibles = Array.from(new Set(['Netflix', 'Disney+', 'Max', 'Amazon Prime', 'Spotify', ...cuentasMaster.map(m => m.plataforma)])).sort();

  const llavesDisponibles = stockAV.filter(k => k.producto === formData.servicio && k.estado === 'Disponible');

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col my-auto animate-fadeIn max-h-full">
        <div className={`p-6 text-white flex justify-between items-center rounded-t-3xl shrink-0 ${isAntivirus ? 'bg-gradient-to-r from-purple-700 to-purple-500' : isSoftware ? 'bg-gradient-to-r from-cyan-700 to-cyan-500' : 'bg-gradient-to-r from-blue-700 to-blue-500'}`}>
          <h3 className="font-bold text-2xl flex items-center">{isAntivirus ? <ShieldCheck className="w-7 h-7 mr-2" /> : isSoftware ? <Briefcase className="w-7 h-7 mr-2" /> : <MonitorPlay className="w-7 h-7 mr-2" />} {isAntivirus ? 'Vender Antivirus' : isSoftware ? 'Suscripción Software' : 'Vender Perfil de Streaming'}</h3>
          <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Smartphone className="w-5 h-5 mr-2 text-slate-400" /> Datos del Cliente</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Nombre *</label><input className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:bg-white outline-none" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej. Carlos Pérez" /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5">WhatsApp (Sin código) *</label><input type="tel" className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:bg-white outline-none" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })} placeholder="999888777" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Server className="w-5 h-5 mr-2 text-slate-400" /> Producto y Acceso</h4>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Seleccionar Producto *</label>
              <select className="w-full border-2 rounded-xl p-3 font-bold bg-slate-50 outline-none" value={formData.servicio} onChange={e => { setFormData({ ...formData, servicio: e.target.value, idMaster: '', proveedorKey: '' }); setIdLlaveSeleccionada(''); }}>
                {plataformasDisponibles.map(plat => <option key={plat} value={plat}>{plat}</option>)}
              </select>
            </div>

            {!isAntivirus && (
              <div className={`${isSoftware ? 'bg-cyan-50 border-cyan-100' : 'bg-orange-50 border-orange-100'} border-2 rounded-2xl p-4 space-y-4`}>
                <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                  <button type="button" onClick={() => setTipoCuenta('externo')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tipoCuenta === 'externo' ? (isSoftware ? 'bg-cyan-600 text-white' : 'bg-indigo-500 text-white') : 'text-slate-500'}`}>Asignar Acceso Propio</button>
                  {!isSoftware && <button type="button" onClick={() => setTipoCuenta('master')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tipoCuenta === 'master' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>Usar Cuenta Máster</button>}
                </div>
                {tipoCuenta === 'master' && !isSoftware ? (
                  <div>
                    <select className="w-full border-2 border-orange-200 rounded-xl p-3 font-medium bg-white outline-none" value={formData.idMaster} onChange={e => {
                      const mId = e.target.value;
                      if (!mId) return setFormData({ ...formData, idMaster: '', perfil: '' });
                      const ocupados = clientes.filter(c => c.idMaster === mId && c.id !== editingClient?.id).map(c => parseInt(c.perfil));
                      let sigPerfil = 1; while (ocupados.includes(sigPerfil)) sigPerfil++;
                      setFormData({ ...formData, idMaster: mId, perfil: sigPerfil.toString() });
                    }}>
                      <option value="">-- Seleccionar Master Disponible --</option>
                      {cuentasMaster.filter(m => formData.servicio.includes(m.plataforma) || m.plataforma.includes(formData.servicio)).map(m => (
                        <option key={m.id} value={m.id}>{m.correo} (Libres: {(parseInt(m.limitePerfiles) || 5) - clientes.filter(c => c.idMaster === m.id && c.id !== editingClient?.id).length})</option>
                      ))}
                    </select>
                    {formData.idMaster && (
                      <div className="flex gap-3 items-start mt-3">
                        <div className="w-1/3 flex items-center justify-center text-sm font-bold text-green-800 bg-green-100 p-3 rounded-xl border border-green-200">Perfil {formData.perfil}</div>
                        <div className="w-2/3"><input type="text" className="w-full border-2 border-orange-200 rounded-xl p-3 font-bold text-orange-900 bg-white outline-none" value={formData.pin || ''} onChange={e => setFormData({ ...formData, pin: e.target.value })} placeholder="PIN / Invitación" /></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="email" placeholder="Correo Asignado" value={formData.correoExterno || ''} onChange={e => setFormData({ ...formData, correoExterno: e.target.value })} className={`col-span-2 md:col-span-1 border-2 ${isSoftware ? 'border-cyan-200' : 'border-indigo-100'} rounded-xl p-3 outline-none`} />
                    <input type="text" placeholder="Clave de Acceso" value={formData.claveExterna || ''} onChange={e => setFormData({ ...formData, claveExterna: e.target.value })} className={`col-span-2 md:col-span-1 border-2 ${isSoftware ? 'border-cyan-200' : 'border-indigo-100'} rounded-xl p-3 outline-none`} />
                    {!isSoftware && <><input type="text" placeholder="Perfil (Ej. P3)" value={formData.perfilExterno || ''} onChange={e => setFormData({ ...formData, perfilExterno: e.target.value })} className="border-2 border-indigo-100 rounded-xl p-3 outline-none" /><input type="text" placeholder="PIN / Invitación" value={formData.pin || ''} onChange={e => setFormData({ ...formData, pin: e.target.value })} className="border-2 border-indigo-100 rounded-xl p-3 font-bold outline-none" /></>}
                  </div>
                )}
              </div>
            )}

            {isAntivirus && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mt-4">
                {!isEdit && (
                  <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-purple-200 mb-4">
                    <button type="button" onClick={() => setOrigenKey('inventario')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${origenKey === 'inventario' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>Usar de Inventario</button>
                    <button type="button" onClick={() => { setOrigenKey('manual'); setFormData({ ...formData, proveedorKey: '' }); setIdLlaveSeleccionada(''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${origenKey === 'manual' ? 'bg-purple-500 text-white' : 'text-slate-500'}`}>Ingreso Manual</button>
                  </div>
                )}
                {origenKey === 'inventario' && !isEdit ? (
                  <div>
                    <select className="w-full border-2 border-emerald-300 rounded-xl p-3.5 font-mono font-bold text-emerald-900 bg-white outline-none" value={idLlaveSeleccionada} onChange={e => {
                      const selectedId = e.target.value; setIdLlaveSeleccionada(selectedId);
                      const keyObj = stockAV.find(k => k.id === selectedId);
                      if (keyObj) setFormData({ ...formData, proveedorKey: keyObj.llave });
                    }}>
                      <option value="">-- Elige una KEY disponible --</option>
                      {llavesDisponibles.map(k => <option key={k.id} value={k.id}>{k.llave}</option>)}
                    </select>
                  </div>
                ) : (
                  <input className="w-full border-2 border-purple-300 rounded-xl p-3.5 font-mono font-bold text-center uppercase bg-white focus:border-purple-600 outline-none" value={formData.proveedorKey || ''} onChange={e => setFormData({ ...formData, proveedorKey: e.target.value.toUpperCase() })} placeholder="XXXX-XXXX-XXXX-XXXX" />
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-slate-400" /> Duración</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Inicio *</label><input type="date" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-slate-50 outline-none" value={formData.fechaInicio} onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Añadir Tiempo</label><select className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-medium outline-none" onChange={e => { if (e.target.value) setFormData({ ...formData, fechaVencimiento: addMonthsToDate(formData.fechaInicio, e.target.value) }); }}><option value="">-- Meses --</option><option value="1">1 Mes</option><option value="3">3 Meses</option><option value="6">6 Meses</option><option value="12">12 Meses</option></select></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Vencimiento Exacto *</label><input type="date" className="w-full border-2 border-blue-200 rounded-xl p-3 font-bold text-blue-900 bg-blue-50 outline-none" value={formData.fechaVencimiento} onChange={e => setFormData({ ...formData, fechaVencimiento: e.target.value })} /></div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-white flex flex-col-reverse md:flex-row justify-end gap-3 rounded-b-3xl shrink-0">
          <button onClick={onClose} className="px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => onSave(formData, false, tipoCuenta, idLlaveSeleccionada)} disabled={syncStatus === 'sincronizando' || !formData.nombre} className="px-6 py-3.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50 transition-colors">Solo Guardar</button>
          <button onClick={() => onSave(formData, true, tipoCuenta, idLlaveSeleccionada)} disabled={syncStatus === 'sincronizando' || !formData.nombre || (isSoftware && plantillas.length === 0)} className={`px-6 py-3.5 ${isAntivirus ? 'bg-purple-600 hover:bg-purple-700' : isSoftware ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-xl font-bold shadow-lg disabled:opacity-50 transition-colors`}><MessageCircle className="w-5 h-5 inline mr-2" /> Guardar y Notificar</button>
        </div>
      </div>
    </div>
  );
};

const WaActionModal = ({ actionModal, onClose, onTrigger }) => {
  if (!actionModal) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center"><MessageCircle className="w-6 h-6 mr-2 text-green-500" /> Contactar a {actionModal.nombre.split(' ')[0]}</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          {actionModal.categoria === 'software' ? (
            <><button onClick={() => onTrigger(actionModal, 'ofrecer')} className="w-full p-4 bg-cyan-50 border-2 border-cyan-200 rounded-2xl flex items-center text-left hover:bg-cyan-100"><div className="bg-cyan-500 text-white p-2.5 rounded-xl mr-3"><Briefcase className="w-5 h-5" /></div><div className="font-bold text-cyan-900">Ofrecer / Prospectar 🚀</div></button><button onClick={() => onTrigger(actionModal, 'venta')} className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center text-left hover:bg-green-100"><div className="bg-green-500 text-white p-2.5 rounded-xl mr-3"><Plus className="w-5 h-5" /></div><div className="font-bold text-green-900">Entregar Accesos</div></button><button onClick={() => onTrigger(actionModal, 'alerta')} className="w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center text-left hover:bg-orange-100"><div className="bg-orange-500 text-white p-2.5 rounded-xl mr-3"><AlertTriangle className="w-5 h-5" /></div><div className="font-bold text-orange-900">Alerta Vencimiento</div></button></>
          ) : (
            <><button onClick={() => onTrigger(actionModal, 'venta')} className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center text-left hover:bg-green-100"><div className="bg-green-500 text-white p-2.5 rounded-xl mr-3"><Plus className="w-5 h-5" /></div><div className="font-bold text-green-900">Entregar Accesos</div></button>
              {actionModal.categoria === 'antivirus' && <button onClick={() => onTrigger(actionModal, 'regalo')} className="w-full p-4 bg-pink-50 border-2 border-pink-200 rounded-2xl flex items-center text-left hover:bg-pink-100"><div className="bg-pink-500 text-white p-2.5 rounded-xl mr-3"><Gift className="w-5 h-5" /></div><div className="font-bold text-pink-900">Enviar como Regalo 🎁</div></button>}
              <button onClick={() => onTrigger(actionModal, 'alerta')} className="w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center text-left hover:bg-orange-100"><div className="bg-orange-500 text-white p-2.5 rounded-xl mr-3"><AlertTriangle className="w-5 h-5" /></div><div className="font-bold text-orange-900">Alerta Vencimiento</div></button>
              <button onClick={() => onTrigger(actionModal, 'reenganche')} className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center text-left hover:bg-purple-100"><div className="bg-purple-500 text-white p-2.5 rounded-xl mr-3"><RefreshCw className="w-5 h-5" /></div><div className="font-bold text-purple-900">Reconectar (Ex-Cliente)</div></button></>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
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

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftClientTarget, setGiftClientTarget] = useState(null);
  const [isAsiduo, setIsAsiduo] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDataFromSheets = useCallback(async () => {
    setSyncStatus('sincronizando');
    try {
      const response = await fetch(`${SCRIPT_URL}?nocache=${new Date().getTime()}`);
      const data = await response.json();
      setClientes(data.clientes || []);
      setCuentasMaster(data.masters || []);
      setStockAV(data.stockAV || []);
      setPlantillas(data.plantillas || []);
      if (data.integrantes?.length > 0) setIntegrantes(data.integrantes);
      setSyncStatus('sincronizado');
    } catch (error) { setSyncStatus('error'); }
  }, []);

  const syncToSheets = async (accion, payload) => {
    setSyncStatus('sincronizando');
    try {
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ accion, datos: payload }) });
      const result = await response.json();
      if (result.exito) { setSyncStatus('sincronizado'); return true; }
      throw new Error(result.mensaje);
    } catch (error) { setSyncStatus('error'); showToast('Error de sincronización', 'error'); return false; }
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

  const urgentClients = useMemo(() => processedClients.filter(c => c.statusInfo.urgency > 0).sort((a, b) => a.daysRemaining - b.daysRemaining), [processedClients]);

  const stats = useMemo(() => ({
    streamingPropios: clientes.filter(c => c.categoria === 'streaming' && c.idMaster).length,
    streamingExternos: clientes.filter(c => c.categoria === 'streaming' && !c.idMaster).length,
    software: clientes.filter(c => c.categoria === 'software').length,
    alertasPropias: urgentClients.filter(c => c.categoria === 'streaming' && c.idMaster && c.daysRemaining >= 0).length,
    llavesDisponibles: stockAV.filter(k => k.estado === 'Disponible').length
  }), [clientes, urgentClients, stockAV]);

  const triggerWhatsAppAlert = (client, type, tipoCuenta) => {
    let msg = `¡Hola ${client.nombre}! 👋\nTe escribimos de *${parametros.nombreNegocio}*.\n\n`;
    const isMaster = !!client.idMaster;
    const fechaVencimiento = formatDateToLocal(client.fechaVencimiento);
    const configSoft = plantillas.find(p => String(p.nombre).toLowerCase() === String(client.servicio).toLowerCase());

    if (type === 'ofrecer') {
      let opciones = configSoft?.ofrecer || [`Tenemos licencias de *${client.servicio}* para optimizar tu trabajo.`];
      if (typeof opciones === 'string') opciones = JSON.parse(opciones);
      msg = opciones[Math.floor(Math.random() * opciones.length)].replace(/{nombre}/gi, client.nombre);
    } else if (type === 'venta') {
      msg += `Tu cuenta de *${client.servicio}* ha sido activada con éxito.\n\n`;
      if (client.categoria === 'software' && configSoft) msg += `${configSoft.beneficios || ''}\n\n`;
      msg += `*TUS CREDENCIALES:*\n`;
      if (client.categoria === 'antivirus') msg += `🛡️ Key: *${client.proveedorKey}*\n`;
      else if (client.categoria === 'software' || (!isMaster && client.correoExterno)) msg += `👤 Correo: ${client.correoExterno}\n🔑 Clave: ${client.claveExterna}\n`;
      else if (isMaster || tipoCuenta === 'master') msg += `📺 Perfil: P${client.perfil}\n🔐 PIN: ${client.pin}\n`;
      msg += `\n📅 Vencimiento: ${fechaVencimiento}\n\n¡Gracias por tu confianza! 💙`;
    } else if (type === 'alerta') {
      msg += `Pasábamos a recordarte que tu servicio de *${client.servicio}* culmina el *${fechaVencimiento}*.\nSi deseas renovar para que no haya interrupciones, confírmanos por aquí. 😊`;
    } else if (type === 'reenganche') {
      msg += `Hace un tiempo disfrutaste de nuestros servicios. Si deseas volver a activar tu cuenta de *${client.servicio}*, ¡avísanos! Estaremos felices de atenderte. 🚀`;
    } else if (type === 'regalo') {
      msg += `¡Queremos agradecerte por tu constante preferencia! 🎉 Te hemos obsequiado una licencia de *${client.servicio}* totalmente gratis.\n\n📅 Válida hasta: ${fechaVencimiento}\n\n¡Disfruta y gracias por confiar en nosotros! 🎁`;
    }

    window.open(`https://wa.me/${parametros.codigoPais}${client.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
    setWaActionModal(null);
  };

  const handleSaveClient = async (clientData, sendWhatsApp = false, tipoCuenta = 'master', idLlaveUsada = null) => {
    const isNew = !clientData.id;
    const finalClient = { ...clientData, id: isNew ? `C_${Date.now()}` : clientData.id };
    setClientes(prev => isNew ? [finalClient, ...prev] : prev.map(c => c.id === finalClient.id ? finalClient : c));
    setIsClientModalOpen(false); showToast(isNew ? 'Registro guardado' : 'Registro actualizado');

    if (idLlaveUsada) {
      const llave = stockAV.find(k => k.id === idLlaveUsada);
      if (llave) {
        const updatedLlave = { ...llave, estado: 'Usada', idCliente: finalClient.id };
        setStockAV(prev => prev.map(k => k.id === idLlaveUsada ? updatedLlave : k));
        await syncToSheets('guardarLlave', updatedLlave);
      }
    }
    await syncToSheets('guardarCliente', finalClient);
    if (sendWhatsApp) triggerWhatsAppAlert(finalClient, 'venta', tipoCuenta);
  };

  const handleGiveGift = async (client, selectedKeyId, asiduo) => {
    const key = stockAV.find(k => k.id === selectedKeyId);
    if (!key) return showToast('Licencia no encontrada', 'error');

    setIsGiftModalOpen(false);
    const fechaInicio = getToday().toISOString().split('T')[0];
    const fechaVencimiento = addMonthsToDate(fechaInicio, 1);

    const newClient = {
      id: `C_GIFT_${Date.now()}`, nombre: client.nombre, telefono: client.telefono,
      servicio: 'ESET Mobile (Regalo)', categoria: 'antivirus', fechaInicio, fechaVencimiento,
      proveedorKey: key.llave, detallesLicencia: 'Regalo Fidelización',
      idIntegrante: integrantes[0]?.id || '', idMaster: '', perfil: '', pin: '', correoExterno: '', claveExterna: '', perfilExterno: ''
    };
    const updatedKey = { ...key, estado: 'Usada', idCliente: newClient.id };

    setClientes(prev => [newClient, ...prev]);
    setStockAV(prev => prev.map(k => k.id === selectedKeyId ? updatedKey : k));

    await syncToSheets('guardarCliente', newClient);
    await syncToSheets('guardarLlave', updatedKey);
    showToast('Regalo registrado');

    let msg = `¡Hola ${client.nombre}! 👋 Te escribimos de *${parametros.nombreNegocio}*.\n\n`;
    msg += `¡Queremos agradecerte por tu constante preferencia! 🎉\n`;
    msg += `Como muestra de nuestro aprecio, te hemos obsequiado una licencia de *ESET Mobile Security Premium* por 1 mes, totalmente GRATIS. 🎁📱 *(¡Exclusiva para proteger tu celular!)*\n\n`;
    msg += `*TU LICENCIA DE REGALO:*\n`;
    msg += `🛡️ Clave de Activación: *${key.llave}*\n`;
    msg += `📅 Válida hasta: ${formatDateToLocal(fechaVencimiento)}\n\n`;
    msg += `*GUÍA DE INSTALACIÓN:*\n`;
    msg += `1️⃣ Entra a la tienda de aplicaciones de tu celular (Play Store / App Store) y descarga *ESET Mobile Security*.\n`;
    msg += `2️⃣ Abre la app, omite los pasos iniciales y busca la opción de 'Suscripción' o 'Ingresar clave de licencia'.\n`;
    msg += `3️⃣ Pega tu clave de activación y ¡listo!\n`;
    if (asiduo) msg += `\n💡 *Como eres cliente asiduo, ¡recuerda reclamar tu clave cada mes!*\n`;
    
    window.open(`https://wa.me/${parametros.codigoPais}${client.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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

  return (
    <>
      <style>{`.animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} activeTab={activeTab} setActiveTab={setActiveTab} parametros={parametros} />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="bg-white shadow-sm border-b px-4 md:px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-3 text-slate-500 hover:bg-slate-100 p-1 rounded-md"><Menu className="w-6 h-6" /></button>
              <div className="font-bold text-slate-800 uppercase text-sm truncate tracking-widest hidden sm:block">Plataforma Operativa KGB</div>
            </div>
            <SyncIndicator syncStatus={syncStatus} />
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'dashboard' && <Dashboard stats={stats} urgentClients={urgentClients} setWaActionModal={setWaActionModal} />}
              {activeTab === 'campanas' && <CampanasList processedClients={processedClients} setGiftClientTarget={setGiftClientTarget} setIsAsiduo={setIsAsiduo} setIsGiftModalOpen={setIsGiftModalOpen} />}
              {activeTab === 'streaming' && <StreamingList processedClients={processedClients} cuentasMaster={cuentasMaster} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'software' && <SoftwareList processedClients={processedClients} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'antivirus' && <AntivirusList processedClients={processedClients} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'masters' && <MasterAccountsList cuentasMaster={cuentasMaster} setCuentasMaster={setCuentasMaster} clientes={clientes} syncToSheets={syncToSheets} showToast={showToast} syncStatus={syncStatus} />}
              {activeTab === 'stock_av' && <StockAntivirusList stockAV={stockAV} setStockAV={setStockAV} syncToSheets={syncToSheets} showToast={showToast} setConfirmAction={setConfirmAction} syncStatus={syncStatus} />}
              {activeTab === 'configuracion' && <Configuracion plantillas={plantillas} setPlantillas={setPlantillas} showToast={showToast} syncToSheets={syncToSheets} syncStatus={syncStatus} />}
            </div>
          </main>
        </div>

        {/* Modales Inyectados Condicionalmente */}
        <ClientFormModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} editingClient={editingClient} initialCategory={initialCategory} integrantes={integrantes} clientes={clientes} cuentasMaster={cuentasMaster} stockAV={stockAV} plantillas={plantillas} syncStatus={syncStatus} onSave={handleSaveClient} />
        <WaActionModal actionModal={waActionModal} onClose={() => setWaActionModal(null)} onTrigger={triggerWhatsAppAlert} />

        {isGiftModalOpen && giftClientTarget && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-fadeIn">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black flex items-center"><Gift className="w-6 h-6 mr-2 text-pink-500" /> Regalar ESET</h3><button onClick={() => setIsGiftModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button></div>
              <p className="text-sm text-pink-800 font-medium bg-pink-50 p-4 rounded-xl mb-4">Vas a obsequiar 1 Mes de ESET a <strong className="font-black">{giftClientTarget.nombre}</strong>.</p>
              <select className="w-full border-2 rounded-xl p-3 font-medium bg-slate-50 mb-4" id="giftSelectKey">
                {stockAV.filter(k => k.estado === 'Disponible').map(k => <option key={k.id} value={k.id}>{k.llave} ({k.producto})</option>)}
              </select>
              <div className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 mb-4" onClick={() => setIsAsiduo(!isAsiduo)}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center mr-3 ${isAsiduo ? 'bg-pink-500' : 'bg-slate-200'}`}>{isAsiduo && <Check className="w-4 h-4 text-white" />}</div>
                <div className="font-bold text-slate-700 flex items-center">Es cliente asiduo <Star className="w-4 h-4 ml-1 text-yellow-500 fill-yellow-500" /></div>
              </div>
              <button onClick={() => {
                const select = document.getElementById('giftSelectKey');
                if (select.value) handleGiveGift(giftClientTarget, select.value, isAsiduo);
              }} className="w-full py-3.5 bg-pink-600 text-white rounded-xl font-bold shadow-lg hover:bg-pink-700"><MessageCircle className="w-5 h-5 inline mr-2" /> Enviar Regalo</button>
            </div>
          </div>
        )}

        {confirmAction && (
          <div className="fixed inset-0 bg-slate-900/70 z-[300] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center animate-fadeIn">
              <h3 className="text-xl font-bold text-slate-800 mb-2">¿Estás seguro?</h3><p className="text-slate-600 mb-6">{confirmAction.message}</p>
              <div className="flex justify-center space-x-3"><button onClick={() => setConfirmAction(null)} className="px-5 py-2.5 bg-slate-100 rounded-xl font-bold hover:bg-slate-200">Cancelar</button><button onClick={confirmAction.onConfirm} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700">Sí, proceder</button></div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[400] animate-fadeIn">
            <div className={`px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-800'} text-white`}><Check className="w-5 h-5 mr-2 text-green-400" />{toast.message}</div>
          </div>
        )}
      </div>
    </>
  );
}