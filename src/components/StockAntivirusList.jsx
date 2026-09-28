import React, { useState } from 'react';
import { Key, Plus, Check, Trash2 } from 'lucide-react';
import { getToday } from '../utils/helpers';

export default function StockAntivirusList({ stockAV, setStockAV, syncToSheets, showToast, setConfirmAction, syncStatus }) {
  const [newProduct, setNewProduct] = useState('ESET NOD32 Premium');
  const [keysRaw, setKeysRaw] = useState('');

  const handleAddKeys = async (e) => {
    e.preventDefault();
    const lines = keysRaw.split('\n').map(l => l.trim()).filter(l => l);
    if(lines.length === 0) return;

    const newKeys = lines.map(line => ({
      id: `K_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
      producto: newProduct,
      llave: line,
      estado: 'Disponible',
      fechaAgregado: getToday().toISOString().split('T')[0],
      idCliente: ''
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
      <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><Key className="w-8 h-8 mr-3 text-emerald-600"/> Inventario de Licencias</h1><p className="text-slate-500 mt-1">Sube tus bloques de 30 días o licencias anuales. El sistema las tomará al vender.</p></div>
      
      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm">
        <h3 className="font-bold text-emerald-800 text-lg mb-4 flex items-center"><Plus className="w-5 h-5 mr-2" /> Agregar Llaves en Masa</h3>
        <form onSubmit={handleAddKeys} className="space-y-4">
           <div>
              <label className="block text-xs font-bold text-emerald-700 mb-1">Producto</label>
              <select className="w-full border-2 border-emerald-200 rounded-xl p-3 focus:border-emerald-500 font-bold bg-white" value={newProduct} onChange={e=>setNewProduct(e.target.value)}>
                 <option value="ESET NOD32 Premium">ESET NOD32 Premium (30 Días)</option>
                 <option value="ESET Internet Security">ESET Internet Security</option>
                 <option value="Kaspersky Plus">Kaspersky Plus</option>
                 <option value="McAfee Total Protection">McAfee Total Protection</option>
              </select>
           </div>
           <div>
              <label className="block text-xs font-bold text-emerald-700 mb-1">Pega aquí tus Licencias (Una por línea)</label>
              <textarea required rows="4" className="w-full border-2 border-emerald-200 rounded-xl p-3 font-mono text-sm bg-white focus:border-emerald-500 uppercase" placeholder="AAAA-BBBB-CCCC-DDDD&#10;XXXX-YYYY-ZZZZ-WWWW" value={keysRaw} onChange={e=>setKeysRaw(e.target.value)}></textarea>
           </div>
           <button type="submit" disabled={syncStatus === 'sincronizando' || !keysRaw.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl p-3 shadow-md flex justify-center items-center transition-colors disabled:opacity-50"><Check className="w-5 h-5 mr-2"/> Guardar Licencias en Bóveda</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 flex justify-between"><span>Licencias Registradas</span> <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs">{stockAV.filter(k=>k.estado==='Disponible').length} Disponibles</span></div>
        <table className="w-full text-left whitespace-nowrap">
          <thead className="text-xs text-slate-500 uppercase bg-white border-b">
            <tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4">Key de Activación</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Borrar</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stockAV.map(k => (
              <tr key={k.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">{k.producto}</td>
                <td className="px-6 py-4 font-mono font-bold text-sm text-slate-600">{k.llave}</td>
                <td className="px-6 py-4">
                  {k.estado === 'Disponible' ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-black uppercase">Libre</span> : <span className="bg-slate-200 text-slate-500 px-2 py-1 rounded-md text-[10px] font-black uppercase">Usada {k.idCliente && '(Asignada)'}</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDeleteKey(k.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {stockAV.length === 0 && <tr><td colSpan="4" className="text-center py-10 text-slate-500">No hay llaves en el inventario.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}