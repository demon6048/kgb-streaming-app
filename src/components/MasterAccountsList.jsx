import React, { useState } from 'react';
import { Server, Edit, Trash2, X } from 'lucide-react';
import { getToday } from '../utils/helpers';

export default function MasterAccountsList({ cuentasMaster, setCuentasMaster, clientes, syncToSheets, showToast, syncStatus }) {
  const [newMaster, setNewMaster] = useState({ id: null, correo: '', clave: '', plataforma: 'Netflix', limitePerfiles: 5, fechaRenovacion: getToday().toISOString().split('T')[0] });
  const [isCustomPlatform, setIsCustomPlatform] = useState(false);
  
  const plataformasSugeridas = Array.from(new Set(['Netflix', 'Disney+', 'Max', 'Gemini Pro', 'Amazon Prime', 'Spotify', 'Crunchyroll', 'YouTube Premium', 'Paramount+', ...cuentasMaster.map(m => m.plataforma)])).filter(Boolean).sort();
  
  const handleAdd = async (e) => {
    e.preventDefault();
    const finalPlat = newMaster.plataforma;
    const isEditing = !!newMaster.id;
    const newId = isEditing ? newMaster.id : `M_${Date.now()}`;
    const newMasterObj = { ...newMaster, plataforma: finalPlat, id: newId };
    
    if (isEditing) setCuentasMaster(prev => prev.map(m => m.id === newId ? newMasterObj : m));
    else setCuentasMaster(prev => [...prev, newMasterObj]); 
    
    setNewMaster({ id: null, correo: '', clave: '', plataforma: 'Netflix', limitePerfiles: 5, fechaRenovacion: getToday().toISOString().split('T')[0] });
    setIsCustomPlatform(false);
    showToast(isEditing ? 'Cuenta Máster Actualizada' : 'Cuenta Máster Agregada');
    await syncToSheets('guardarMaster', newMasterObj);
  };

  const handleEdit = (master) => {
    setNewMaster(master); setIsCustomPlatform(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    setCuentasMaster(prev => prev.filter(m => m.id !== id));
    showToast('Cuenta Máster Eliminada'); await syncToSheets('eliminarMaster', { id });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><Server className="w-8 h-8 mr-3 text-orange-600"/> Cuentas Máster</h1></div>
      
      <div className={`p-6 rounded-2xl shadow-sm border ${newMaster.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
        <h3 className={`font-bold text-lg mb-4 flex items-center ${newMaster.id ? 'text-blue-800' : 'text-slate-800'}`}>{newMaster.id ? <><Edit className="w-5 h-5 mr-2" /> Editar Cuenta Máster</> : 'Agregar Nueva Máster'}</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1">Plataforma</label>
            {!isCustomPlatform ? (
              <select required className="w-full border-2 rounded-xl p-3 focus:border-orange-500 font-bold bg-white" value={newMaster.plataforma} onChange={e => {
                  if (e.target.value === 'OTRA_NUEVA') { setIsCustomPlatform(true); setNewMaster({...newMaster, plataforma: ''}); } 
                  else setNewMaster({...newMaster, plataforma: e.target.value});
                }}>
                <option value="" disabled>-- Selecciona --</option>
                {plataformasSugeridas.map(plat => (<option key={plat} value={plat}>{plat}</option>))}
                <option value="OTRA_NUEVA">➕ Añadir otra nueva...</option>
              </select>
            ) : (
              <div className="flex animate-fadeIn">
                <input required type="text" autoFocus placeholder="Escribe el nombre..." className="w-full border-2 border-r-0 rounded-l-xl p-3 focus:border-orange-500 font-bold" value={newMaster.plataforma} onChange={e => setNewMaster({...newMaster, plataforma: e.target.value})} />
                <button type="button" onClick={() => { setIsCustomPlatform(false); setNewMaster({...newMaster, plataforma: 'Netflix'}); }} className="bg-slate-100 border-2 border-l-0 px-3 rounded-r-xl hover:bg-slate-200"><X className="w-5 h-5"/></button>
              </div>
            )}
          </div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Correo Electrónico</label><input required type="email" placeholder="ejemplo@correo.com" className="w-full border-2 rounded-xl p-3 focus:border-orange-500" value={newMaster.correo} onChange={e=>setNewMaster({...newMaster, correo: e.target.value})} /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Clave</label><input required type="text" placeholder="Contraseña" className="w-full border-2 rounded-xl p-3 focus:border-orange-500" value={newMaster.clave} onChange={e=>setNewMaster({...newMaster, clave: e.target.value})} /></div>
          <div className="flex space-x-2 md:col-span-2">
            <div className="w-1/3"><label className="block text-xs font-bold text-slate-500 mb-1">Perfiles</label><input required type="number" min="1" className="w-full border-2 rounded-xl p-3 text-center font-bold focus:border-orange-500" value={newMaster.limitePerfiles} onChange={e=>setNewMaster({...newMaster, limitePerfiles: e.target.value})} /></div>
            <div className="w-2/3"><label className="block text-xs font-bold text-slate-500 mb-1">Renovación</label><input required type="date" className="w-full border-2 rounded-xl p-3 text-sm font-bold focus:border-orange-500" value={newMaster.fechaRenovacion} onChange={e=>setNewMaster({...newMaster, fechaRenovacion: e.target.value})} /></div>
          </div>
          <div className="md:col-span-7 flex flex-col-reverse md:flex-row gap-3 mt-2">
            {newMaster.id && <button type="button" onClick={() => setNewMaster({ id: null, correo: '', clave: '', plataforma: 'Netflix', limitePerfiles: 5, fechaRenovacion: getToday().toISOString().split('T')[0] })} className="w-full md:w-1/3 bg-slate-200 text-slate-700 font-bold rounded-xl p-3 hover:bg-slate-300">Cancelar Edición</button>}
            <button type="submit" disabled={syncStatus === 'sincronizando'} className={`w-full ${newMaster.id ? 'md:w-2/3 bg-blue-600' : 'bg-orange-600'} text-white font-bold rounded-xl p-3 shadow-lg hover:opacity-90`}>{newMaster.id ? 'Guardar Cambios' : 'Guardar Máster'}</button>
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
              {isFull && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">LLENA</div>}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-orange-700">{master.plataforma}</div>
                  <div className="font-mono text-sm font-semibold mt-1">{master.correo}</div>
                  <div className="font-mono text-xs text-slate-500">Clave: {master.clave}</div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleEdit(master)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-lg"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(master.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2"><span>Perfiles Ocupados</span><span>{ocupados} / {limit}</span></div>
                <div className="w-full bg-slate-200 rounded-full h-2.5"><div className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${(ocupados/limit)*100}%`}}></div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}