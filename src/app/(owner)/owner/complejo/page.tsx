"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";
import { MapPin, Phone, Clock, Star, Edit, Plus, Loader, X, Save } from "lucide-react";

interface Complex {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  ciudad: string;
  direccion: string;
  telefono: string | null;
  whatsapp: string;
  horario_abierto: string;
  horario_cierre: string;
  rating_promedio: number | null;
  total_reviews: number;
  activo: boolean;
  deporte_principal: string;
  deportes: string[];
  servicios: string[];
}

const DEPORTES = ["futbol","padel","tenis","voley","basquet"];
const SERVICIOS_OPC = ["Vestuarios","Estacionamiento","Bar/Cantina","WiFi","Iluminación LED","Aire acondicionado","Alquiler de equipos","Cafetería","Seguridad"];

const glassInput = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "10px",
  color: "white",
  width: "100%",
  padding: "10px 14px",
  outline: "none",
} as React.CSSProperties;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}

export default function OwnerComplejoPage() {
  const { user, loading: authLoading } = useAuth();
  const [complejos, setComplejos] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Complex | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = { nombre:"", descripcion:"", ciudad:"Catamarca", direccion:"", telefono:"", whatsapp:"", horario_abierto:"08:00", horario_cierre:"22:00", deporte_principal:"futbol", deportes:["futbol"] as string[], servicios:[] as string[] };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { if (user) fetchComplejos(); }, [user]);

  const fetchComplejos = async () => {
    const { data } = await supabase.from("complexes").select("*").eq("owner_id", user!.id) as { data: Complex[] | null };
    setComplejos(data || []);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setShowModal(true); };
  const openEdit = (c: Complex) => {
    setEditing(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion || "", ciudad: c.ciudad, direccion: c.direccion, telefono: c.telefono || "", whatsapp: c.whatsapp, horario_abierto: c.horario_abierto, horario_cierre: c.horario_cierre, deporte_principal: c.deporte_principal, deportes: c.deportes || [], servicios: c.servicios || [] });
    setError(""); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.direccion || !form.whatsapp) { setError("Nombre, dirección y WhatsApp son obligatorios."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, slug: slugify(form.nombre), owner_id: user!.id, activo: true, lat: -28.4696, lng: -65.7852 };
      if (editing) {
        const { error: e } = await supabaseMut.from("complexes").update(payload).eq("id", editing.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabaseMut.from("complexes").insert(payload);
        if (e) throw e;
      }
      await fetchComplejos();
      setShowModal(false);
    } catch (e: unknown) {
      setError((e as { message?: string }).message || "Error al guardar.");
    } finally { setSaving(false); }
  };

  const toggleDeporte = (d: string) => setForm(f => ({ ...f, deportes: f.deportes.includes(d) ? f.deportes.filter(x=>x!==d) : [...f.deportes, d] }));
  const toggleServicio = (s: string) => setForm(f => ({ ...f, servicios: f.servicios.includes(s) ? f.servicios.filter(x=>x!==s) : [...f.servicios, s] }));

  if (authLoading || loading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-rodeo-lime" size={32}/></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase mb-1">Panel de Control</p>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mi Complejo</h1>
        </div>
        <button onClick={openCreate} style={{ background:"rgba(200,255,0,0.9)", borderRadius:"12px" }} className="flex items-center gap-2 px-4 py-2.5 text-rodeo-dark font-black text-sm">
          <Plus size={16}/> Nuevo Complejo
        </button>
      </div>

      {complejos.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px" }} className="p-12 text-center space-y-4">
          <p className="text-rodeo-cream/50 text-sm">No tenés complejos creados todavía.</p>
          <button onClick={openCreate} style={{ background:"rgba(200,255,0,0.9)", borderRadius:"12px" }} className="px-6 py-2.5 text-rodeo-dark font-black text-sm inline-flex items-center gap-2"><Plus size={16}/>Crear mi primer complejo</button>
        </div>
      ) : (
        <div className="space-y-5">
          {complejos.map((c) => (
            <motion.div key={c.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px" }} className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white uppercase">{c.nombre}</h2>
                  <p className="text-sm text-rodeo-cream/50 mt-1">{c.descripcion}</p>
                </div>
                <button onClick={()=>openEdit(c)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px" }} className="p-2.5 hover:bg-white/10 transition-all shrink-0">
                  <Edit size={16} className="text-rodeo-lime"/>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: MapPin, label:"Ubicación", val:`${c.ciudad}` },
                  { icon: Clock, label:"Horario", val:`${c.horario_abierto} – ${c.horario_cierre}` },
                  { icon: Star, label:"Rating", val: c.rating_promedio ? `${c.rating_promedio.toFixed(1)}/5 (${c.total_reviews})` : "Sin reseñas" },
                  { icon: Phone, label:"WhatsApp", val: c.whatsapp },
                ].map(({icon:Icon,label,val})=>(
                  <div key={label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px" }} className="p-3">
                    <div className="flex items-center gap-1.5 mb-1"><Icon size={12} className="text-rodeo-lime"/><p className="text-[10px] text-rodeo-cream/40 uppercase tracking-wide">{label}</p></div>
                    <p className="text-xs font-bold text-white truncate">{val}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(c.deportes||[]).map(d=>(
                  <span key={d} style={{ background:"rgba(200,255,0,0.1)", border:"1px solid rgba(200,255,0,0.2)", borderRadius:"8px" }} className="text-[10px] font-bold text-rodeo-lime px-2 py-1 uppercase">{d}</span>
                ))}
                {(c.servicios||[]).map(s=>(
                  <span key={s} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px" }} className="text-[10px] text-rodeo-cream/50 px-2 py-1">{s}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" onClick={()=>setShowModal(false)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}} transition={{type:"spring",stiffness:400,damping:30}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div style={{ background:"linear-gradient(160deg,#0D1F10,#0A1A0D)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"24px", maxHeight:"90vh", width:"100%", maxWidth:"560px" }} className="overflow-y-auto">
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">{editing ? "Editar complejo" : "Nuevo complejo"}</h3>
                    <button onClick={()=>setShowModal(false)} style={{ background:"rgba(255,255,255,0.08)", borderRadius:"10px" }} className="w-8 h-8 flex items-center justify-center hover:bg-white/15">
                      <X size={16} className="text-white"/>
                    </button>
                  </div>

                  {[
                    { label:"Nombre del complejo *", key:"nombre", type:"text", placeholder:"Ej: Sportivo Central" },
                    { label:"Ciudad", key:"ciudad", type:"text", placeholder:"Catamarca" },
                    { label:"Dirección *", key:"direccion", type:"text", placeholder:"Av. Libertad 1234" },
                    { label:"WhatsApp * (solo números, ej: 5493834431234)", key:"whatsapp", type:"text", placeholder:"5493834431234" },
                    { label:"Teléfono", key:"telefono", type:"text", placeholder:"+54 383 443-1234" },
                  ].map(({label,key,type,placeholder})=>(
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">{label}</label>
                      <input type={type} placeholder={placeholder} value={(form as Record<string,any>)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={glassInput}/>
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Descripción</label>
                    <textarea rows={3} placeholder="Describí tu complejo..." value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} style={{...glassInput,resize:"none"}}/>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[{label:"Abre",key:"horario_abierto"},{label:"Cierra",key:"horario_cierre"}].map(({label,key})=>(
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">{label}</label>
                        <input type="time" value={(form as Record<string,any>)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={glassInput}/>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Deportes</label>
                    <div className="flex flex-wrap gap-2">
                      {DEPORTES.map(d=>{
                        const active = form.deportes.includes(d);
                        return <button key={d} type="button" onClick={()=>toggleDeporte(d)} style={{ background: active?"rgba(200,255,0,0.2)":"rgba(255,255,255,0.05)", border:`1px solid ${active?"rgba(200,255,0,0.4)":"rgba(255,255,255,0.1)"}`, borderRadius:"8px" }} className={`px-3 py-1.5 text-xs font-bold capitalize transition-all ${active?"text-rodeo-lime":"text-rodeo-cream/50"}`}>{d}</button>;
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Servicios</label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICIOS_OPC.map(s=>{
                        const active = form.servicios.includes(s);
                        return <button key={s} type="button" onClick={()=>toggleServicio(s)} style={{ background: active?"rgba(200,255,0,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${active?"rgba(200,255,0,0.25)":"rgba(255,255,255,0.08)"}`, borderRadius:"8px" }} className={`px-3 py-1.5 text-xs transition-all ${active?"text-rodeo-lime font-bold":"text-rodeo-cream/50"}`}>{s}</button>;
                      })}
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                  <button onClick={handleSave} disabled={saving} style={{ background:"rgba(200,255,0,0.9)", borderRadius:"12px" }} className="w-full py-3 text-rodeo-dark font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Loader size={16} className="animate-spin"/> : <Save size={16}/>}
                    {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear complejo"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
