"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";
import { MapPin, Phone, Clock, Star, Edit, Plus, Loader, X, Save, Upload, Image as ImageIcon, Navigation } from "lucide-react";
import { CIUDADES_DISPONIBLES } from "@/lib/context/CityContext";

// Leaflet sólo funciona en el cliente
const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "260px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
      className="flex items-center justify-center">
      <Loader size={20} className="animate-spin text-rodeo-lime/50" />
    </div>
  ),
});

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
  imagen_principal: string | null;
  galeria: string[] | null;
  lat: number | null;
  lng: number | null;
}

// Coordenadas por defecto de cada ciudad
const CIUDAD_COORDS: Record<string, { lat: number; lng: number }> = {
  Catamarca:     { lat: -28.4696, lng: -65.7852 },
  Tucumán:       { lat: -26.8083, lng: -65.2176 },
  Córdoba:       { lat: -31.4201, lng: -64.1888 },
  Salta:         { lat: -24.7821, lng: -65.4232 },
  "Buenos Aires": { lat: -34.6037, lng: -58.3816 },
  Mendoza:       { lat: -32.8895, lng: -68.8458 },
  Rosario:       { lat: -32.9468, lng: -60.6393 },
};

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
  const { user, profile, loading: authLoading } = useAuth();
  const [complejos, setComplejos] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Complex | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const defaultCiudad = profile?.ciudad || "Catamarca";
  const defaultCoords = CIUDAD_COORDS[defaultCiudad] ?? { lat: -28.4696, lng: -65.7852 };
  const emptyForm = {
    nombre:"", descripcion:"", ciudad: defaultCiudad, direccion:"", telefono:"", whatsapp:"",
    horario_abierto:"08:00", horario_cierre:"22:00",
    deporte_principal:"futbol", deportes:["futbol"] as string[], servicios:[] as string[],
    imagen_principal:"" as string, galeria:[] as string[],
    lat: defaultCoords.lat, lng: defaultCoords.lng,
  };
  const [form, setForm] = useState(emptyForm);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Cuando cambia la ciudad, centrar el mapa en esa ciudad (solo si no se movió manualmente)
  const handleCiudadChange = useCallback((ciudad: string) => {
    const coords = CIUDAD_COORDS[ciudad];
    if (coords) {
      setForm(f => ({ ...f, ciudad, lat: coords.lat, lng: coords.lng }));
    } else {
      setForm(f => ({ ...f, ciudad }));
    }
  }, []);

  useEffect(() => { if (user) fetchComplejos(); }, [user]);

  const fetchComplejos = async () => {
    const { data } = await supabase.from("complexes").select("*").eq("owner_id", user!.id) as { data: Complex[] | null };
    setComplejos(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    const coords = CIUDAD_COORDS[defaultCiudad] ?? { lat: -28.4696, lng: -65.7852 };
    setEditing(null);
    setForm({ ...emptyForm, lat: coords.lat, lng: coords.lng });
    setError(""); setShowModal(true);
  };
  const openEdit = (c: Complex) => {
    setEditing(c);
    const fallback = CIUDAD_COORDS[c.ciudad] ?? { lat: -28.4696, lng: -65.7852 };
    setForm({
      nombre: c.nombre, descripcion: c.descripcion || "", ciudad: c.ciudad,
      direccion: c.direccion, telefono: c.telefono || "", whatsapp: c.whatsapp,
      horario_abierto: c.horario_abierto, horario_cierre: c.horario_cierre,
      deporte_principal: c.deporte_principal, deportes: c.deportes || [],
      servicios: c.servicios || [], imagen_principal: c.imagen_principal || "",
      galeria: c.galeria || [],
      lat: c.lat ?? fallback.lat,
      lng: c.lng ?? fallback.lng,
    });
    setError(""); setShowModal(true);
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error("No autenticado");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `complex-images/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error: upErr } = await supabaseMut.storage.from("app-media").upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) throw upErr;
    const { data } = supabaseMut.storage.from("app-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleMainUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar 5MB."); return; }
    setUploadingMain(true); setError("");
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, imagen_principal: url }));
    } catch (err) {
      setError((err as { message?: string }).message || "Error al subir imagen.");
    } finally { setUploadingMain(false); }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingGallery(true); setError("");
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setForm(f => ({ ...f, galeria: [...f.galeria, ...urls] }));
    } catch (err) {
      setError((err as { message?: string }).message || "Error al subir imágenes.");
    } finally { setUploadingGallery(false); e.target.value = ""; }
  };

  const removeGalleryImage = (url: string) => setForm(f => ({ ...f, galeria: f.galeria.filter(u => u !== url) }));

  const handleSave = async () => {
    if (!form.nombre || !form.direccion || !form.whatsapp) { setError("Nombre, dirección y WhatsApp son obligatorios."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        imagen_principal: form.imagen_principal || null,
        slug: slugify(form.nombre),
        owner_id: user!.id,
        activo: true,
        lat: form.lat,
        lng: form.lng,
      };
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
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "44px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">Mi Complejo</h1>
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
                  <h2 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "24px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white">{c.nombre}</h2>
                  <p className="text-sm text-rodeo-cream/50 mt-1">{c.descripcion}</p>
                </div>
                <button onClick={()=>openEdit(c)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px" }} className="p-2.5 hover:bg-white/10 transition-all shrink-0">
                  <Edit size={16} className="text-rodeo-lime"/>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: MapPin, label:"Ubicación", val:`${c.ciudad}`, href: c.lat && c.lng ? `https://maps.google.com/?q=${c.lat},${c.lng}` : null },
                  { icon: Clock, label:"Horario", val:`${c.horario_abierto} – ${c.horario_cierre}`, href: null },
                  { icon: Star, label:"Rating", val: c.rating_promedio ? `${c.rating_promedio.toFixed(1)}/5 (${c.total_reviews})` : "Sin reseñas", href: null },
                  { icon: Phone, label:"WhatsApp", val: c.whatsapp, href: null },
                ].map(({icon:Icon,label,val,href})=>(
                  <div key={label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px" }} className="p-3">
                    <div className="flex items-center gap-1.5 mb-1"><Icon size={12} className="text-rodeo-lime"/><p className="text-[10px] text-rodeo-cream/40 uppercase tracking-wide">{label}</p></div>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-rodeo-lime underline underline-offset-2 truncate block hover:text-white transition-colors">{val} ↗</a>
                    ) : (
                      <p className="text-xs font-bold text-white truncate">{val}</p>
                    )}
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
                    <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Ciudad *</label>
                    <select value={form.ciudad} onChange={e => handleCiudadChange(e.target.value)} style={glassInput} className="cursor-pointer">
                      {CIUDADES_DISPONIBLES.map(c => (
                        <option key={c.ciudadCorta} value={c.ciudadCorta} style={{ background: "#1A120B" }}>
                          {c.ciudadCorta} · {c.provincia}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mapa de ubicación */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest flex items-center gap-1.5">
                        <Navigation size={11} className="text-rodeo-lime" />
                        Ubicación en el mapa *
                      </label>
                      <span className="text-[10px] text-rodeo-cream/30 font-mono">
                        {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                      </span>
                    </div>
                    <MapPicker
                      lat={form.lat}
                      lng={form.lng}
                      onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
                      height="260px"
                    />
                    <p className="text-[10px] text-rodeo-cream/30 leading-relaxed">
                      Hacé zoom y mové el marcador al lugar exacto de tu complejo. Podés buscar la dirección en el mapa y hacer click donde está.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Descripción</label>
                    <textarea rows={3} placeholder="Describí tu complejo..." value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} style={{...glassInput,resize:"none"}}/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Imagen principal</label>
                    {form.imagen_principal ? (
                      <div className="relative group" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <img src={form.imagen_principal} alt="Imagen principal" className="w-full h-40 object-cover" />
                        <button type="button" onClick={()=>setForm(f=>({...f, imagen_principal: ""}))} style={{ background:"rgba(0,0,0,0.7)", borderRadius:"8px" }} className="absolute top-2 right-2 p-1.5 text-white hover:bg-red-500/80 transition-colors">
                          <X size={14}/>
                        </button>
                      </div>
                    ) : (
                      <label style={{ background:"rgba(255,255,255,0.04)", border:"1px dashed rgba(255,255,255,0.18)", borderRadius:"12px" }} className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer hover:bg-white/8 transition-colors">
                        {uploadingMain ? (
                          <><Loader size={18} className="animate-spin text-rodeo-lime"/><span className="text-xs text-rodeo-cream/60">Subiendo...</span></>
                        ) : (
                          <><Upload size={18} className="text-rodeo-lime"/><span className="text-xs text-rodeo-cream/60">Click para subir (máx 5MB)</span></>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleMainUpload} disabled={uploadingMain}/>
                      </label>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Galería ({form.galeria.length})</label>
                    {form.galeria.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {form.galeria.map(url => (
                          <div key={url} className="relative group" style={{ borderRadius:"10px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)" }}>
                            <img src={url} alt="" className="w-full h-20 object-cover"/>
                            <button type="button" onClick={()=>removeGalleryImage(url)} style={{ background:"rgba(0,0,0,0.75)", borderRadius:"6px" }} className="absolute top-1 right-1 p-1 text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100">
                              <X size={10}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label style={{ background:"rgba(255,255,255,0.04)", border:"1px dashed rgba(255,255,255,0.18)", borderRadius:"12px" }} className="flex items-center justify-center gap-2 py-4 cursor-pointer hover:bg-white/8 transition-colors">
                      {uploadingGallery ? (
                        <><Loader size={14} className="animate-spin text-rodeo-lime"/><span className="text-xs text-rodeo-cream/60">Subiendo...</span></>
                      ) : (
                        <><ImageIcon size={14} className="text-rodeo-lime"/><span className="text-xs text-rodeo-cream/60">Agregar fotos</span></>
                      )}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery}/>
                    </label>
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
