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

const addDaysToDate = (dateString, days) => {
  const d = parseDateString(dateString) || getToday();
  d.setDate(d.getDate() + parseInt(days || 0, 10));
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
// 2.1 MOTOR ANTI-SPAM (35 CABECERAS + 10 CIERRES) Y SERIALIZADOR DE CATÁLOGO
// ==========================================
const META_PREFIX = '__KGB_META__:';

const normalizePlantilla = (p) => {
  let rawOfrecer = p.ofrecer;
  if (typeof rawOfrecer === 'string') {
    try { rawOfrecer = JSON.parse(rawOfrecer); } catch (e) { rawOfrecer = [rawOfrecer]; }
  }
  if (!Array.isArray(rawOfrecer)) rawOfrecer = [];

  let meta = {
    precio: p.precio || '',
    reglas: p.reglas || '',
    categoriaCatalogo: p.categoriaCatalogo || 'Streaming'
  };
  const cleanOfrecer = [];

  rawOfrecer.forEach(item => {
    if (typeof item === 'string' && item.startsWith(META_PREFIX)) {
      try {
        const parsed = JSON.parse(item.slice(META_PREFIX.length));
        meta = { ...meta, ...parsed };
      } catch (e) {}
    } else if (typeof item === 'string' && item.trim() !== '') {
      cleanOfrecer.push(item);
    }
  });

  return {
    ...p,
    precio: meta.precio,
    reglas: meta.reglas,
    categoriaCatalogo: meta.categoriaCatalogo,
    ofrecer: cleanOfrecer
  };
};

const serializePlantillaForSheets = (p) => {
  const cleanOfrecer = (Array.isArray(p.ofrecer) ? p.ofrecer : []).filter(
    item => typeof item === 'string' && !item.startsWith(META_PREFIX) && item.trim() !== ''
  );
  const metaString = META_PREFIX + JSON.stringify({
    precio: p.precio || '',
    reglas: p.reglas || '',
    categoriaCatalogo: p.categoriaCatalogo || 'Streaming'
  });
  return {
    id: p.id,
    nombre: p.nombre,
    beneficios: p.beneficios || '',
    ofrecer: [metaString, ...cleanOfrecer]
  };
};

const CABECERAS_ANTISPAM = [
  "¡Hola *{nombre}*! 👋 Espero que estés teniendo un excelente día. Te escribimos de *{negocio}* para presentarte *{producto}* y todo lo que incluye:",
  "¡Qué tal, *{nombre}*! 🌟 Paso por aquí desde *{negocio}* porque tenemos disponible *{producto}* y queríamos mostrarte sus beneficios:",
  "¡Hola *{nombre}*! 😊 Un gusto saludarte. Desde *{negocio}* te compartimos la información completa de *{producto}* que tenemos disponible para ti:",
  "¡Buen día, *{nombre}*! 🚀 Te contactamos del equipo de *{negocio}* para ofrecerte acceso a *{producto}*. Mira todo lo que trae:",
  "¡Hola, qué tal *{nombre}*! 👋 En *{negocio}* acabamos de habilitar cupos para *{producto}* y pensamos que te podría interesar:",
  "¡Saludos, *{nombre}*! ✨ Te escribimos de *{negocio}* para comentarte que ya contamos con *{producto}* totalmente garantizado. Te detallo lo que incluye:",
  "¡Hola *{nombre}*! 💙 Espero que todo marche súper bien. Te comparto desde *{negocio}* los detalles completos de *{producto}*:",
  "¡Qué tal *{nombre}*! 🙌 Te saluda el equipo de *{negocio}*. Queríamos ofrecerte *{producto}* con soporte completo. Aquí tienes la información:",
  "¡Hola *{nombre}*! 🌟 Si estabas buscando *{producto}*, en *{negocio}* lo tenemos listo para activación inmediata. Te explico qué incluye:",
  "¡Hola, *{nombre}*! 👋 Te escribimos con una excelente novedad desde *{negocio}*. Ya tenemos disponible *{producto}* y esto es todo lo que obtienes:",
  "¡Estimado/a *{nombre}*! 😊 Qué gusto saludarte desde *{negocio}*. Te enviamos la ficha informativa de *{producto}* para que conozcas sus ventajas:",
  "¡Hola *{nombre}*! 🚀 Queremos ayudarte a disfrutar de lo mejor en *{negocio}*, por eso hoy te ofrecemos *{producto}*. Revisa sus características:",
  "¡Qué tal, *{nombre}*! 👋 Espero que tu semana vaya genial. Te escribo de *{negocio}* para presentarte nuestra suscripción de *{producto}*:",
  "¡Hola *{nombre}*! ✨ Desde *{negocio}* hemos preparado esta información especial sobre *{producto}* para que veas todo lo que puedes aprovechar:",
  "¡Un saludo cordial, *{nombre}*! 💙 Te contactamos de *{negocio}* porque tenemos activo *{producto}* y queríamos explicarte paso a paso qué trae:",
  "¡Hola *{nombre}*! 🎉 En *{negocio}* seguimos ampliando nuestro catálogo y hoy queremos ofrecerte *{producto}*. Mira todos sus beneficios:",
  "¡Qué tal *{nombre}*! 😊 Te escribimos brevemente de *{negocio}* para darte a conocer *{producto}*, una de nuestras plataformas más completas:",
  "¡Hola, *{nombre}*! ⚡ Si quieres sacarle el máximo provecho a tu entretenimiento o trabajo, en *{negocio}* te ofrecemos *{producto}*:",
  "¡Buenas, *{nombre}*! 👋 Por aquí el equipo de *{negocio}*. Te dejamos los detalles de *{producto}* para que lo evalúes con total confianza:",
  "¡Hola *{nombre}*! 🌟 Gracias por estar en contacto con *{negocio}*. Hoy queremos presentarte *{producto}* junto con todas sus funciones:",
  "¡Qué gusto saludarte, *{nombre}*! 🙌 Desde *{negocio}* te acercamos esta propuesta de *{producto}* con garantía total. Mira lo que incluye:",
  "¡Hola *{nombre}*! 💼 En *{negocio}* nos encanta brindarte las mejores herramientas y plataformas, por eso te ofrecemos *{producto}*:",
  "¡Hola, qué tal *{nombre}*! ✨ Te compartimos desde *{negocio}* la guía completa y beneficios de *{producto}*, disponible desde hoy:",
  "¡Saludos *{nombre}*! 👋 Espero que te encuentres muy bien. Te escribo de *{negocio}* para mostrarte por qué *{producto}* es una excelente elección:",
  "¡Hola *{nombre}*! 🔥 En *{negocio}* tenemos listo *{producto}* con entrega inmediata y soporte. Aquí te explico detalladamente qué contiene:",
  "¡Qué tal, *{nombre}*! 💙 Paso a dejarte la información oficial de *{producto}* de parte de *{negocio}* para que conozcas todo su potencial:",
  "¡Hola *{nombre}*! 😊 Sabemos que buscas calidad y seguridad, por eso desde *{negocio}* te ofrecemos *{producto}* con estas características:",
  "¡Buen día *{nombre}*! 🌟 Te saluda *{negocio}*. Queremos poner a tu disposición *{producto}* y explicarte claramente cómo funciona:",
  "¡Hola, *{nombre}*! 🚀 ¿Ya conocías todo lo que incluye *{producto}*? Desde *{negocio}* te lo resumimos para que puedas aprovecharlo:",
  "¡Qué tal *{nombre}*! 👋 Te escribimos con mucho gusto desde *{negocio}* para invitarte a probar *{producto}*. Mira todo lo que trae:",
  "¡Hola *{nombre}*! ✨ Pensando en darte siempre las mejores opciones, en *{negocio}* te presentamos *{producto}* con acceso garantizado:",
  "¡Saludos cordiales, *{nombre}*! 🙌 Desde la central de *{negocio}* te enviamos el detalle completo de *{producto}* disponible en nuestro catálogo:",
  "¡Hola *{nombre}*! 💡 Si te interesa contar con *{producto}*, en *{negocio}* te explicamos de forma clara y transparente todo lo que incluye:",
  "¡Qué tal, *{nombre}*! 😊 Espero que estés pasando un gran día. Te comparto de parte de *{negocio}* los beneficios y detalles de *{producto}*:",
  "¡Hola *{nombre}*! 🎯 En *{negocio}* tenemos disponible *{producto}* con garantía y soporte permanente. Te detallo a continuación lo que ofrece:"
];

const CIERRES_ANTISPAM = [
  "¿Te gustaría que te activemos tu acceso hoy mismo? ¡Quedamos atentos a tu respuesta! 😊🚀",
  "Si tienes alguna consulta o deseas adquirirlo, escríbenos por aquí y te atendemos al instante. 💙",
  "¿Qué te parece? Avísanos si deseas aprovecharlo hoy y lo dejamos listo en minutos. 🙌✨",
  "Cualquier duda que tengas sobre el funcionamiento, aquí estamos para ayudarte con total confianza. 😊",
  "¡Anímate a probarlo! Confírmanos por este medio si deseas que procedamos con tu activación. 🔥",
  "Trabajamos con garantía y soporte durante todo tu periodo. ¿Te reservamos un cupo? 💼💙",
  "Si te interesa, respóndenos este mensaje y te enviamos los métodos de pago al instante. ⚡",
  "Estamos conectados para activar tu cuenta de inmediato apenas nos confirmes. ¡Un abrazo! 🌟",
  "¿Deseas que te separemos una licencia o perfil con esta oferta? ¡Escríbenos! 👋😊",
  "Gracias por tu tiempo y por confiar siempre en nosotros. ¡Avísanos si te animas a activarlo hoy! 🎉"
];

const buildCatalogOfferMessage = ({ clientName, productObj, discountPercent = 0, headerIdx = null, footerIdx = null }) => {
  if (!productObj) return '';
  const nombreFinal = clientName || 'Cliente';
  const poolCabeceras = [
    ...CABECERAS_ANTISPAM,
    ...(Array.isArray(productObj.ofrecer) ? productObj.ofrecer : [])
  ];
  const chosenHeaderIdx = headerIdx !== null ? (headerIdx % poolCabeceras.length) : Math.floor(Math.random() * poolCabeceras.length);
  const chosenFooterIdx = footerIdx !== null ? (footerIdx % CIERRES_ANTISPAM.length) : Math.floor(Math.random() * CIERRES_ANTISPAM.length);

  let cabecera = poolCabeceras[chosenHeaderIdx] || CABECERAS_ANTISPAM[0];
  cabecera = cabecera
    .replace(/{nombre}/gi, nombreFinal)
    .replace(/{producto}/gi, productObj.nombre || 'nuestro servicio')
    .replace(/{negocio}/gi, parametros.nombreNegocio);

  let msg = `${cabecera}\n\n`;

  if (productObj.beneficios && productObj.beneficios.trim() !== '') {
    msg += `📋 *¿QUÉ INCLUYE ${(productObj.nombre || '').toUpperCase()}?*\n${productObj.beneficios.trim()}\n\n`;
  }

  const precioNum = parseFloat(productObj.precio);
  if (!isNaN(precioNum) && precioNum > 0) {
    if (discountPercent > 0) {
      const precioFinal = (precioNum * (1 - discountPercent / 100)).toFixed(2).replace(/\.00$/, '');
      msg += `🔥 *PROMOCIÓN ESPECIAL PARA TI (-${discountPercent}% DSCTO):*\n`;
      msg += `❌ Precio normal: ~S/ ${precioNum.toFixed(2).replace(/\.00$/, '')}~\n`;
      msg += `✅ *Precio con descuento hoy:* *S/ ${precioFinal}*\n\n`;
    } else {
      msg += `💰 *PRECIO:* *S/ ${precioNum.toFixed(2).replace(/\.00$/, '')}*\n\n`;
    }
  }

  if (productObj.reglas && productObj.reglas.trim() !== '') {
    msg += `🛡️ *REGLAS DE USO Y GARANTÍA:*\n${productObj.reglas.trim()}\n\n`;
  }

  msg += CIERRES_ANTISPAM[chosenFooterIdx];
  return msg;
};

// ==========================================
// 2.2 MOTOR ANTI-SPAM PARA REGALOS VIP (HBO / ENGANCHE SILENCIOSO)
// ==========================================
const VIP_CONFIG_ID = 'PL_VIP_HBO_CONFIG';

const CABECERAS_REGALO_VIP = [
  "¡Hola *{nombre}*! 👋 Espero que todo vaya excelente. Hoy habilitamos una cuenta Premium de *{producto}* en *{negocio}* y, como te tenemos mucho aprecio, quise separarte un perfil de regalo totalmente GRATIS para ti:",
  "¡Qué tal, *{nombre}*! 🌟 Paso a saludarte personalmente desde *{negocio}*. Te cuento que acabo de activar una cuenta de *{producto}* y te asigné un perfil de cortesía sin ningún costo para que lo disfrutes en casa:",
  "¡Hola *{nombre}*! 😊 Un gusto saludarte. En *{negocio}* seleccionamos a un grupo muy reducido de clientes especiales para obsequiarles acceso directo a *{producto}*, y aquí tienes tu perfil listo:",
  "¡Buen día, *{nombre}*! 🍿 Qué tal todo. Te escribo porque hoy liberamos accesos VIP de *{producto}* en *{negocio}* y quise darte la sorpresa enviándote un perfil gratuito para que veas tus series y películas favoritas:",
  "¡Hola, qué tal *{nombre}*! 👋 Te saluda el equipo de *{negocio}*. Queríamos tener un detalle especial contigo hoy y te hemos activado un perfil de regalo en *{producto}*. Aquí tienes tus accesos:",
  "¡Saludos, *{nombre}*! ✨ Espero que estés teniendo una gran semana. Sin ningún compromiso, en *{negocio}* te hemos separado un perfil gratuito de *{producto}* como agradecimiento por tu confianza:",
  "¡Hola *{nombre}*! 💙 Paso rapidito por aquí desde *{negocio}* para dejarte un regalo sorpresa. Te habilité un perfil exclusivo en *{producto}* para que puedas entrar desde hoy mismo:",
  "¡Qué tal *{nombre}*! 🙌 Hoy estuvimos organizando nuestras cuentas VIP en *{negocio}* y nos acordamos de ti. Te regalo este acceso directo a *{producto}* para que lo disfrutes:",
  "¡Hola *{nombre}*! 🎁 Como eres parte importante de *{negocio}*, hoy queremos sorprenderte con un acceso de cortesía a *{producto}*. Ya está activo y listo para que ingreses:",
  "¡Hola, *{nombre}*! 👋 Espero que te encuentres súper bien. Te comparto un acceso gratuito a *{producto}* que te hemos reservado especialmente en *{negocio}*:",
  "¡Estimado/a *{nombre}*! 😊 Qué gusto saludarte. En *{negocio}* nos gusta premiar a nuestros contactos de confianza, así que te hemos habilitado un perfil sin costo en *{producto}*:",
  "¡Hola *{nombre}*! 🚀 Te escribo con una sorpresa de parte de *{negocio}*. Te acabo de crear un perfil personal en *{producto}* totalmente de regalo. Mira tus datos de ingreso:",
  "¡Qué tal, *{nombre}*! 🍿 Si tienes ganas de ver una buena película o serie hoy, en *{negocio}* te acabamos de regalar un perfil activo de *{producto}*. Aquí tienes la cuenta:",
  "¡Hola *{nombre}*! ✨ Queríamos agradecerte por estar siempre en nuestro contacto de *{negocio}*, por eso te obsequiamos este acceso directo a *{producto}*:",
  "¡Un saludo cordial, *{nombre}*! 💙 Te escribo personalmente desde *{negocio}* para entregarte este perfil de cortesía de *{producto}* que separamos para ti:",
  "¡Hola *{nombre}*! 🎉 Hoy tenemos un regalo exclusivo para ti en *{negocio}*. Te hemos asignado un cupo VIP totalmente gratis en *{producto}*. Aquí están las credenciales:",
  "¡Qué tal *{nombre}*! 😊 Paso a dejarte este obsequio de parte de *{negocio}*. Es un perfil privado de *{producto}* listo para usar en tu TV, celular o computadora:",
  "¡Hola, *{nombre}*! ⚡ Sin sorteos ni complicaciones, en *{negocio}* decidimos regalarte directamente un acceso a *{producto}* para que lo pruebes y disfrutes:",
  "¡Buenas, *{nombre}*! 👋 Por aquí te dejamos un detalle especial de *{negocio}*. Acabamos de activar tu perfil gratuito en *{producto}* con estos datos:",
  "¡Hola *{nombre}*! 🌟 Pensando en darte una sorpresa agradable hoy, desde *{negocio}* te habilitamos un perfil de regalo en *{producto}*:",
  "¡Qué gusto saludarte, *{nombre}*! 🙌 Te comparto las llaves de tu nuevo perfil de cortesía en *{producto}*, un regalo directo de parte de *{negocio}*:",
  "¡Hola *{nombre}*! 🎬 Sabemos que un buen momento de entretenimiento siempre cae bien, por eso en *{negocio}* te regalamos este acceso a *{producto}*:",
  "¡Hola, qué tal *{nombre}*! ✨ Te enviamos de forma exclusiva desde *{negocio}* los datos de acceso a un perfil de *{producto}* que hemos preparado como obsequio para ti:",
  "¡Saludos *{nombre}*! 👋 Espero que todo marche de maravilla. Te dejo por aquí un acceso VIP de regalo para *{producto}* cortesía de *{negocio}*:",
  "¡Hola *{nombre}*! 🔥 Te cuento que te acabo de reservar un perfil gratuito de *{producto}* en *{negocio}* para que puedas entrar cuando gustes. Aquí tienes los datos:",
  "¡Qué tal, *{nombre}*! 💙 En *{negocio}* valoramos mucho a nuestros clientes y amigos, así que hoy te regalamos este perfil activo de *{producto}*:",
  "¡Hola *{nombre}*! 😊 Te traigo una buena noticia de parte de *{negocio}*: tienes un perfil de *{producto}* activado totalmente gratis a tu nombre:",
  "¡Buen día *{nombre}*! 🌟 Paso a entregarte un regalo especial de *{negocio}*. Disfruta de *{producto}* sin costo con estas credenciales:",
  "¡Hola, *{nombre}*! 🍿 Queríamos tener una atención exclusiva contigo desde *{negocio}*, así que te habilitamos este acceso directo a *{producto}*:",
  "¡Qué tal *{nombre}*! 🎁 Aquí tienes un regalo sorpresa de *{negocio}*: un perfil completo de *{producto}* listo para que ingreses ahora mismo:"
];

const CIERRES_REGALO_VIP = [
  "¡Que lo disfrutes muchísimo! Si necesitas ayuda para iniciar sesión, me avisas por aquí. 😊🍿",
  "¡Disfruta de tus series y películas! Cualquier consulta al ingresar, estoy atento para ayudarte. 💙",
  "Espero que te guste este detalle. ¡Pásala genial y avísame cuando hayas podido entrar! 🙌✨",
  "¡Un abrazo! Que disfrutes tu cuenta, aquí estamos por si tienes cualquier duda al conectarte. 😊",
  "¡Listo para maratonear! Confírmame si pudiste ingresar todo bien. 🎬🔥",
  "¡Gracias por ser parte de nuestra comunidad! Disfruta tu regalo con total comodidad. 💙🌟",
  "Si te pide algún código al iniciar sesión en tu TV o celular, escríbeme y te ayudo al instante. ⚡",
  "¡Que tengas una excelente semana llena de buen entretenimiento! Un saludo cordial. 👋😊",
  "¡Disfrútalo en casa! Me cuentas qué tal te va con el acceso. 🎉🍿",
  "Un detalle con mucho aprecio de nuestra parte. ¡Que lo aproveches al máximo! 🌟💙"
];

const buildVipGiftMessage = ({
  clientName,
  platformName,
  correo,
  clave,
  perfil,
  pin,
  reglasVip,
  hideExpiry = true,
  fechaVencimientoStr = '',
  headerIdx = null,
  footerIdx = null
}) => {
  const nombreFinal = clientName || 'Cliente';
  const prodFinal = platformName || 'HBO Max';
  const hIdx = headerIdx !== null ? (headerIdx % CABECERAS_REGALO_VIP.length) : Math.floor(Math.random() * CABECERAS_REGALO_VIP.length);
  const fIdx = footerIdx !== null ? (footerIdx % CIERRES_REGALO_VIP.length) : Math.floor(Math.random() * CIERRES_REGALO_VIP.length);

  const cabecera = CABECERAS_REGALO_VIP[hIdx]
    .replace(/{nombre}/gi, nombreFinal)
    .replace(/{producto}/gi, prodFinal)
    .replace(/{negocio}/gi, parametros.nombreNegocio);

  let msg = `${cabecera}\n\n`;
  msg += `🎬 *TUS ACCESOS VIP (${prodFinal.toUpperCase()}):*\n`;
  msg += `👤 *Correo:* ${correo || 'Por asignar'}\n`;
  msg += `🔑 *Contraseña:* ${clave || 'Por asignar'}\n`;
  msg += `📺 *Perfil Asignado:* Perfil ${perfil || '1'}\n`;
  if (pin && String(pin).trim() !== '') {
    msg += `🔐 *PIN del Perfil:* ${pin}\n`;
  }
  if (!hideExpiry && fechaVencimientoStr) {
    msg += `📅 *Válido hasta:* ${fechaVencimientoStr}\n`;
  }

  if (reglasVip && reglasVip.trim() !== '') {
    msg += `\n🛡️ *RECOMENDACIONES PARA CONSERVAR TU REGALO:*\n${reglasVip.trim()}\n`;
  }

  msg += `\n${CIERRES_REGALO_VIP[fIdx]}`;
  return msg;
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
        <button onClick={() => { setActiveTab('catalogo'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'catalogo' ? 'bg-amber-500/10 text-amber-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><Star className="w-5 h-5 mr-3" /> Catálogo y Ofertas</button>
        <button onClick={() => { setActiveTab('campanas'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'campanas' ? 'bg-pink-600/10 text-pink-400 font-bold' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><Gift className="w-5 h-5 mr-3" /> Campañas y Regalos</button>
        <button onClick={() => { setActiveTab('regalos_vip'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'regalos_vip' ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}><Gift className="w-5 h-5 mr-3 text-indigo-400" /> Regalos VIP (HBO)</button>

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
    const newKeys = lines.map((line, idx) => ({
      id: `K_${Date.now()}_${idx}_${Math.random().toString(36).substr(2,5)}`,
      producto: newProduct, llave: line, estado: 'Disponible',
      fechaAgregado: getToday().toISOString().split('T')[0], idCliente: ''
    }));
    setStockAV(prev => [...newKeys, ...prev]);
    showToast(`Guardando ${newKeys.length} licencia(s) en Google Sheets...`);
    setKeysRaw('');
    for (const keyObj of newKeys) {
      await syncToSheets('guardarLlave', keyObj);
    }
    showToast(`${newKeys.length} Licencia(s) sincronizadas en Google Sheets`);
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
    const newTemplate = {
      id: `PL_${Date.now()}`,
      nombre: 'Nueva Plataforma / Software',
      categoriaCatalogo: 'Streaming',
      precio: '15',
      beneficios: '✅ Acceso completo 100% garantizado\n✅ Soporte técnico durante toda tu suscripción',
      reglas: '⚠️ Uso exclusivo en 1 dispositivo autorizado\n⚠️ No modificar datos de la cuenta para conservar la garantía',
      ofrecer: []
    };
    setEditingId(newTemplate.id); setFormData(newTemplate);
  };

  const handleSave = async () => {
    const normalized = normalizePlantilla(formData);
    const isNew = !plantillas.some(p => p.id === normalized.id);
    if (isNew) setPlantillas(prev => [...prev, normalized]);
    else setPlantillas(prev => prev.map(p => p.id === normalized.id ? normalized : p));
    setEditingId(null); showToast('Guardando en Google Sheets...');
    await syncToSheets('guardarPlantilla', serializePlantillaForSheets(normalized));
  };

  const handleDelete = async (id) => {
    setPlantillas(prev => prev.filter(p => p.id !== id));
    setEditingId(null); showToast('Borrando de Google Sheets...');
    await syncToSheets('eliminarPlantilla', { id });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold text-slate-800 flex items-center"><Settings className="w-8 h-8 mr-3 text-slate-600"/> Plantillas y Productos del Catálogo</h1><p className="text-slate-500 mt-1">Configura tus plataformas (Netflix, HBO, AutoCAD, Antivirus), precios en Soles, beneficios y reglas de uso.</p></div>
      <div className="flex justify-end"><button onClick={handleAdd} disabled={syncStatus === 'sincronizando'} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-md disabled:opacity-50"><Plus className="w-5 h-5 mr-2" /> Nuevo Producto / Plataforma</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {plantillas.filter(p => p.id !== VIP_CONFIG_ID).map(p => (
            <div key={p.id} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${editingId === p.id ? 'border-slate-800 bg-slate-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-400'}`} onClick={() => { setEditingId(p.id); setFormData(normalizePlantilla(p)); }}>
              <div className="flex justify-between items-start">
                <div className="font-bold text-slate-800">{p.nombre}</div>
                {p.precio && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-black">S/ {p.precio}</span>}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>{p.categoriaCatalogo || 'General'}</span>
                <span className="text-amber-600 font-bold">35+ cabeceras anti-spam activas</span>
              </div>
            </div>
          ))}
          {plantillas.length === 0 && <p className="text-sm text-slate-500">Crea tu primer producto para empezar a sincronizar.</p>}
        </div>

        {editingId && formData && (
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de Plataforma *</label>
                <input className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:border-slate-500 font-bold" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. AutoCAD (32 Programas)" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                <select className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:border-slate-500 font-bold" value={formData.categoriaCatalogo || 'Streaming'} onChange={e => setFormData({...formData, categoriaCatalogo: e.target.value})}>
                  <option value="Streaming">📺 Streaming (Netflix, HBO, etc.)</option>
                  <option value="Software">💼 Software Profesional (AutoCAD, etc.)</option>
                  <option value="Antivirus">🛡️ Antivirus y Seguridad</option>
                  <option value="Otros">⭐ Otros Servicios</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Precio Base (Soles S/)</label>
                <input type="number" step="0.5" className="w-full border-2 border-emerald-200 rounded-xl p-3 bg-emerald-50/40 focus:border-emerald-500 font-black text-emerald-900" value={formData.precio || ''} onChange={e => setFormData({...formData, precio: e.target.value})} placeholder="Ej. 16" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">📋 Explicación del Producto / Qué incluye (Pega aquí todo el detalle o los 32 programas)</label>
              <textarea rows="6" className="w-full border-2 rounded-xl p-3 bg-slate-50 focus:border-slate-500 text-sm" value={formData.beneficios} onChange={e => setFormData({...formData, beneficios: e.target.value})} placeholder="Explica aquí qué programas o beneficios incluye la plataforma..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">🛡️ Reglas de Uso y Garantía (Para que el cliente compre con seguridad)</label>
              <textarea rows="4" className="w-full border-2 border-amber-200 rounded-xl p-3 bg-amber-50/30 focus:border-amber-500 text-sm" value={formData.reglas || ''} onChange={e => setFormData({...formData, reglas: e.target.value})} placeholder="Ej. 1. Uso en 1 pantalla a la vez. 2. No cambiar clave ni crear perfiles extra. 3. Garantía y soporte todo el mes..."></textarea>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-800 font-medium">
              ✨ <strong>Motor Anti-Spam Autónomo Activo:</strong> El sistema ya genera automáticamente <strong>35 cabeceras distintas y 10 cierres aleatorios</strong> con el nombre del cliente para que WhatsApp nunca te detecte como spam. Solo necesitas pegar arriba la explicación, el precio y las reglas.
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button disabled={syncStatus === 'sincronizando'} onClick={() => handleDelete(formData.id)} className="px-4 py-2.5 text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center disabled:opacity-50"><Trash2 className="w-4 h-4 mr-2"/> Eliminar Producto</button>
              <button disabled={syncStatus === 'sincronizando'} onClick={handleSave} className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 flex items-center disabled:opacity-50"><Server className="w-4 h-4 mr-2"/> Guardar en Google Sheets</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4.1 NUEVO MÓDULO: CATÁLOGO, OFERTAS Y DESCUENTOS ANTI-SPAM
// ==========================================
const CatalogoOfertasView = ({ plantillas, setPlantillas, clientes, codigoPais, showToast, syncToSheets, syncStatus }) => {
  const catalogItems = useMemo(() => plantillas.filter(p => p.id !== VIP_CONFIG_ID), [plantillas]);
  const [selectedProductId, setSelectedProductId] = useState(catalogItems[0]?.id || '');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [randomSeed, setRandomSeed] = useState(() => Math.floor(Math.random() * 35));
  const [footerSeed, setFooterSeed] = useState(() => Math.floor(Math.random() * 10));
  const [subTab, setSubTab] = useState('cotizador'); // 'cotizador' | 'editor'

  useEffect(() => {
    if (!selectedProductId && catalogItems.length > 0) {
      setSelectedProductId(catalogItems[0].id);
    }
  }, [catalogItems, selectedProductId]);

  const clientesUnicos = useMemo(() => {
    const map = new Map();
    clientes.forEach(c => {
      if (c.telefono && c.nombre && !map.has(String(c.telefono))) {
        map.set(String(c.telefono), c);
      }
    });
    return Array.from(map.values());
  }, [clientes]);

  const sugerencias = useMemo(() => {
    if (!clientName.trim()) return clientesUnicos.slice(0, 15);
    const term = clientName.toLowerCase();
    return clientesUnicos.filter(c =>
      String(c.nombre).toLowerCase().includes(term) ||
      String(c.telefono).includes(term)
    ).slice(0, 15);
  }, [clientesUnicos, clientName]);

  const currentProduct = catalogItems.find(p => p.id === selectedProductId) || catalogItems[0] || null;

  const previewMsg = useMemo(() => {
    if (!currentProduct) return 'Primero agrega un producto o plataforma en la pestaña "Administrar Catálogo".';
    return buildCatalogOfferMessage({
      clientName: clientName.trim() || 'Cliente',
      productObj: currentProduct,
      discountPercent,
      headerIdx: randomSeed,
      footerIdx: footerSeed
    });
  }, [currentProduct, clientName, discountPercent, randomSeed, footerSeed]);

  const handleSendWhatsAppOffer = () => {
    if (!currentProduct) {
      showToast('Selecciona una plataforma del catálogo', 'error');
      return;
    }
    if (!clientPhone.trim()) {
      showToast('Ingresa o selecciona el WhatsApp del cliente', 'error');
      return;
    }
    const nextHeader = Math.floor(Math.random() * 35);
    const nextFooter = Math.floor(Math.random() * 10);
    const msgToSend = buildCatalogOfferMessage({
      clientName: clientName.trim() || 'Cliente',
      productObj: currentProduct,
      discountPercent,
      headerIdx: randomSeed,
      footerIdx: footerSeed
    });
    setRandomSeed(nextHeader);
    setFooterSeed(nextFooter);
    window.open(`https://wa.me/${codigoPais}${clientPhone.trim()}?text=${encodeURIComponent(msgToSend)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Star className="w-8 h-8 mr-3 text-amber-500" /> Catálogo, Ofertas y Descuentos
          </h1>
          <p className="text-slate-500 mt-1">
            Ofrece todas tus plataformas (Netflix, HBO, AutoCAD 32 programas, Antivirus) con explicación detallada, reglas, descuentos y 35 cabeceras anti-spam.
          </p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setSubTab('cotizador')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${subTab === 'cotizador' ? 'bg-amber-500 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🚀 Enviar Oferta / Descuento
          </button>
          <button
            onClick={() => setSubTab('editor')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${subTab === 'editor' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            ⚙️ Administrar Mi Catálogo ({catalogItems.length})
          </button>
        </div>
      </div>

      {subTab === 'editor' ? (
        <Configuracion
          plantillas={plantillas}
          setPlantillas={setPlantillas}
          showToast={showToast}
          syncToSheets={syncToSheets}
          syncStatus={syncStatus}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* PASO 1: CLIENTE CON AUTOCOMPLETADO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-amber-500" /> 1. Selecciona o Escribe al Cliente
                </h3>
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-200">
                  ⚡ {clientesUnicos.length} clientes en memoria
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Nombre del Cliente *</label>
                  <input
                    type="text"
                    className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none font-bold"
                    placeholder="Escribe una letra (Ej. J para José)..."
                    value={clientName}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                    onChange={(e) => { setClientName(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Tab' || e.key === 'Enter') && showSuggestions && sugerencias.length > 0) {
                        e.preventDefault();
                        setClientName(sugerencias[0].nombre);
                        setClientPhone(String(sugerencias[0].telefono));
                        setShowSuggestions(false);
                      }
                    }}
                  />
                  {showSuggestions && sugerencias.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-amber-300 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                      {sugerencias.map(s => (
                        <div
                          key={s.id}
                          onMouseDown={() => {
                            setClientName(s.nombre);
                            setClientPhone(String(s.telefono));
                            setShowSuggestions(false);
                          }}
                          className="p-3 hover:bg-amber-50 cursor-pointer border-b border-slate-100 flex justify-between items-center"
                        >
                          <span className="font-bold text-slate-800">{s.nombre}</span>
                          <span className="text-xs font-mono text-slate-500">+{s.telefono}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">WhatsApp (Sin código de país) *</label>
                  <input
                    type="tel"
                    className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none font-mono font-bold"
                    placeholder="999888777"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
            </div>

            {/* PASO 2: PLATAFORMA DEL CATÁLOGO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center">
                  <MonitorPlay className="w-5 h-5 mr-2 text-blue-600" /> 2. Elige la Plataforma o Programa a Ofrecer
                </h3>
                <button
                  onClick={() => setSubTab('editor')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Agregar / Editar Plataformas
                </button>
              </div>

              {catalogItems.length === 0 ? (
                <div className="p-6 bg-amber-50 border-2 border-amber-200 border-dashed rounded-2xl text-center space-y-3">
                  <p className="text-sm font-bold text-amber-900">Aún no has cargado plataformas en tu catálogo.</p>
                  <button
                    onClick={() => setSubTab('editor')}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm shadow"
                  >
                    Ir a Cargar Netflix, HBO, AutoCAD...
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {catalogItems.map(item => {
                    const isSelected = item.id === (currentProduct?.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedProductId(item.id);
                          setRandomSeed(Math.floor(Math.random() * 35));
                          setFooterSeed(Math.floor(Math.random() * 10));
                        }}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                          isSelected ? 'border-amber-500 bg-amber-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{item.nombre}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{item.categoriaCatalogo || 'Catálogo'}</div>
                        </div>
                        {item.precio && (
                          <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-lg">
                            S/ {item.precio}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PASO 3: PROMOCIÓN Y DESCUENTO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Gift className="w-5 h-5 mr-2 text-pink-500" /> 3. Aplicar Promoción o Descuento (Opcional)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Precio Normal', value: 0 },
                  { label: '🔥 -10% Dscto', value: 10 },
                  { label: '🔥 -15% Dscto', value: 15 },
                  { label: '🔥 -20% Dscto', value: 20 }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDiscountPercent(opt.value)}
                    className={`py-3 px-3 rounded-xl font-bold text-xs border-2 transition-all ${
                      discountPercent === opt.value
                        ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {currentProduct?.precio && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl text-sm">
                  <span className="font-bold text-emerald-900">Precio calculado en el mensaje:</span>
                  <div className="font-black text-emerald-700 text-base">
                    {discountPercent > 0 ? (
                      <>
                        <span className="line-through text-slate-400 text-xs mr-2">S/ {currentProduct.precio}</span>
                        <span>S/ {(parseFloat(currentProduct.precio) * (1 - discountPercent / 100)).toFixed(2).replace(/\.00$/, '')} (-{discountPercent}%)</span>
                      </>
                    ) : (
                      <span>S/ {currentProduct.precio}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VISTA PREVIA EN VIVO Y BOTÓN WHATSAPP */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col h-full justify-between space-y-5">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">Sistema Anti-Spam Activo</span>
                    <h3 className="text-lg font-bold">Vista Previa del Mensaje</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRandomSeed(prev => (prev + 1) % 35);
                      setFooterSeed(prev => (prev + 1) % 10);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center border border-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Cambiar Cabecera ({randomSeed + 1}/35)
                  </button>
                </div>

                <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl p-4 font-sans text-xs text-emerald-50 whitespace-pre-wrap max-h-[420px] overflow-y-auto leading-relaxed">
                  {previewMsg}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsAppOffer}
                  disabled={!currentProduct || !clientPhone.trim()}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-black rounded-2xl shadow-lg flex items-center justify-center text-base transition-all"
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> Enviar Oferta por WhatsApp
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Cada vez que envías un mensaje, la cabecera y la despedida rotan automáticamente entre 350 combinaciones para evitar bloqueos en WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4.2 NUEVO MÓDULO: REGALOS VIP (HBO / ENGANCHE SILENCIOSO 10-15 DÍAS)
// ==========================================
const RegalosVipHboView = ({
  cuentasMaster,
  setCuentasMaster,
  clientes,
  setClientes,
  plantillas,
  setPlantillas,
  integrantes,
  codigoPais,
  showToast,
  syncToSheets,
  syncStatus
}) => {
  const [subTab, setSubTab] = useState('regalar'); // 'regalar' | 'boveda' | 'config'
  const [showAllMasters, setShowAllMasters] = useState(false);

  // Configuración persistida en PLANTILLAS bajo VIP_CONFIG_ID
  const storedConfig = useMemo(() => plantillas.find(p => p.id === VIP_CONFIG_ID), [plantillas]);
  const [reglasVip, setReglasVip] = useState(
    storedConfig?.reglas ||
    '• Ingresa únicamente en el perfil que te hemos asignado.\n• No modifiques la contraseña ni agregues o elimines perfiles para mantener activo tu beneficio.'
  );
  const [mensajeConversion, setMensajeConversion] = useState(
    storedConfig?.beneficios ||
    '¡Hola *{nombre}*! 👋 Espero que estés disfrutando muchísimo tu perfil VIP de *{producto}* que te regalamos en *{negocio}*. 🍿✨\n\nTe escribo porque tu periodo de cortesía está por culminar, y como ya tienes tu perfil configurado, queríamos ofrecerte conservarlo activo por todo el mes a una tarifa preferencial de cliente exclusivo. ¿Te gustaría mantener tu perfil activo? 😊💙'
  );
  const [diasDefaultConfig, setDiasDefaultConfig] = useState(storedConfig?.precio || '15');

  useEffect(() => {
    if (storedConfig) {
      if (storedConfig.reglas) setReglasVip(storedConfig.reglas);
      if (storedConfig.beneficios) setMensajeConversion(storedConfig.beneficios);
      if (storedConfig.precio) setDiasDefaultConfig(storedConfig.precio);
    }
  }, [storedConfig]);

  // Cuentas de la Bóveda VIP (ID empieza con MVIP_ o plataforma contiene HBO/Max)
  const vipMasters = useMemo(() => {
    const onlyVip = cuentasMaster.filter(m => String(m.id).startsWith('MVIP_'));
    if (showAllMasters || onlyVip.length === 0) return cuentasMaster;
    return onlyVip;
  }, [cuentasMaster, showAllMasters]);

  // Estado para regalar acceso
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchClientTable, setSearchClientTable] = useState('');
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [assignedProfile, setAssignedProfile] = useState('1');
  const [assignedPin, setAssignedPin] = useState('');
  const [giftDays, setGiftDays] = useState(15);
  const [hideExpiryInWa, setHideExpiryInWa] = useState(true); // "Ellos no lo van a saber"
  const [headerSeed, setHeaderSeed] = useState(() => Math.floor(Math.random() * CABECERAS_REGALO_VIP.length));
  const [footerSeed, setFooterSeed] = useState(() => Math.floor(Math.random() * CIERRES_REGALO_VIP.length));

  // Estado para subir nueva cuenta HBO a la bóveda VIP
  const [newVipAccount, setNewVipAccount] = useState({
    id: null,
    plataforma: 'HBO Max',
    correo: '',
    clave: '',
    limitePerfiles: 5,
    fechaRenovacion: addMonthsToDate(getToday().toISOString().split('T')[0], 1)
  });
  const [isCustomVipPlat, setIsCustomVipPlat] = useState(false);

  // Calcular perfil libre automáticamente cuando cambia la cuenta seleccionada
  const calcularSiguientePerfilLibre = useCallback((masterId) => {
    if (!masterId) return '1';
    const ocupados = clientes
      .filter(c => c.idMaster === masterId && getDaysRemaining(c.fechaVencimiento) >= 0)
      .map(c => parseInt(c.perfil, 10))
      .filter(n => !isNaN(n));
    let sig = 1;
    while (ocupados.includes(sig)) sig++;
    return String(sig);
  }, [clientes]);

  useEffect(() => {
    if (!selectedMasterId && vipMasters.length > 0) {
      const firstId = vipMasters[0].id;
      setSelectedMasterId(firstId);
      setAssignedProfile(calcularSiguientePerfilLibre(firstId));
    }
  }, [vipMasters, selectedMasterId, calcularSiguientePerfilLibre]);

  const currentMaster = cuentasMaster.find(m => m.id === selectedMasterId) || vipMasters[0] || null;

  const clientesUnicos = useMemo(() => {
    const map = new Map();
    clientes.forEach(c => {
      if (c.telefono && c.nombre && !map.has(String(c.telefono))) {
        map.set(String(c.telefono), c);
      }
    });
    return Array.from(map.values());
  }, [clientes]);

  const sugerencias = useMemo(() => {
    if (!clientName.trim()) return clientesUnicos.slice(0, 15);
    const term = clientName.toLowerCase();
    return clientesUnicos.filter(c =>
      String(c.nombre).toLowerCase().includes(term) ||
      String(c.telefono).includes(term)
    ).slice(0, 15);
  }, [clientesUnicos, clientName]);

  const clientesFiltradosTabla = useMemo(() => {
    const term = searchClientTable.toLowerCase();
    return clientesUnicos.filter(c =>
      String(c.nombre).toLowerCase().includes(term) ||
      String(c.telefono).includes(term) ||
      String(c.servicio || '').toLowerCase().includes(term)
    ).slice(0, 12);
  }, [clientesUnicos, searchClientTable]);

  const todayStr = getToday().toISOString().split('T')[0];
  const calculatedExpiryStr = addDaysToDate(todayStr, giftDays);

  const previewVipMessage = useMemo(() => {
    return buildVipGiftMessage({
      clientName: clientName.trim() || 'Cliente Exclusivo',
      platformName: currentMaster?.plataforma || 'HBO Max',
      correo: currentMaster?.correo || 'cuenta@hbomax.com',
      clave: currentMaster?.clave || 'ClaveVIP123',
      perfil: assignedProfile || '1',
      pin: assignedPin,
      reglasVip,
      hideExpiry: hideExpiryInWa,
      fechaVencimientoStr: formatDateToLocal(calculatedExpiryStr),
      headerIdx: headerSeed,
      footerIdx: footerSeed
    });
  }, [clientName, currentMaster, assignedProfile, assignedPin, reglasVip, hideExpiryInWa, calculatedExpiryStr, headerSeed, footerSeed]);

  const handleSaveAndSendVipGift = async () => {
    if (!currentMaster) {
      showToast('Primero sube o selecciona una cuenta de HBO / Streaming para regalar', 'error');
      setSubTab('boveda');
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      showToast('Selecciona o escribe el nombre y WhatsApp del cliente', 'error');
      return;
    }

    const newGiftClient = {
      id: `C_${Date.now()}_VIP`,
      nombre: clientName.trim(),
      telefono: clientPhone.trim(),
      servicio: `${currentMaster.plataforma} (Regalo VIP)`,
      categoria: 'streaming',
      fechaInicio: todayStr,
      fechaVencimiento: calculatedExpiryStr,
      idIntegrante: integrantes[0]?.id || '',
      idMaster: currentMaster.id,
      perfil: assignedProfile || '1',
      pin: assignedPin || '',
      correoExterno: '',
      claveExterna: '',
      perfilExterno: '',
      proveedorKey: '',
      detallesLicencia: `Enganche VIP ${giftDays} días`
    };

    const msgToSend = previewVipMessage;

    setClientes(prev => [newGiftClient, ...prev]);
    showToast(`Regalo VIP (${giftDays} días) registrado en Google Sheets`);

    // Rotar semilla anti-spam para el siguiente cliente
    setHeaderSeed(Math.floor(Math.random() * CABECERAS_REGALO_VIP.length));
    setFooterSeed(Math.floor(Math.random() * CIERRES_REGALO_VIP.length));

    window.open(`https://wa.me/${codigoPais}${clientPhone.trim()}?text=${encodeURIComponent(msgToSend)}`, '_blank');
    await syncToSheets('guardarCliente', newGiftClient);
  };

  const handleSaveVipMaster = async (e) => {
    e.preventDefault();
    const isEditing = !!newVipAccount.id;
    const newId = isEditing ? newVipAccount.id : `MVIP_${Date.now()}`;
    const masterObj = { ...newVipAccount, id: newId };

    if (isEditing) {
      setCuentasMaster(prev => prev.map(m => m.id === newId ? masterObj : m));
    } else {
      setCuentasMaster(prev => [masterObj, ...prev]);
    }

    setSelectedMasterId(newId);
    setNewVipAccount({
      id: null,
      plataforma: 'HBO Max',
      correo: '',
      clave: '',
      limitePerfiles: 5,
      fechaRenovacion: addMonthsToDate(getToday().toISOString().split('T')[0], 1)
    });
    setIsCustomVipPlat(false);
    showToast(isEditing ? 'Cuenta VIP actualizada en Google Sheets' : 'Cuenta HBO / VIP guardada en Bóveda');
    await syncToSheets('guardarMaster', masterObj);
  };

  const handleDeleteVipMaster = async (id) => {
    setCuentasMaster(prev => prev.filter(m => m.id !== id));
    showToast('Cuenta VIP eliminada');
    await syncToSheets('eliminarMaster', { id });
  };

  const handleSaveVipConfig = async () => {
    const configObj = normalizePlantilla({
      id: VIP_CONFIG_ID,
      nombre: '__CONFIG_REGALOS_VIP_HBO__',
      categoriaCatalogo: 'ConfigVIP',
      precio: String(diasDefaultConfig || '15'),
      beneficios: mensajeConversion,
      reglas: reglasVip,
      ofrecer: []
    });
    const exists = plantillas.some(p => p.id === VIP_CONFIG_ID);
    if (exists) {
      setPlantillas(prev => prev.map(p => p.id === VIP_CONFIG_ID ? configObj : p));
    } else {
      setPlantillas(prev => [...prev, configObj]);
    }
    setGiftDays(parseInt(diasDefaultConfig, 10) || 15);
    showToast('Configuración de Regalos VIP guardada en Google Sheets');
    await syncToSheets('guardarPlantilla', serializePlantillaForSheets(configObj));
  };

  const handleSendConversionWhatsApp = (client) => {
    const cleanPlat = (client.servicio || 'HBO Max').replace(' (Regalo VIP)', '');
    const msg = mensajeConversion
      .replace(/{nombre}/gi, client.nombre || 'Cliente')
      .replace(/{producto}/gi, cleanPlat)
      .replace(/{negocio}/gi, parametros.nombreNegocio);
    window.open(`https://wa.me/${codigoPais}${client.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const regalosActivosList = useMemo(() => {
    return clientes.filter(c =>
      String(c.servicio || '').includes('(Regalo VIP)') ||
      String(c.idMaster || '').startsWith('MVIP_') ||
      String(c.detallesLicencia || '').includes('Enganche VIP')
    );
  }, [clientes]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CABECERA DEL MÓDULO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-wider mb-2">
            🕵️ Estrategia de Enganche Silencioso (Anti-Spam)
          </div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Gift className="w-8 h-8 mr-3 text-indigo-600" /> Regalos VIP (HBO Max y Streaming)
          </h1>
          <p className="text-slate-500 mt-1">
            Engancha a clientes exclusivos o que no ven tus estados regalándoles 10 o 15 días de HBO Max sin que parezca publicidad.
          </p>
        </div>

        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1">
          <button
            onClick={() => setSubTab('regalar')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${subTab === 'regalar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🎁 1. Enviar Regalo VIP
          </button>
          <button
            onClick={() => setSubTab('boveda')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${subTab === 'boveda' ? 'bg-purple-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🗄️ 2. Subir Cuentas HBO ({cuentasMaster.filter(m => String(m.id).startsWith('MVIP_')).length})
          </button>
          <button
            onClick={() => setSubTab('config')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${subTab === 'config' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            ⚙️ 3. Configurar Reglas
          </button>
        </div>
      </div>

      {/* SUB-PESTAÑA 1: ENVIAR REGALO VIP (10 / 15 DÍAS) */}
      {subTab === 'regalar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* PASO 1: SELECCIONAR CLIENTE */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-indigo-600" /> 1. Elige al Cliente Exclusivo o a Enganchar
                </h3>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                  ⚡ {clientesUnicos.length} en memoria
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Nombre del Cliente *</label>
                  <input
                    type="text"
                    className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold"
                    placeholder="Escribe una letra (Ej. J para José)..."
                    value={clientName}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                    onChange={(e) => { setClientName(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Tab' || e.key === 'Enter') && showSuggestions && sugerencias.length > 0) {
                        e.preventDefault();
                        setClientName(sugerencias[0].nombre);
                        setClientPhone(String(sugerencias[0].telefono));
                        setShowSuggestions(false);
                      }
                    }}
                  />
                  {showSuggestions && sugerencias.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-indigo-300 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                      {sugerencias.map(s => (
                        <div
                          key={s.id}
                          onMouseDown={() => {
                            setClientName(s.nombre);
                            setClientPhone(String(s.telefono));
                            setShowSuggestions(false);
                          }}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{s.nombre}</div>
                            <div className="text-[10px] text-slate-400">Último servicio: {s.servicio}</div>
                          </div>
                          <span className="text-xs font-mono text-slate-500">+{s.telefono}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">WhatsApp (Sin código de país) *</label>
                  <input
                    type="tel"
                    className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-mono font-bold"
                    placeholder="999888777"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {/* Mini selector rápido desde la base unificada */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">O selecciónalo con 1 clic de tu historial:</span>
                  <input
                    type="text"
                    placeholder="Filtrar lista rápida..."
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 outline-none focus:border-indigo-500"
                    value={searchClientTable}
                    onChange={(e) => setSearchClientTable(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {clientesFiltradosTabla.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClientName(c.nombre);
                        setClientPhone(String(c.telefono));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        clientPhone === String(c.telefono)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                      }`}
                    >
                      {c.nombre} <span className="opacity-70 font-normal">({c.servicio})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PASO 2: SELECCIONAR CUENTA HBO / VIP Y PERFIL */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h3 className="font-bold text-slate-800 flex items-center">
                  <MonitorPlay className="w-5 h-5 mr-2 text-purple-600" /> 2. Cuenta HBO / Streaming a Regalar
                </h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center text-xs font-bold text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-1.5 rounded"
                      checked={showAllMasters}
                      onChange={(e) => setShowAllMasters(e.target.checked)}
                    />
                    Mostrar también mis Cuentas Máster normales
                  </label>
                  <button
                    type="button"
                    onClick={() => setSubTab('boveda')}
                    className="text-xs font-bold text-purple-600 hover:underline"
                  >
                    + Subir Nueva Cuenta HBO
                  </button>
                </div>
              </div>

              {vipMasters.length === 0 ? (
                <div className="p-6 bg-purple-50 border-2 border-purple-200 border-dashed rounded-2xl text-center space-y-3">
                  <p className="text-sm font-bold text-purple-900">
                    Aún no has subido ninguna cuenta de HBO en tu Bóveda de Regalos VIP.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubTab('boveda')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm shadow"
                  >
                    Subir Mi Primera Cuenta HBO para Regalos
                  </button>
                </div>
              ) : (
                <>
                  <select
                    className="w-full border-2 border-purple-200 rounded-xl p-3 font-bold bg-purple-50/40 text-slate-800 focus:border-purple-500 outline-none"
                    value={currentMaster?.id || ''}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setSelectedMasterId(mId);
                      setAssignedProfile(calcularSiguientePerfilLibre(mId));
                    }}
                  >
                    {vipMasters.map(m => {
                      const ocupados = clientes.filter(c => c.idMaster === m.id && getDaysRemaining(c.fechaVencimiento) >= 0).length;
                      const limit = parseInt(m.limitePerfiles, 10) || 5;
                      return (
                        <option key={m.id} value={m.id}>
                          🎬 {m.plataforma} — {m.correo} (Libres: {Math.max(0, limit - ocupados)} de {limit})
                        </option>
                      );
                    })}
                  </select>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Nº de Perfil Asignado *</label>
                      <input
                        type="text"
                        className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-slate-50 focus:bg-white"
                        value={assignedProfile}
                        onChange={(e) => setAssignedProfile(e.target.value)}
                        placeholder="Ej. 1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">PIN del Perfil (Opcional)</label>
                      <input
                        type="text"
                        className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-slate-50 focus:bg-white"
                        value={assignedPin}
                        onChange={(e) => setAssignedPin(e.target.value)}
                        placeholder="Dejar vacío si no tiene PIN"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* PASO 3: DÍAS DE ENGANCHE (10 / 15 DÍAS) Y MODO SILENCIOSO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-emerald-600" /> 3. Días de Regalo y Modo Sorpresa Silencioso
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: '⚡ 7 Días', days: 7 },
                  { label: '🔥 10 Días', days: 10 },
                  { label: '👑 15 Días', days: 15 },
                  { label: '🌟 30 Días', days: 30 }
                ].map(item => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setGiftDays(item.days)}
                    className={`py-3 px-3 rounded-xl font-black text-xs border-2 transition-all ${
                      giftDays === item.days
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">O escribe días exactos:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    className="w-20 border-2 border-slate-300 rounded-xl p-1.5 text-center font-black text-sm bg-white"
                    value={giftDays}
                    onChange={(e) => setGiftDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  />
                  <span className="text-xs font-bold text-slate-500">días</span>
                </div>
                <div className="text-xs font-bold text-indigo-900 bg-indigo-100 px-3 py-1.5 rounded-xl">
                  🔔 Tu sistema te avisará el: <span className="font-black">{formatDateToLocal(calculatedExpiryStr)}</span>
                </div>
              </div>

              {/* INTERRUPTOR: ELLOS NO LO VAN A SABER */}
              <div
                onClick={() => setHideExpiryInWa(!hideExpiryInWa)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  hideExpiryInWa
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-amber-50/70 border-amber-300'
                }`}
              >
                <div>
                  <div className="font-black text-sm text-slate-800 flex items-center">
                    {hideExpiryInWa
                      ? '🕵️ Modo Sorpresa Silencioso ACTIVO (Ellos NO sabrán que es por ' + giftDays + ' días)'
                      : '📅 Fecha Visible en WhatsApp (El cliente verá la fecha de vencimiento)'}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {hideExpiryInWa
                      ? 'El mensaje de WhatsApp se enviará como un regalo VIP genuino sin mencionar los ' + giftDays + ' días, pero quedará agendado en tu base de datos para avisarte cuando venza.'
                      : 'El mensaje incluirá la línea de fecha de vencimiento (' + formatDateToLocal(calculatedExpiryStr) + ').'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hideExpiryInWa}
                  onChange={() => {}}
                  className="w-5 h-5 mt-1 accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* VISTA PREVIA ANTI-SPAM Y BOTÓN DE ENVÍO */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col h-full justify-between space-y-5">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 block">
                      30 Variaciones Anti-Spam Personales
                    </span>
                    <h3 className="text-lg font-bold">Vista Previa del Regalo VIP</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderSeed(prev => (prev + 1) % CABECERAS_REGALO_VIP.length);
                      setFooterSeed(prev => (prev + 1) % CIERRES_REGALO_VIP.length);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold flex items-center border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Rotar Saludo ({headerSeed + 1}/30)
                  </button>
                </div>

                <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-2xl p-4 font-sans text-xs text-indigo-50 whitespace-pre-wrap max-h-[420px] overflow-y-auto leading-relaxed">
                  {previewVipMessage}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAndSendVipGift}
                  disabled={syncStatus === 'sincronizando' || !currentMaster || !clientPhone.trim()}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white font-black rounded-2xl shadow-lg flex items-center justify-center text-base transition-all"
                >
                  <Gift className="w-5 h-5 mr-2" /> Registrar {giftDays} Días y Enviar Regalo VIP
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Descuenta el perfil automáticamente, agenda el vencimiento interno para el <strong>{formatDateToLocal(calculatedExpiryStr)}</strong> y abre WhatsApp con un saludo único.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 2: BÓVEDA DE CUENTAS HBO PARA REGALAR Y SEGUIMIENTO DE ENGANCHADOS */}
      {subTab === 'boveda' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-200">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-purple-600" /> Subir Cuenta de HBO Max (u otra plataforma) para Regalos VIP
            </h3>
            <form onSubmit={handleSaveVipMaster} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
              <div className="xl:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Plataforma</label>
                {!isCustomVipPlat ? (
                  <select
                    className="w-full border-2 border-purple-200 rounded-xl p-3 font-bold bg-white"
                    value={newVipAccount.plataforma}
                    onChange={(e) => {
                      if (e.target.value === 'OTRA') {
                        setIsCustomVipPlat(true);
                        setNewVipAccount({ ...newVipAccount, plataforma: '' });
                      } else {
                        setNewVipAccount({ ...newVipAccount, plataforma: e.target.value });
                      }
                    }}
                  >
                    <option value="HBO Max">HBO Max</option>
                    <option value="Netflix">Netflix</option>
                    <option value="Disney+">Disney+</option>
                    <option value="Amazon Prime">Amazon Prime</option>
                    <option value="Crunchyroll">Crunchyroll</option>
                    <option value="Paramount+">Paramount+</option>
                    <option value="OTRA">➕ Otra plataforma...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Nombre plataforma..."
                    className="w-full border-2 border-purple-200 rounded-xl p-3 font-bold"
                    value={newVipAccount.plataforma}
                    onChange={(e) => setNewVipAccount({ ...newVipAccount, plataforma: e.target.value })}
                  />
                )}
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Correo de la Cuenta HBO *</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@hbomax.com"
                  className="w-full border-2 border-slate-200 rounded-xl p-3 font-medium"
                  value={newVipAccount.correo}
                  onChange={(e) => setNewVipAccount({ ...newVipAccount, correo: e.target.value })}
                />
              </div>
              <div className="xl:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Contraseña *</label>
                <input
                  type="text"
                  required
                  placeholder="Clave123"
                  className="w-full border-2 border-slate-200 rounded-xl p-3 font-medium"
                  value={newVipAccount.clave}
                  onChange={(e) => setNewVipAccount({ ...newVipAccount, clave: e.target.value })}
                />
              </div>
              <div className="xl:col-span-1 flex gap-2">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Perfiles</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold"
                    value={newVipAccount.limitePerfiles}
                    onChange={(e) => setNewVipAccount({ ...newVipAccount, limitePerfiles: e.target.value })}
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Vence</label>
                  <input
                    type="date"
                    required
                    className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold text-xs"
                    value={newVipAccount.fechaRenovacion}
                    onChange={(e) => setNewVipAccount({ ...newVipAccount, fechaRenovacion: e.target.value })}
                  />
                </div>
              </div>
              <div className="xl:col-span-1">
                <button
                  type="submit"
                  disabled={syncStatus === 'sincronizando'}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl p-3 shadow-lg flex justify-center items-center disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 mr-1.5" /> {newVipAccount.id ? 'Actualizar' : 'Subir Cuenta'}
                </button>
              </div>
            </form>
          </div>

          {/* TARJETAS DE CUENTAS VIP SUBIDAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cuentasMaster.filter(m => String(m.id).startsWith('MVIP_')).map(master => {
              const asignados = clientes.filter(c => c.idMaster === master.id);
              const limit = parseInt(master.limitePerfiles, 10) || 5;
              const isFull = asignados.length >= limit;
              return (
                <div key={master.id} className="p-5 rounded-2xl bg-white border-2 border-purple-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[11px] font-black uppercase">
                        🎁 Bóveda Regalo VIP
                      </span>
                      <div className="font-black text-slate-800 text-lg mt-1">{master.plataforma}</div>
                      <div className="font-mono text-xs text-slate-600 mt-0.5">👤 {master.correo}</div>
                      <div className="font-mono text-xs text-slate-500">🔑 {master.clave}</div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setNewVipAccount(master)}
                        className="p-2 text-slate-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVipMaster(master.id)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                      <span>Perfiles de Regalo Ocupados</span>
                      <span className={isFull ? 'text-red-600' : 'text-emerald-600'}>{asignados.length} / {limit}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-purple-600'}`}
                        style={{ width: `${Math.min(100, (asignados.length / limit) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMasterId(master.id);
                      setAssignedProfile(calcularSiguientePerfilLibre(master.id));
                      setSubTab('regalar');
                    }}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    🎁 Usar esta cuenta para regalar ahora
                  </button>
                </div>
              );
            })}
          </div>

          {/* TABLA DE CLIENTES CON REGALO VIP ACTIVO (SEGUIMIENTO 10 / 15 DÍAS) */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Clientes con Regalos VIP en Curso (10 / 15 Días)</h3>
                <p className="text-xs text-slate-500">Cuando estén por cumplir sus días, envíales el mensaje de conversión con 1 clic para cerrar la venta.</p>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-black text-xs rounded-full">
                {regalosActivosList.length} Regalos Registrados
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Cliente Enganchado</th>
                    <th className="px-6 py-3.5">Cuenta / Perfil</th>
                    <th className="px-6 py-3.5">Fin de los 10/15 Días</th>
                    <th className="px-6 py-3.5 text-right">Convertir en Venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regalosActivosList.map(c => {
                    const daysLeft = getDaysRemaining(c.fechaVencimiento);
                    const masterObj = cuentasMaster.find(m => m.id === c.idMaster);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-slate-800">{c.nombre}</div>
                          <div className="text-xs text-slate-500">+{c.telefono}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-indigo-700">{c.servicio} (P{c.perfil || '1'})</div>
                          <div className="text-xs text-slate-500 font-mono">{masterObj?.correo || 'Cuenta VIP'}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-slate-700">{formatDateToLocal(c.fechaVencimiento)}</div>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${daysLeft < 0 ? 'bg-red-100 text-red-800' : daysLeft <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {daysLeft < 0 ? `Venció hace ${Math.abs(daysLeft)}d` : `Quedan ${daysLeft} días`}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleSendConversionWhatsApp(c)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Ofrecer Quedarse con el Perfil
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {regalosActivosList.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-medium">
                        Aún no has enviado ningún regalo VIP de 10 o 15 días.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 3: CONFIGURACIÓN DE REGLAS Y CONVERSIÓN */}
      {subTab === 'config' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 max-w-3xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-slate-600" /> Configuración del Módulo de Regalos VIP (HBO)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Personaliza las recomendaciones que se adjuntan al regalar la cuenta y el mensaje para convertir al cliente en comprador cuando pasen los 10 o 15 días.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Días de Enganche por Defecto
            </label>
            <input
              type="number"
              className="w-32 border-2 border-slate-200 rounded-xl p-3 font-black bg-slate-50"
              value={diasDefaultConfig}
              onChange={(e) => setDiasDefaultConfig(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              🛡️ Recomendaciones / Reglas que van dentro del Mensaje de Regalo VIP
            </label>
            <textarea
              rows="4"
              className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm"
              value={reglasVip}
              onChange={(e) => setReglasVip(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              🚀 Mensaje de Conversión (Para enviar cuando se cumplan los 10 o 15 días)
            </label>
            <textarea
              rows="4"
              className="w-full border-2 border-emerald-200 rounded-xl p-3 bg-emerald-50/30 text-sm"
              value={mensajeConversion}
              onChange={(e) => setMensajeConversion(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Puedes usar las etiquetas <strong>{'{nombre}'}</strong>, <strong>{'{producto}'}</strong> y <strong>{'{negocio}'}</strong>.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveVipConfig}
              disabled={syncStatus === 'sincronizando'}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow flex items-center disabled:opacity-50"
            >
              <Server className="w-4 h-4 mr-2" /> Guardar Configuración VIP en Google Sheets
            </button>
          </div>
        </div>
      )}
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
        setPlantillas((data.plantillas || []).map(normalizePlantilla));
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
       if (llave) {
           const updatedLlave = { ...llave, estado: 'Usada', idCliente: finalClient.id };
           setStockAV(prev => prev.map(k => k.id === idLlaveUsada ? updatedLlave : k));
           await syncToSheets('guardarLlave', updatedLlave);
       }
    }
    if (sendWhatsApp) triggerWhatsAppAlert(finalClient, 'venta', tipoCuenta, clientesAGuardar);
  };

  const triggerWhatsAppAlert = (client, type, tipoCuenta, arrayClientesMultiples = null, customOfferOptions = null) => {
    let msg = ``;
    const isMaster = !!client.idMaster;
    const fechaVencimiento = formatDateToLocal(client.fechaVencimiento);
    const configSoft = plantillas.find(p => p.nombre && client.servicio && String(p.nombre).trim().toLowerCase() === String(client.servicio).trim().toLowerCase());

    if (type === 'ofrecer_catalogo' && customOfferOptions?.productObj) {
      msg = buildCatalogOfferMessage({
        clientName: client.nombre,
        productObj: customOfferOptions.productObj,
        discountPercent: customOfferOptions.discountPercent || 0
      });
      window.open(`https://wa.me/${parametros.codigoPais}${client.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
      setWaActionModal(null);
      return;
    }

    if (type === 'ofrecer') {
      if (configSoft) {
        msg = buildCatalogOfferMessage({
          clientName: client.nombre,
          productObj: configSoft,
          discountPercent: 0
        });
      } else {
        const headerRandom = CABECERAS_ANTISPAM[Math.floor(Math.random() * CABECERAS_ANTISPAM.length)]
          .replace(/{nombre}/gi, client.nombre || 'Cliente')
          .replace(/{producto}/gi, client.servicio || 'nuestro servicio')
          .replace(/{negocio}/gi, parametros.nombreNegocio);
        const footerRandom = CIERRES_ANTISPAM[Math.floor(Math.random() * CIERRES_ANTISPAM.length)];
        msg = `${headerRandom}\n\n${footerRandom}`;
      }

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
    const matchedTemplate = plantillas.find(
      p => p.nombre && waActionModal.servicio && String(p.nombre).trim().toLowerCase() === String(waActionModal.servicio).trim().toLowerCase()
    );
    const [selectedCatalogId, setSelectedCatalogId] = useState(matchedTemplate?.id || plantillas[0]?.id || '');
    const [modalDiscount, setModalDiscount] = useState(0);

    const chosenCatalogProduct = plantillas.find(p => p.id === selectedCatalogId) || matchedTemplate || plantillas[0];

    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full animate-fadeIn max-h-[92vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center"><MessageCircle className="w-6 h-6 mr-2 text-green-500"/> Notificar a {waActionModal.nombre}</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Servicio actual: {waActionModal.servicio}</p>
            </div>
            <button onClick={() => setWaActionModal(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5"/></button>
          </div>

          {/* BLOQUE NUEVO: OFRECER CUALQUIER PLATAFORMA DEL CATÁLOGO CON DESCUENTO Y ANTI-SPAM */}
          {plantillas.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-3">
              <div className="text-xs font-black uppercase text-amber-900 flex items-center justify-between">
                <span>🚀 Ofrecer Plataforma del Catálogo</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px]">Anti-Spam 35x</span>
              </div>
              <select
                className="w-full border-2 border-amber-300 rounded-xl p-2.5 text-sm font-bold bg-white text-slate-800"
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
              >
                {plantillas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.precio ? `(S/ ${p.precio})` : ''}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 10, 15, 20].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setModalDiscount(d)}
                    className={`py-1.5 rounded-lg font-bold text-xs border ${
                      modalDiscount === d ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-700 border-amber-200'
                    }`}
                  >
                    {d === 0 ? 'Normal' : `-${d}%`}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => triggerWhatsAppAlert(waActionModal, 'ofrecer_catalogo', null, null, { productObj: chosenCatalogProduct, discountPercent: modalDiscount })}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow flex items-center justify-center"
              >
                <Star className="w-4 h-4 mr-1.5" /> Enviar Explicación + Oferta {modalDiscount > 0 ? `(-${modalDiscount}%)` : ''}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {waActionModal.categoria === 'software' ? (
              <>
                <button onClick={() => triggerWhatsAppAlert(waActionModal, 'ofrecer')} className="w-full p-4 bg-cyan-50 border-2 border-cyan-200 rounded-2xl flex items-center text-left hover:bg-cyan-100"><div className="bg-cyan-500 text-white p-2.5 rounded-xl mr-3"><Briefcase className="w-5 h-5"/></div><div><div className="font-bold text-cyan-900">Ofrecer {waActionModal.servicio} 🚀</div></div></button>
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
              {activeTab === 'catalogo' && <CatalogoOfertasView plantillas={plantillas} setPlantillas={setPlantillas} clientes={clientes} codigoPais={parametros.codigoPais} showToast={showToast} syncToSheets={syncToSheets} syncStatus={syncStatus} />}
              {activeTab === 'regalos_vip' && <RegalosVipHboView cuentasMaster={cuentasMaster} setCuentasMaster={setCuentasMaster} clientes={clientes} setClientes={setClientes} plantillas={plantillas} setPlantillas={setPlantillas} integrantes={integrantes} codigoPais={parametros.codigoPais} showToast={showToast} syncToSheets={syncToSheets} syncStatus={syncStatus} />}
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