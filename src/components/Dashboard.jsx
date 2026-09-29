import React, { useState } from 'react';
import { Server, Cloud, ShieldCheck, Key, AlertTriangle, RefreshCw, MessageCircle, Briefcase } from 'lucide-react';
import { formatDateToLocal } from '../utils/helpers';

export default function Dashboard({ stats, urgentClients, setWaActionModal }) {
  const [filtroAlertas, setFiltroAlertas] = useState('todas');
  
  const alertasFiltradas = urgentClients.filter(c => {
    if (filtroAlertas === 'propias') return c.categoria === 'streaming' && c.idMaster && c.daysRemaining >= 0;
    if (filtroAlertas === 'externas') return c.categoria === 'streaming' && !c.idMaster && c.daysRemaining >= 0;
    if (filtroAlertas === 'antivirus') return c.categoria === 'antivirus';
    if (filtroAlertas === 'software') return c.categoria === 'software';
    if (filtroAlertas === 'inactivos') return c.daysRemaining < 0; 
    return true;
  });

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`p-4 rounded-2xl border ${color} flex items-center justify-between shadow-sm bg-white`}>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">{title}</div>
        <div className="text-2xl font-black">{value}</div>
      </div>
      {Icon && <Icon className="w-8 h-8 opacity-50" />}
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div><h1 className="text-3xl font-bold text-slate-800">Panel de Control</h1><p className="text-slate-500 mt-1">Resumen general y alertas operativas sincronizadas.</p></div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard title="Strm. Propias" value={stats.streamingPropios} icon={Server} color="text-blue-700 border-blue-200" />
        <StatCard title="Strm. Externas" value={stats.streamingExternos} icon={Cloud} color="text-indigo-700 border-indigo-200" />
        <StatCard title="Software Prof." value={stats.software} icon={Briefcase} color="text-cyan-700 border-cyan-200" />
        <StatCard title="Antivirus" value={stats.antivirus} icon={ShieldCheck} color="text-purple-700 border-purple-200" />
        <StatCard title="Stock Llaves" value={stats.llavesDisponibles} icon={Key} color="text-emerald-700 border-emerald-200" />
        <StatCard title="Alertas" value={stats.alertasPropias} icon={AlertTriangle} color="text-orange-700 border-orange-200" />
        <StatCard title="Inactivos" value={stats.inactivos} icon={RefreshCw} color="text-slate-600 border-slate-300 bg-slate-50" />
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-orange-500"/> Alertas de Vencimientos</h2>
          <div className="flex space-x-2 flex-wrap gap-y-2">
            <button onClick={() => setFiltroAlertas('todas')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'todas' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'}`}>Todas</button>
            <button onClick={() => setFiltroAlertas('propias')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'propias' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>Propias</button>
            <button onClick={() => setFiltroAlertas('externas')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'externas' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}>Externas</button>
            <button onClick={() => setFiltroAlertas('software')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'software' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700'}`}>Software</button>
            <button onClick={() => setFiltroAlertas('antivirus')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtroAlertas === 'antivirus' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}>Antivirus</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b">
              <tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Origen / Servicio</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alertasFiltradas.map(client => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-bold text-slate-900">{client.nombre}</div><div className="text-sm text-slate-500">+{client.telefono}</div></td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{client.servicio}</div>
                    {client.categoria === 'antivirus' ? <div className="text-xs text-purple-600 mt-1 font-bold flex items-center"><ShieldCheck className="w-3 h-3 mr-1"/> Antivirus</div> : client.categoria === 'software' ? <div className="text-xs text-cyan-600 mt-1 font-bold flex items-center"><Briefcase className="w-3 h-3 mr-1"/> Profesional</div> : client.idMaster ? <div className="text-xs text-blue-600 mt-1 font-bold flex items-center"><Server className="w-3 h-3 mr-1"/> Máster Propia</div> : <div className="text-xs text-indigo-600 mt-1 font-bold flex items-center"><Cloud className="w-3 h-3 mr-1"/> Proveedor Externo</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{formatDateToLocal(client.fechaVencimiento)}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><MessageCircle className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {alertasFiltradas.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-slate-500 font-medium">No hay registros para esta categoría.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}