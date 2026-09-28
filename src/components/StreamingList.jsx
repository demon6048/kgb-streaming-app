import React, { useState } from 'react';
import { MonitorPlay, Plus, Search, Server, Cloud, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { formatDateToLocal } from '../utils/helpers';

export default function StreamingList({ processedClients, cuentasMaster, setWaActionModal, setEditingClient, setInitialCategory, setIsClientModalOpen, handleDeleteClient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const streamingClients = processedClients.filter(c => c.categoria === 'streaming');
  const filteredClients = streamingClients.filter(c => (c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono?.includes(searchTerm))).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center"><MonitorPlay className="w-8 h-8 mr-3 text-blue-600"/> Cuentas Streaming</h1>
        <button onClick={() => { setInitialCategory('streaming'); setEditingClient(null); setIsClientModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-md w-full md:w-auto justify-center"><Plus className="w-5 h-5 mr-2" /> Vender Perfil</button>
      </div>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative"><Search className="w-5 h-5 absolute left-9 top-8 text-slate-400" /><input type="text" placeholder="Buscar cliente o número..." className="w-full pl-12 pr-4 py-2.5 border rounded-xl bg-slate-50 focus:border-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Servicio / Cuenta</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-bold text-slate-900">{client.nombre}</div><div className="text-sm text-slate-500">+{client.telefono}</div></td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 flex items-center">
                      {client.servicio} 
                      {client.perfil && client.idMaster && <span className="ml-2 bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full">P{client.perfil}</span>}
                      {client.perfilExterno && !client.idMaster && <span className="ml-2 bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full">{client.perfilExterno}</span>}
                    </div>
                    {client.idMaster ? <div className="text-xs text-slate-500 mt-1 font-mono flex items-center"><Server className="w-3 h-3 mr-1 text-slate-400"/> {cuentasMaster.find(m => m.id === client.idMaster)?.correo || 'Master eliminada'}</div> : client.correoExterno ? <div className="text-xs text-orange-600 mt-1 font-mono flex items-center"><Cloud className="w-3 h-3 mr-1"/> {client.correoExterno} (Ext)</div> : null}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{formatDateToLocal(client.fechaVencimiento)}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg" title="WhatsApp"><MessageCircle className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingClient(client); setInitialCategory('streaming'); setIsClientModalOpen(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg" title="Editar"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-100 text-red-700 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}