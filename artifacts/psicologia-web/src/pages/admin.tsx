import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LogOut, Star, Trash2, Eye, EyeOff, CheckCircle, AlertCircle, Calendar, Shield } from "lucide-react";

const API = "/api";

function authFetch(token: string, url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

type Booking = {
  id: number; clientName: string; clientEmail: string; clientPhone: string;
  serviceName: string | null; appointmentDate: string; appointmentTime: string;
  notes: string | null; status: string; depositPaid: boolean; depositAmount: number | null;
  createdAt: string;
};
type AdminReview = {
  id: number; authorName: string; rating: number; comment: string;
  approved: boolean; hidden: boolean; createdAt: string;
};
type AvailableSlot = { id: number; date: string; time: string };
type BlockedSlot = { id: number; date: string; time: string | null; reason: string | null };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente pago", confirmed: "Confirmada", completed: "Completada",
  cancelled: "Cancelada", no_show: "No asistió",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-gray-100 text-gray-800 border-gray-200",
};

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${parseInt(day,10)} ${MONTHS_ES[parseInt(m,10)-1].slice(0,3)} ${y}`;
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Error al iniciar sesión");
        return;
      }
      const { token } = await res.json();
      localStorage.setItem("admin_token", token);
      onLogin(token);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4">
            <Shield className="text-primary" size={28} />
          </div>
          <CardTitle className="font-serif text-2xl font-medium">Panel de Administración</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Alba García Santillana · Psicóloga</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-pass">Contraseña</Label>
              <Input id="admin-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle size={15}/> {error}
              </div>
            )}
            <Button type="submit" disabled={loading || !password} className="w-full rounded-full">
              {loading ? <><Loader2 className="animate-spin mr-2" size={16}/>Entrando...</> : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Reservas ─────────────────────────────────────────────────────────────────
function ReservasTab({ token }: { token: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filterStatus && filterStatus !== "all") qs.set("status", filterStatus);
    if (filterDateFrom) qs.set("dateFrom", filterDateFrom);
    if (filterDateTo) qs.set("dateTo", filterDateTo);
    const res = await authFetch(token, `${API}/admin/bookings?${qs}`);
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, [token, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    const res = await authFetch(token, `${API}/admin/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
      if (status === "completed") {
        setToast("✅ Cita completada. Se ha enviado al paciente el enlace para dejar su reseña.");
      } else {
        setToast("Estado actualizado correctamente");
      }
      setTimeout(() => setToast(null), 5000);
    }
    setUpdatingId(null);
  }

  const counts = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    pending: bookings.filter(b => b.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 rounded-xl p-4 text-sm">
          <CheckCircle size={16} className="shrink-0"/> {toast}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, color: "text-foreground" },
          { label: "Confirmadas", value: counts.confirmed, color: "text-blue-700" },
          { label: "Completadas", value: counts.completed, color: "text-green-700" },
          { label: "Pend. pago", value: counts.pending, color: "text-yellow-700" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-serif font-medium ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input type="date" className="h-9" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input type="date" className="h-9" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
            <Button size="sm" variant="outline" onClick={load} className="h-9">Buscar</Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={() => { setFilterStatus("all"); setFilterDateFrom(""); setFilterDateTo(""); }}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28}/></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No hay reservas con estos filtros.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <Card key={b.id} className="border-border/50 hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-4 items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{b.clientName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[b.status] ?? "bg-gray-100"}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {b.serviceName ?? "Sesión"} · {fmtDate(b.appointmentDate)} a las {b.appointmentTime}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {b.clientEmail} · {b.clientPhone}
                      {b.depositPaid && <span className="ml-2 text-green-700 font-medium">· Señal: {b.depositAmount}€ cobrada</span>}
                    </div>
                    {b.notes && (
                      <div className="text-xs text-muted-foreground mt-1 bg-secondary/30 rounded p-2 italic">"{b.notes}"</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {updatingId === b.id ? (
                      <Loader2 className="animate-spin text-primary" size={18}/>
                    ) : (
                      <Select value={b.status} onValueChange={val => updateStatus(b.id, val)}>
                        <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Horarios ─────────────────────────────────────────────────────────────────
function HorariosTab({ token }: { token: string }) {
  const [available, setAvailable] = useState<AvailableSlot[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ date: "", time: "" });
  const [newBlock, setNewBlock] = useState({ date: "", time: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const TIMES = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];

  async function load() {
    setLoading(true);
    const [aRes, bRes] = await Promise.all([
      authFetch(token, `${API}/admin/slots/available`),
      authFetch(token, `${API}/admin/slots/blocked`),
    ]);
    if (aRes.ok) setAvailable(await aRes.json());
    if (bRes.ok) setBlocked(await bRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [token]);

  async function addSlot() {
    if (!newSlot.date || !newSlot.time) return;
    setSaving(true);
    const res = await authFetch(token, `${API}/admin/slots/available`, { method: "POST", body: JSON.stringify(newSlot) });
    if (res.ok) { setNewSlot({ date: "", time: "" }); await load(); }
    setSaving(false);
  }

  async function deleteSlot(id: number) {
    await authFetch(token, `${API}/admin/slots/available/${id}`, { method: "DELETE" });
    setAvailable(s => s.filter(x => x.id !== id));
  }

  async function addBlock() {
    if (!newBlock.date) return;
    setSaving(true);
    const res = await authFetch(token, `${API}/admin/slots/blocked`, {
      method: "POST",
      body: JSON.stringify({ date: newBlock.date, time: newBlock.time || null, reason: newBlock.reason || null }),
    });
    if (res.ok) { setNewBlock({ date: "", time: "", reason: "" }); await load(); }
    setSaving(false);
  }

  async function deleteBlock(id: number) {
    await authFetch(token, `${API}/admin/slots/blocked/${id}`, { method: "DELETE" });
    setBlocked(s => s.filter(x => x.id !== id));
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28}/></div>;

  return (
    <div className="space-y-8">
      <div className="bg-secondary/30 rounded-xl p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Horario base automático:</strong> Lunes a viernes, 09:00–13:00 y 16:00–19:00.
        Usa los controles de abajo para añadir horas extra o bloquear días/franjas.
      </div>

      <div>
        <h3 className="font-serif text-xl font-medium text-foreground mb-3">Horarios adicionales</h3>
        <p className="text-sm text-muted-foreground mb-4">Añade franjas fuera del horario habitual (sábados, horas especiales...).</p>
        <Card className="mb-4">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Fecha</Label>
                <Input type="date" className="h-9 w-[160px]" value={newSlot.date} onChange={e => setNewSlot(s => ({...s, date: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hora</Label>
                <Select value={newSlot.time} onValueChange={v => setNewSlot(s => ({...s, time: v}))}>
                  <SelectTrigger className="h-9 w-[120px]"><SelectValue placeholder="--:--"/></SelectTrigger>
                  <SelectContent>{TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={addSlot} disabled={saving || !newSlot.date || !newSlot.time} className="h-9">
                {saving ? <Loader2 className="animate-spin" size={14}/> : "Añadir"}
              </Button>
            </div>
          </CardContent>
        </Card>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No hay horarios adicionales.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm">
                <Calendar size={13}/> {fmtDate(s.date)} {s.time}
                <button onClick={() => deleteSlot(s.id)} className="hover:text-destructive ml-1"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-serif text-xl font-medium text-foreground mb-3">Bloqueos y vacaciones</h3>
        <p className="text-sm text-muted-foreground mb-4">Bloquea días completos (deja hora vacía) o franjas concretas.</p>
        <Card className="mb-4">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Fecha *</Label>
                <Input type="date" className="h-9 w-[160px]" value={newBlock.date} onChange={e => setNewBlock(s => ({...s, date: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hora (vacío = día completo)</Label>
                <Select value={newBlock.time} onValueChange={v => setNewBlock(s => ({...s, time: v}))}>
                  <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Día completo"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Día completo</SelectItem>
                    {TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-[160px]">
                <Label className="text-xs">Motivo (opcional)</Label>
                <Input className="h-9" placeholder="Vacaciones, formación..." value={newBlock.reason} onChange={e => setNewBlock(s => ({...s, reason: e.target.value}))} />
              </div>
              <Button size="sm" variant="destructive" onClick={addBlock} disabled={saving || !newBlock.date} className="h-9">
                {saving ? <Loader2 className="animate-spin" size={14}/> : "Bloquear"}
              </Button>
            </div>
          </CardContent>
        </Card>
        {blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No hay bloqueos activos.</p>
        ) : (
          <div className="space-y-2">
            {blocked.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-red-800">
                    {fmtDate(b.date)}{b.time ? ` · ${b.time}` : " · Día completo"}
                  </span>
                  {b.reason && <span className="text-xs text-red-600 ml-2">({b.reason})</span>}
                </div>
                <button onClick={() => deleteBlock(b.id)} className="text-red-400 hover:text-red-700 ml-3">
                  <Trash2 size={15}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reseñas ──────────────────────────────────────────────────────────────────
function ResenasTab({ token }: { token: string }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    authFetch(token, `${API}/admin/reviews`)
      .then(r => r.json())
      .then(setReviews)
      .finally(() => setLoading(false));
  }, [token]);

  async function patch(id: number, updates: Partial<AdminReview>) {
    setUpdatingId(id);
    const res = await authFetch(token, `${API}/admin/reviews/${id}`, {
      method: "PATCH", body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setReviews(rs => rs.map(r => r.id === id ? updated : r));
    }
    setUpdatingId(null);
  }

  async function deleteReview(id: number) {
    if (!confirm("¿Eliminar esta reseña de forma permanente?")) return;
    setUpdatingId(id);
    await authFetch(token, `${API}/admin/reviews/${id}`, { method: "DELETE" });
    setReviews(rs => rs.filter(r => r.id !== id));
    setUpdatingId(null);
  }

  const pending = reviews.filter(r => !r.approved && !r.hidden);
  const approved = reviews.filter(r => r.approved && !r.hidden);
  const hidden = reviews.filter(r => r.hidden);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28}/></div>;

  if (reviews.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">No hay reseñas todavía. Aparecerán aquí cuando un paciente envíe la suya tras una cita completada.</div>;
  }

  function ReviewCard({ r }: { r: AdminReview }) {
    const isUpdating = updatingId === r.id;
    return (
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">{r.authorName}</span>
                <div className="flex">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= r.rating ? "fill-accent text-accent" : "text-muted"}/>)}
                </div>
                {r.approved && !r.hidden && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Publicada</Badge>}
                {!r.approved && !r.hidden && <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>}
                {r.hidden && <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">Oculta</Badge>}
              </div>
              <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString("es-ES", { day:"numeric", month:"short", year:"numeric" })}
              </p>
            </div>
            {isUpdating ? (
              <Loader2 className="animate-spin text-primary shrink-0" size={18}/>
            ) : (
              <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                {!r.approved && !r.hidden && (
                  <Button size="sm" variant="outline" onClick={() => patch(r.id, { approved: true })} className="h-8 text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50">
                    <CheckCircle size={13}/> Aprobar
                  </Button>
                )}
                {r.approved && !r.hidden && (
                  <Button size="sm" variant="outline" onClick={() => patch(r.id, { hidden: true, approved: false })} className="h-8 text-xs gap-1">
                    <EyeOff size={13}/> Ocultar
                  </Button>
                )}
                {r.hidden && (
                  <Button size="sm" variant="outline" onClick={() => patch(r.id, { hidden: false, approved: true })} className="h-8 text-xs gap-1">
                    <Eye size={13}/> Restaurar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteReview(r.id)} className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10">
                  <Trash2 size={13}/> Eliminar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Pendientes", value: pending.length, color: "text-yellow-700" },
          { label: "Publicadas", value: approved.length, color: "text-green-700" },
          { label: "Ocultas", value: hidden.length, color: "text-gray-600" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-serif font-medium ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {pending.length > 0 && (
        <div>
          <h3 className="font-medium text-foreground mb-3">Pendientes de revisión ({pending.length})</h3>
          <div className="space-y-3">{pending.map(r => <ReviewCard key={r.id} r={r}/>)}</div>
        </div>
      )}
      {approved.length > 0 && (
        <div>
          <h3 className="font-medium text-foreground mb-3">Publicadas ({approved.length})</h3>
          <div className="space-y-3">{approved.map(r => <ReviewCard key={r.id} r={r}/>)}</div>
        </div>
      )}
      {hidden.length > 0 && (
        <div>
          <h3 className="font-medium text-muted-foreground mb-3">Ocultas ({hidden.length})</h3>
          <div className="space-y-3">{hidden.map(r => <ReviewCard key={r.id} r={r}/>)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield size={16} className="text-primary"/>
            </div>
            <span className="font-serif font-medium text-foreground">Admin · Alba García Santillana</span>
          </div>
          <Button size="sm" variant="ghost" onClick={onLogout} className="gap-2 text-muted-foreground">
            <LogOut size={15}/> Cerrar sesión
          </Button>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="reservas">
          <TabsList className="mb-8 bg-card border border-border">
            <TabsTrigger value="reservas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reservas</TabsTrigger>
            <TabsTrigger value="horarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Horarios</TabsTrigger>
            <TabsTrigger value="resenas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reseñas</TabsTrigger>
          </TabsList>
          <TabsContent value="reservas"><ReservasTab token={token}/></TabsContent>
          <TabsContent value="horarios"><HorariosTab token={token}/></TabsContent>
          <TabsContent value="resenas"><ResenasTab token={token}/></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") ?? "");

  function handleLogin(newToken: string) {
    localStorage.setItem("admin_token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    setToken("");
  }

  if (!token) return <LoginForm onLogin={handleLogin}/>;
  return <AdminDashboard token={token} onLogout={handleLogout}/>;
}
