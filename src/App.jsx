import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MonitorPlay, X, Server, RefreshCw, AlertTriangle, Cloud, MessageCircle, ShieldCheck, Plus, Search, Smartphone, Check, Calendar, Key, Gift, Menu, Briefcase, Settings } from 'lucide-react';
import { getToday, formatDateToLocal, getDaysRemaining, addMonthsToDate } from './utils/helpers';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StreamingList from './components/StreamingList';
import SoftwareList from './components/SoftwareList';
import AntivirusList from './components/AntivirusList';
import StockAntivirusList from './components/StockAntivirusList';
import MasterAccountsList from './components/MasterAccountsList';
import Configuracion from './components/Configuracion';
import './index.css';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxs1iZ4q0mljgda3fRGivWgkgAsO0WrRQxBZjyj-QpEmo4vXIy6C2QoOU7ClZ3Tnras/exec"; 
const parametros = { nombreNegocio: 'KGB Streaming', codigoPais: '51', diasAlerta: 5 };

// Plantillas por defecto para la primera vez
const plantillasDefault = [
  {
    id: 'gemini', nombre: 'Gemini Pro',
    beneficios: '✨ *BENEFICIOS ACTIVOS:*\n✅ Gemini Pro y Flow\n✅ YouTube Premium Lite\n✅ NotebookLM\n✅ 5 TB de almacenamiento',
    ofrecer: ['¡Hola {nombre}! Te escribimos de KGB Streaming.\n\nPotencia tu productividad con *Gemini Pro*.\n\n✨ Incluye:\n- Gemini Advanced y Flow\n- 5 TB de nube\n- NotebookLM\n\n¡Avísanos si deseas adquirirlo! 🚀', '¿Buscas potenciar tu trabajo {nombre}? *Gemini Pro* es la solución.\n\nTe ofrecemos el paquete completo con Flow, YouTube Lite y más. ¡Escríbenos para detalles! 💼']
  },
  {
    id: 'chatgpt', nombre: 'ChatGPT Plus',
    beneficios: '✨ *BENEFICIOS ACTIVOS:*\n✅ GPT-4o\n✅ DALL-E 3\n✅ Análisis de datos avanzado',
    ofrecer: ['¡Hola {nombre}! 🌟\n\nOptimiza tu tiempo con *ChatGPT Plus*. Respuestas avanzadas, DALL-E 3 y más.\n\nSi deseas potenciar tu flujo de trabajo, avísanos y te activamos una cuenta al instante. 💼']
  },
  {
    id: 'autodesk', nombre: 'Autodesk (Completo)',
    beneficios: '📐 *BENEFICIOS ACTIVOS:*\n✅ Todos los programas incluidos (AutoCAD, Revit, Civil 3D, Maya, etc.)\n✅ Licencia Completa',
    ofrecer: ['¡Hola {nombre}! 👋\n\nTenemos la solución ideal para tus ingenierías: Licencias de *Autodesk*. Todo incluido (AutoCAD, Revit, Civil 3D).\n\n¿Te gustaría un presupuesto? 🏗️']
  }
];

