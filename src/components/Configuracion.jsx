import React, { useState } from 'react';
import { Settings, Plus, Save, Trash2, Check } from 'lucide-react';

export default function Configuracion({ plantillas, setPlantillas, showToast, syncToSheets, syncStatus }) {
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);

  const handleAdd = () => {
    const newTemplate = {
      id: `PL_${Date.now()}`,
      nombre: 'Nuevo Software',
      beneficios: '🚀 *BENEFICIOS INCLUIDOS:*\n✅ Licencia oficial completa',
      ofrecer: ['¡Hola {nombre}! Te escribimos para ofrecerte...']
    };
    setEditingId(newTemplate.id);
    setFormData(newTemplate);
  };

  const handleSave = async () => {
    // Actualiza la pantalla rápido
    const isNew = !plantillas.some(p => p.id === formData.id);
    if (isNew) setPlantillas(prev => [...prev, formData]);
    else setPlantillas(prev => prev.map(p => p.id === formData.id ? formData : p));
    
    setEditingId(null);
    showToast('Enviando a Google Sheets...');
    
    // 🔴 ESTA ES LA LÍNEA QUE FALTABA: Envía los datos a tu API
    await syncToSheets('guardarPlantilla', formData);
  };

  const handleDelete = async (id) => {
    setPlantillas(prev => prev.filter(p => p.id !== id));
    setEditingId(null);
    showToast('Borrando de Google Sheets...');
    
    // 🔴 Envía la orden de borrar a tu API
    await syncToSheets('eliminarPlantilla', { id });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><Settings className="w-8 h-8 mr-3 text-slate-600"/> Plantillas y Productos</h1><p className="text-slate-500 mt-1">Agrega nuevos programas de software y personaliza sus mensajes automáticos.</p></div>

      <div className="flex justify-end">
        <button onClick={handleAdd} disabled={syncStatus === 'sincronizando'} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-md disabled:opacity-50"><Plus className="w-5 h-5 mr-2" /> Nuevo Producto</button>
      </div>

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
                    <textarea rows="3" className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:border-slate-500 text-sm pr-10" value={msg} onChange={e => {
                      const newOfrecer = [...formData.ofrecer];
                      newOfrecer[index] = e.target.value;
                      setFormData({...formData, ofrecer: newOfrecer});
                    }} />
                    {formData.ofrecer.length > 1 && (
                      <button onClick={() => {
                        const newOfrecer = formData.ofrecer.filter((_, i) => i !== index);
                        setFormData({...formData, ofrecer: newOfrecer});
                      }} className="absolute top-3 right-3 p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><Trash2 className="w-4 h-4"/></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button disabled={syncStatus === 'sincronizando'} onClick={() => handleDelete(formData.id)} className="px-4 py-2.5 text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center disabled:opacity-50"><Trash2 className="w-4 h-4 mr-2"/> Eliminar Producto</button>
              <button disabled={syncStatus === 'sincronizando'} onClick={handleSave} className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 flex items-center disabled:opacity-50"><Save className="w-4 h-4 mr-2"/> Guardar Cambios</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}