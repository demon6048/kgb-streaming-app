import React, { useState } from 'react';
import { Briefcase, Plus, Search, MessageCircle, Edit, Trash2, Cloud, Server } from 'lucide-react';
import { formatDateToLocal } from '../utils/helpers';

export default function SoftwareList({ processedClients, cuentasMaster, setWaActionModal, setEditingClient, setInitialCategory, setIsClientModalOpen, handleDeleteClient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const softwareClients = processedClients.filter(c => c.categoria === 'software');
  const filteredClients = softwareClients.filter(c => (c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono?.includes(searchTerm))).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center"><Briefcase className="w-8 h-8 mr-3 text-cyan-600"/> Software Profesional</h1>
        <button onClick={() => { setInitialCategory('software'); setEditingClient(null); setIsClientModalOpen(true); }} className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-md w-full md:w-auto justify-center"><Plus className="w-5 h-5 mr-2" /> Vender Licencia</button>
      </div>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative"><Search className="w-5 h-5 absolute left-9 top-8 text-slate-400" /><input type="text" placeholder="Buscar profesional o software..." className="w-full pl-12 pr-4 py-2.5 border rounded-xl bg-slate-50 focus:border-cyan-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr><th className="px-6 py-4">Profesional</th><th className="px-6 py-4">Software / Credencial</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-bold text-slate-900">{client.nombre}</div><div className="text-sm text-slate-500">+{client.telefono}</div></td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 flex items-center">{client.servicio}</div>
                    {client.correoExterno ? <div className="text-xs text-cyan-600 mt-1 font-mono flex items-center"><Cloud className="w-3 h-3 mr-1"/> {client.correoExterno}</div> : <div className="text-xs text-slate-500 mt-1 font-mono">Licencia Asignada</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{formatDateToLocal(client.fechaVencimiento)}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.statusInfo.color}`}>{client.statusInfo.text}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setWaActionModal(client)} className="p-2 bg-green-100 text-green-700 rounded-lg" title="WhatsApp"><MessageCircle className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingClient(client); setInitialCategory('software'); setIsClientModalOpen(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg" title="Editar"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-100 text-red-700 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-slate-500">No hay software profesional registrado aún.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}