export default function App() {
  const [clientes, setClientes] = useState([]);
  const [cuentasMaster, setCuentasMaster] = useState([]);
  const [stockAV, setStockAV] = useState([]);
  const [integrantes, setIntegrantes] = useState([{ id: 'int1', nombre: 'Equipo Principal', telefono: '51999999999' }]);
  
  // ESTADO NUEVO: PLANTILLAS
  const [plantillas, setPlantillas] = useState(() => {
    const saved = localStorage.getItem('kgb_plantillas');
    return saved ? JSON.parse(saved) : plantillasDefault;
  });

  useEffect(() => {
    localStorage.setItem('kgb_plantillas', JSON.stringify(plantillas));
  }, [plantillas]);
  
  const [syncStatus, setSyncStatus] = useState('conectando'); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [initialCategory, setInitialCategory] = useState('streaming');
  const [waActionModal, setWaActionModal] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDataFromSheets = useCallback(async () => {
    if (!SCRIPT_URL || SCRIPT_URL === "TU_URL_DE_APPS_SCRIPT_AQUI") {
      setSyncStatus('error'); return;
    }
    setSyncStatus('sincronizando');
    try {
      const response = await fetch(SCRIPT_URL);
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setClientes(data.clientes || []);
        setCuentasMaster(data.masters || []);
        setStockAV(data.stockAV || []);
        if(data.integrantes && data.integrantes.length > 0) setIntegrantes(data.integrantes);
        setSyncStatus('sincronizado');
      } catch (parseError) { throw new Error('Error de Google'); }
    } catch (error) { setSyncStatus('error'); }
  }, []);

  const syncToSheets = async (accion, payload) => {
    setSyncStatus('sincronizando');
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion, datos: payload })
      });
      const result = await response.json();
      if(result.exito) { setSyncStatus('sincronizado'); return true; }
      else throw new Error(result.mensaje || 'Error desconocido');
    } catch (error) {
      setSyncStatus('error'); showToast(`Error al guardar: ${error.message}`, 'error'); return false;
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

  const handleSaveClient = async (clientData, sendWhatsApp = false, tipoCuenta = 'master', idLlaveUsada = null) => {
    const isNew = !clientData.id;
    const finalClient = { ...clientData, id: isNew ? `C_${Date.now()}` : clientData.id };
    if (isNew) setClientes(prev => [finalClient, ...prev]);
    else setClientes(prev => prev.map(c => c.id === finalClient.id ? finalClient : c));
    setIsClientModalOpen(false); showToast(isNew ? 'Registro guardado' : 'Registro actualizado');
    await syncToSheets('guardarCliente', finalClient);

    if (idLlaveUsada) {
       const llave = stockAV.find(k => k.id === idLlaveUsada);
       if(llave) {
           const updatedLlave = { ...llave, estado: 'Usada', idCliente: finalClient.id };
           setStockAV(prev => prev.map(k => k.id === idLlaveUsada ? updatedLlave : k));
           await syncToSheets('guardarLlave', updatedLlave);
       }
    }
    if (sendWhatsApp) triggerWhatsAppAlert(finalClient, 'venta', tipoCuenta);
  };

  const triggerWhatsAppAlert = (client, type, tipoCuenta) => {
    let msg = ``;
    const isMaster = !!client.idMaster;
    const fechaVencimiento = formatDateToLocal(client.fechaVencimiento);
    
    // Buscar configuración dinámica si es software
    const configSoft = plantillas.find(p => p.nombre === client.servicio);

    if (type === 'ofrecer') {
      let opcionesOfrecer = [];
      
      if (client.categoria === 'software' && configSoft && configSoft.ofrecer.length > 0) {
        opcionesOfrecer = configSoft.ofrecer;
      } else {
        opcionesOfrecer = [
          `¡Hola {nombre}! 👋 Desde *${parametros.nombreNegocio}* te presentamos *${client.servicio}*.\n\nUna herramienta esencial para optimizar tu trabajo y mejorar tu productividad.\n\n¿Te gustaría recibir más información o conocer nuestros precios? ¡Escríbenos! 🚀`
        ];
      }
      
      msg = opcionesOfrecer[Math.floor(Math.random() * opcionesOfrecer.length)];
      // Reemplaza {nombre} por el nombre real del cliente
      msg = msg.replace(/{nombre}/g, client.nombre);

    } else if (type === 'venta') {
      msg += `¡Hola ${client.nombre}! 👋\nTe escribimos de *${parametros.nombreNegocio}*.\n\nTu cuenta de *${client.servicio}* ha sido activada con éxito.\n\n`;
      
      if (client.categoria === 'software' && configSoft) {
        msg += `${configSoft.beneficios}\n\n`;
      }

      msg += `*TUS CREDENCIALES DE ACCESO:*\n`;
      if (client.categoria === 'antivirus') {
         msg += `🛡️ Key de Activación: *${client.proveedorKey}*\n`;
      } else if (client.categoria === 'software') {
         msg += `👤 Correo de acceso: ${client.correoExterno}\n🔑 Contraseña: ${client.claveExterna}\n`;
      } else if (isMaster || tipoCuenta === 'master') {
         msg += `📺 Perfil Asignado: P${client.perfil}\n`;
         if (client.pin) {
             if (client.pin.includes('@')) msg += `📧 Invitación enviada al correo: ${client.pin}\n`;
             else msg += `🔐 PIN del perfil: ${client.pin}\n`;
         }
      } else if (!isMaster && client.correoExterno) {
         msg += `👤 Correo: ${client.correoExterno}\n🔑 Clave: ${client.claveExterna}\n📺 Perfil Asignado: ${client.perfilExterno}\n`;
         if (client.pin) {
             if (client.pin.includes('@')) msg += `📧 Invitación enviada a: ${client.pin}\n`;
             else msg += `🔐 PIN: ${client.pin}\n`;
         }
      }
      msg += `\n📅 Vencimiento programado: ${fechaVencimiento}\n\n¡Gracias por confiar en ${parametros.nombreNegocio}! 💼💙`;
    } 
    else if (type === 'reenganche') {
      msg += `¡Hola ${client.nombre}! 👋\nTe escribimos de *${parametros.nombreNegocio}*.\n\n`;
      const opcionesReenganche = [
        `Hace un tiempo disfrutaste de nuestros servicios y queríamos pasar a saludarte. ✨\n\nSi en algún momento deseas volver a activar tu cuenta de *${client.servicio}* o explorar otras plataformas profesionales y de entretenimiento, ¡avísanos!\n\nEstaremos muy felices de volver a atenderte. 😊💙`,
        `Esperamos que te encuentres súper bien. 🌟\n\nNotamos que hace tiempo no tienes activa tu cuenta de *${client.servicio}*. Si deseas retomarla o probar alguna otra plataforma con nosotros, aquí seguimos a tu disposición. ¡Te extrañamos por ${parametros.nombreNegocio}! 🚀`,
        `Te escribimos para recordarte que seguimos ofreciendo licencias de *${client.servicio}* y muchas plataformas más con el soporte de siempre. Si te animas a regresar, envíanos un mensajito. ¡Será un gusto atenderte de nuevo! 🙌`
      ];
      msg += opcionesReenganche[Math.floor(Math.random() * opcionesReenganche.length)];
    }
    else if (type === 'regalo') {
      msg += `¡Hola ${client.nombre}! 👋\nTe escribimos de *${parametros.nombreNegocio}*.\n\n¡Queremos agradecerte por tu constante preferencia! 🎉\n\nComo muestra de nuestro aprecio, te hemos obsequiado una licencia de *${client.servicio}* totalmente gratis. 🎁\n\n*TUS DATOS DE ACTIVACIÓN:*\n🛡️ Accesos: Revisa tu correo o plataforma\n📅 Válida hasta: ${fechaVencimiento}\n\n¡Disfruta y gracias por confiar en ${parametros.nombreNegocio}! 💙`;
    }
    else {
      msg += `¡Hola ${client.nombre}! 👋\nTe escribimos de *${parametros.nombreNegocio}*.\n\n`;
      let opcionesAlerta = [];
      if (client.categoria === 'software') {
         opcionesAlerta = [
           `Pasábamos a recordarte amablemente que tu licencia profesional de *${client.servicio}* culmina el *${fechaVencimiento}*.\n\nSi deseas renovar tu cuenta para no perder acceso a tus herramientas de trabajo, escríbenos por aquí y lo gestionamos de inmediato. 💼😊`,
           `¡Atención con tus herramientas! ⚙️ Tu cuenta de *${client.servicio}* se vence el *${fechaVencimiento}*.\n\nPara no interrumpir tus proyectos, confírmanos si gustas renovar y lo preparamos todo. ¡Saludos profesionales!`,
           `Tu suscripción de *${client.servicio}* está próxima a finalizar el *${fechaVencimiento}*.\n\nAvísanos si te interesa renovar para seguir trabajando con todas las funciones premium. ¡Estamos aquí para ayudarte a impulsar tus proyectos! 🚀`
         ];
      } else if (isMaster) {
         const accesoStr = `\n📺 Perfil: P${client.perfil}\n${client.pin ? (client.pin.includes('@') ? `📧 Invitación: ${client.pin}\n` : `🔐 PIN: ${client.pin}\n`) : ''}`;
         opcionesAlerta = [
           `Pasábamos a recordarte amablemente que tu servicio de *${client.servicio}* culmina el *${fechaVencimiento}*.\n\nPara tu comodidad, te recordamos tu acceso:${accesoStr}\nSi deseas continuar disfrutando del servicio, con gusto te ayudamos. Estaremos felices de mantenerte con nosotros. 😊🍿`,
           `¡Aviso de vencimiento! ⚠️ Tu cuenta de *${client.servicio}* vence el *${fechaVencimiento}*.\n\nAquí tienes tus datos de acceso actuales:${accesoStr}\nPara no perder el acceso a tus perfiles, confírmanos por aquí si deseas renovar. ¡Gracias por elegirnos! 💙`
         ];
      } else if (client.categoria === 'antivirus') {
         opcionesAlerta = [
           `Pasábamos a recordarte amablemente que tu licencia de *${client.servicio}* culmina el *${fechaVencimiento}*.\n\nSi deseas renovar tu licencia anual para mantener la seguridad de tu equipo, escríbenos por aquí y con gusto te ayudamos con la actualización. 🛡️😊`,
           `¡Tu seguridad es importante! 🛡️️ Tu licencia de *${client.servicio}* se vence el *${fechaVencimiento}*.\n\nNo dejes tu equipo desprotegido. Si gustas renovar, confírmanos y lo gestionamos de inmediato. ¡Saludos!`
         ];
      } else {
         opcionesAlerta = [
           `Pasábamos a recordarte amablemente que tu servicio de *${client.servicio}* culmina el *${fechaVencimiento}*.\n\nSi te gustaría continuar disfrutando del servicio, por favor avísanos por este medio y con mucho gusto te ayudamos a gestionarlo. 😊💙`,
           `Esperamos que estés disfrutando de tu cuenta. Te recordamos que tu suscripción de *${client.servicio}* se vence el *${fechaVencimiento}*.\n\nSi deseas renovar para que no haya interrupciones, déjanos un mensajito por aquí. ¡Será un placer seguir atendiéndote! 🍿🎬`
         ];
      }
      msg += opcionesAlerta[Math.floor(Math.random() * opcionesAlerta.length)];
    }
    
    window.open(`https://wa.me/${parametros.codigoPais}${client.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
    setWaActionModal(null);
  };

  const SyncIndicator = () => (
    <div className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${syncStatus === 'sincronizado' ? 'bg-green-50 text-green-700 border-green-200' : syncStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : syncStatus === 'sincronizando' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
       {syncStatus === 'sincronizando' ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin"/> : syncStatus === 'error' ? <AlertTriangle className="w-3.5 h-3.5 mr-1.5"/> : <Cloud className="w-3.5 h-3.5 mr-1.5"/>}
       {syncStatus === 'sincronizado' ? <span className="hidden sm:inline">Conectado a Sheets</span> : syncStatus === 'error' ? 'Falla en Sinc.' : syncStatus === 'sincronizando' ? 'Sincronizando...' : 'Desconectado'}
    </div>
  );

  const ClientFormModal = () => {
    if (!isClientModalOpen) return null;
    const isEdit = !!editingClient;
    const isAntivirus = initialCategory === 'antivirus';
    const isSoftware = initialCategory === 'software';
    
    const [formData, setFormData] = useState(editingClient || { 
      nombre: '', telefono: '', servicio: isAntivirus ? 'ESET NOD32 Premium' : isSoftware ? (plantillas[0]?.nombre || 'Gemini Pro') : 'Netflix', 
      categoria: initialCategory, 
      fechaInicio: getToday().toISOString().split('T')[0], fechaVencimiento: getToday().toISOString().split('T')[0], 
      idIntegrante: integrantes[0]?.id || '', proveedorKey: '', detallesLicencia: '',
      idMaster: '', perfil: '', pin: '', correoExterno: '', claveExterna: '', perfilExterno: ''
    });

    const [tipoCuenta, setTipoCuenta] = useState(editingClient ? (editingClient.idMaster ? 'master' : 'externo') : isSoftware ? 'externo' : 'master');
    const [origenKey, setOrigenKey] = useState(editingClient ? 'manual' : 'inventario');
    const [idLlaveSeleccionada, setIdLlaveSeleccionada] = useState('');

    const existingClient = clientes.find(c => c.telefono === formData.telefono && (!editingClient || c.id !== editingClient.id));
    
    // DINÁMICO: Lee los nombres de los productos que configuraste
    let plataformasDisponibles = [];
    if (isAntivirus) plataformasDisponibles = ['ESET NOD32 Premium', 'ESET Internet Security', 'Kaspersky Plus', 'McAfee Total Protection'];
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
              <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Smartphone className="w-5 h-5 mr-2 text-slate-400"/> Datos del {isSoftware ? 'Profesional' : 'Cliente'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-2">Nombre *</label><input className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:bg-white" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder={isSoftware ? "Ej. Ing. Sofía" : "Ej. Carlos Pérez"} /></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">WhatsApp (Sin código) *</label><input type="tel" className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:bg-white" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})} placeholder="999888777" />
                  {existingClient && <div className="text-xs text-orange-600 mt-2 font-bold flex items-center bg-orange-50 p-2 rounded-lg border border-orange-200"><AlertTriangle className="w-4 h-4 mr-1.5"/>Ya registrado: {existingClient.nombre}</div>}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Server className="w-5 h-5 mr-2 text-slate-400"/> Asignación de Servicio</h4>
               <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 mb-2">Software / Producto *</label>
                <select className="w-full border-2 rounded-xl p-3 font-bold bg-slate-50" value={formData.servicio} onChange={e => {setFormData({...formData, servicio: e.target.value, idMaster: '', proveedorKey: ''}); setIdLlaveSeleccionada('');}}>
                  {plataformasDisponibles.map(plat => <option key={plat} value={plat}>{plat}</option>)}
                </select>
                {isSoftware && plantillas.length === 0 && <p className="text-xs text-red-500 mt-2 font-bold">⚠️️ No has creado ningún producto. Ve a la pestaña "Configuración".</p>}
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
                         <div className="flex gap-4 items-start mt-4">
                           <div className="w-1/3 flex items-center text-sm font-bold text-green-800 bg-green-100 p-3.5 rounded-xl border border-green-200 h-[52px]"><Check className="w-5 h-5 mr-2" /> Perfil {formData.perfil}</div>
                           <div className="w-2/3"><input type="text" className="w-full border-2 border-orange-200 rounded-xl p-3.5 font-bold text-orange-900 bg-white" value={formData.pin || ''} onChange={(e) => setFormData({...formData, pin: e.target.value})} placeholder="PIN o Correo (Invitación)" /></div>
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                       <input type="email" placeholder="Correo Asignado" value={formData.correoExterno || ''} onChange={e=>setFormData({...formData, correoExterno: e.target.value})} className={`col-span-2 md:col-span-1 border-2 ${isSoftware ? 'border-cyan-200' : 'border-indigo-100'} rounded-xl p-3`} />
                       <input type="text" placeholder="Clave (Opcional)" value={formData.claveExterna || ''} onChange={e=>setFormData({...formData, claveExterna: e.target.value})} className={`col-span-2 md:col-span-1 border-2 ${isSoftware ? 'border-cyan-200' : 'border-indigo-100'} rounded-xl p-3`} />
                       {!isSoftware && <input type="text" placeholder="Perfil (Ej. P3)" value={formData.perfilExterno || ''} onChange={e=>setFormData({...formData, perfilExterno: e.target.value})} className="border-2 border-indigo-100 rounded-xl p-3" />}
                       {!isSoftware && <input type="text" placeholder="PIN / Invitación" value={formData.pin || ''} onChange={e=>setFormData({...formData, pin: e.target.value})} className="border-2 border-indigo-100 rounded-xl p-3 font-bold" />}
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
                            const selectedId = e.target.value;
                            setIdLlaveSeleccionada(selectedId);
                            const keyObj = stockAV.find(k => k.id === selectedId);
                            if(keyObj) setFormData({...formData, proveedorKey: keyObj.llave});
                         }}>
                            <option value="">-- Elige una KEY del inventario --</option>
                            {llavesDisponibles.map(k => <option key={k.id} value={k.id}>{k.llave}</option>)}
                         </select>
                         {llavesDisponibles.length === 0 && <p className="text-xs text-red-500 mt-2 font-bold">No tienes llaves disponibles para este producto. Ve a "Stock Antivirus".</p>}
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
            <button onClick={() => handleSaveClient(formData, false, tipoCuenta, idLlaveSeleccionada)} disabled={syncStatus === 'sincronizando' || !formData.nombre} className="px-6 py-3.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50">Solo Guardar</button>
            <button onClick={() => handleSaveClient(formData, true, tipoCuenta, idLlaveSeleccionada)} disabled={syncStatus === 'sincronizando' || !formData.nombre || (isSoftware && plantillas.length === 0)} className={`px-6 py-3.5 ${isAntivirus ? 'bg-purple-600' : isSoftware ? 'bg-cyan-600' : 'bg-green-500'} text-white rounded-xl font-bold shadow-lg disabled:opacity-50`}><MessageCircle className="w-5 h-5 inline mr-2"/> Guardar y {isSoftware ? 'Prospectar / Vender' : 'Enviar Accesos'}</button>
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
            <button onClick={() => setWaActionModal(null)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
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
                
                {waActionModal.categoria === 'antivirus' && (
                  <button onClick={() => triggerWhatsAppAlert(waActionModal, 'regalo')} className="w-full p-4 bg-pink-50 border-2 border-pink-200 rounded-2xl flex items-center text-left hover:bg-pink-100"><div className="bg-pink-500 text-white p-2.5 rounded-xl mr-3"><Gift className="w-5 h-5"/></div><div><div className="font-bold text-pink-900">Enviar como Regalo 🎁</div></div></button>
                )}

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
            <button onClick={confirmAction.onConfirm} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700">Sí, Eliminar</button>
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

  return (
    <>
      <style>{`.animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} activeTab={activeTab} setActiveTab={setActiveTab} parametros={parametros} />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="bg-white shadow-sm border-b px-4 md:px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-3 text-slate-500 hover:bg-slate-100 p-1 rounded-md">
                <Menu className="w-6 h-6" />
              </button>
              <div className="font-bold text-slate-800 md:text-slate-400 uppercase text-xs md:text-sm truncate">
                <span className="hidden sm:inline">Plataforma Operativa - </span>KGB Streaming
              </div>
            </div>
            <SyncIndicator />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'dashboard' && <Dashboard stats={stats} urgentClients={urgentClients} setWaActionModal={setWaActionModal} />}
              {activeTab === 'streaming' && <StreamingList processedClients={processedClients} cuentasMaster={cuentasMaster} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'software' && <SoftwareList processedClients={processedClients} cuentasMaster={cuentasMaster} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'antivirus' && <AntivirusList processedClients={processedClients} setWaActionModal={setWaActionModal} setEditingClient={setEditingClient} setInitialCategory={setInitialCategory} setIsClientModalOpen={setIsClientModalOpen} handleDeleteClient={handleDeleteClient} />}
              {activeTab === 'masters' && <MasterAccountsList cuentasMaster={cuentasMaster} setCuentasMaster={setCuentasMaster} clientes={clientes} syncToSheets={syncToSheets} showToast={showToast} syncStatus={syncStatus} />}
              {activeTab === 'stock_av' && <StockAntivirusList stockAV={stockAV} setStockAV={setStockAV} syncToSheets={syncToSheets} showToast={showToast} setConfirmAction={setConfirmAction} syncStatus={syncStatus} />}
              {activeTab === 'configuracion' && <Configuracion plantillas={plantillas} setPlantillas={setPlantillas} showToast={showToast} />}
            </div>
          </main>
        </div>
        <ClientFormModal /><WaActionModal /><ToastContainer /><ConfirmModal />
      </div>
    </>
  );
}