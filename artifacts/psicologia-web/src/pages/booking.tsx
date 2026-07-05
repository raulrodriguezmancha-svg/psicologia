import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle, Clock, Euro } from "lucide-react";

const API = "/api";

type Service = { id: number; name: string; description: string; price: number; depositAmount: number; duration: number };
type Slot = { date: string; time: string; available: boolean };

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Calendar helpers ────────────────────────────────────────────────────────
const DAYS_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${parseInt(day, 10)} de ${MONTHS_ES[parseInt(m, 10) - 1]} de ${y}`;
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// ─── Step indicator ──────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ["Servicio", "Fecha y hora", "Tus datos", "Pago"];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              i < current && "bg-primary text-primary-foreground",
              i === current && "bg-primary text-primary-foreground ring-4 ring-primary/20",
              i > current && "bg-muted text-muted-foreground"
            )}>
              {i < current ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={cn("text-xs mt-1 hidden sm:block", i === current ? "text-primary font-medium" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("h-px w-12 sm:w-16 mx-1 mb-4", i < current ? "bg-primary" : "bg-muted")} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Booking() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const cancelled = params.get("cancelled") === "true";

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/services`)
      .then(r => r.json())
      .then(setServices)
      .catch(() => setError("Error al cargar los servicios. Recarga la página."));
  }, []);

  useEffect(() => {
    const preselect = params.get("service");
    if (preselect && services.length > 0) {
      const svc = services.find(s => s.id === parseInt(preselect, 10));
      if (svc) { setSelectedService(svc); setStep(1); }
    }
  }, [services]);

  useEffect(() => {
    if (step !== 1) return;
    setLoadingSlots(true);
    fetch(`${API}/availability?month=${monthKey(calYear, calMonth)}`)
      .then(r => r.json())
      .then(setSlots)
      .catch(() => setError("Error al cargar la disponibilidad."))
      .finally(() => setLoadingSlots(false));
  }, [step, calYear, calMonth]);

  // ─── Calendar data ────────────────────────────────────────────────────────
  const availableDates = new Set(slots.filter(s => s.available).map(s => s.date));

  function buildCalendarDays() {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cells: (number | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  const calDays = buildCalendarDays();
  const timesForDate = selectedDate ? slots.filter(s => s.date === selectedDate) : [];

  // ─── Submit booking ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Por favor completa nombre, email y teléfono.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const bookRes = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.name.trim(),
          clientEmail: form.email.trim(),
          clientPhone: form.phone.trim(),
          notes: form.notes.trim() || null,
          serviceId: selectedService.id,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
        }),
      });

      if (!bookRes.ok) {
        const err = await bookRes.json();
        setError(err.error ?? "Error al crear la reserva.");
        setSubmitting(false);
        return;
      }

      const booking = await bookRes.json();

      const checkoutRes = await fetch(`${API}/payments/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, depositAmount: selectedService.price === 0 ? 0 : (booking.depositAmount ?? selectedService.depositAmount) }),
      });

      if (!checkoutRes.ok) {
        const err = await checkoutRes.json();
        setError(err.error ?? "Error al crear la sesión de pago.");
        setSubmitting(false);
        return;
      }

      const { checkoutUrl } = await checkoutRes.json();
      window.location.href = checkoutUrl;
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background">
      <div className="bg-secondary/40 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground font-medium mb-3">Reservar sesión</h1>
          <p className="text-muted-foreground text-lg">Reserva online en pocos pasos.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {cancelled && (
          <div className="flex items-center gap-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 mb-8">
            <AlertCircle size={20} className="shrink-0" />
            <p>El pago fue cancelado. Puedes intentarlo de nuevo seleccionando tu cita.</p>
          </div>
        )}

        <Steps current={step} />

        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 mb-6">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ── Step 0: Seleccionar servicio ── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif text-foreground font-medium mb-6">¿Qué sesión necesitas?</h2>
            {services.length === 0 ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : (
              services.map(svc => (
                <Card
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep(1); }}
                  className={cn(
                    "cursor-pointer transition-all border-2 hover:border-primary hover:shadow-md",
                    selectedService?.id === svc.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-serif text-lg font-medium text-foreground">{svc.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{svc.description}</p>
                        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={14}/> {svc.duration} min</span>
                          {svc.depositAmount > 0 && <span className="flex items-center gap-1"><Euro size={14}/> Señal: {svc.depositAmount}€</span>}
                        </div>
                      </div>
                      <span className="text-primary font-semibold text-xl shrink-0">{svc.price === 0 ? "Gratuito" : `${svc.price}€`}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ── Step 1: Calendario ── */}
        {step === 1 && selectedService && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft size={16} /> Cambiar servicio
              </button>
              <div className="text-sm font-medium text-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                {selectedService.name} · {selectedService.price === 0 ? "Gratuito" : `${selectedService.depositAmount}€ señal`}
              </div>
            </div>

            <h2 className="text-2xl font-serif text-foreground font-medium mb-6">Elige fecha y hora</h2>

            {/* Month navigation */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="font-serif text-lg font-medium">
                    {MONTHS_ES[calMonth]} {calYear}
                  </h3>
                  <button
                    onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_ES.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>

                {/* Calendar days */}
                {loadingSlots ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24}/></div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {calDays.map((day, idx) => {
                      if (!day) return <div key={idx} />;
                      const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                      const isAvailable = availableDates.has(dateStr);
                      const isSelected = selectedDate === dateStr;
                      const isPast = new Date(dateStr) < new Date(new Date().toDateString());
                      return (
                        <button
                          key={idx}
                          disabled={!isAvailable || isPast}
                          onClick={() => { setSelectedDate(dateStr); setSelectedTime(null); }}
                          className={cn(
                            "aspect-square rounded-lg text-sm font-medium transition-all",
                            isSelected && "bg-primary text-primary-foreground",
                            !isSelected && isAvailable && !isPast && "hover:bg-primary/10 text-foreground",
                            (!isAvailable || isPast) && "text-muted-foreground/40 cursor-not-allowed"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block"/>&nbsp;Seleccionado</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary inline-block"/>&nbsp;Disponible</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/30 inline-block"/>&nbsp;No disponible</span>
                </div>
              </CardContent>
            </Card>

            {/* Time slots */}
            {selectedDate && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Horarios para el {formatDate(selectedDate)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {timesForDate.map(slot => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "py-2.5 px-3 rounded-lg text-sm font-medium border transition-all",
                          selectedTime === slot.time && "bg-primary text-primary-foreground border-primary",
                          selectedTime !== slot.time && slot.available && "border-border hover:border-primary hover:bg-primary/5",
                          !slot.available && "bg-muted/30 text-muted-foreground/40 border-muted/30 cursor-not-allowed"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={!selectedDate || !selectedTime}
              className="w-full rounded-full h-12"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* ── Step 2: Datos personales ── */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ChevronLeft size={16}/> Volver al calendario
            </button>

            <h2 className="text-2xl font-serif text-foreground font-medium mb-2">Tus datos</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Cita: <strong>{selectedService?.name}</strong> · {formatDate(selectedDate!)} · {selectedTime}
            </p>

            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input id="name" placeholder="Tu nombre y apellidos" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input id="phone" type="tel" placeholder="+34 600 000 000" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Motivo de consulta (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Cuéntame brevemente qué te trae (opcional). Todo es confidencial."
                    rows={4}
                    value={form.notes}
                    onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  />
                </div>
              </CardContent>
            </Card>

            {selectedService && selectedService.price > 0 && (
              <div className="mt-4 bg-secondary/30 rounded-xl p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Resumen del pago:</strong>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between"><span>Señal de reserva (se descuenta del total)</span><span className="font-medium text-foreground">{selectedService?.depositAmount}€</span></div>
                  <div className="flex justify-between text-xs"><span>Precio total de la sesión</span><span>{selectedService?.price}€</span></div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Tus datos están protegidos por el secreto profesional y el RGPD. Cancelación gratuita con 48 h de antelación.
            </p>

            <Button onClick={() => setStep(3)} disabled={!form.name || !form.email || !form.phone} className="w-full rounded-full h-12 mt-4">
              {selectedService?.price === 0 ? "Confirmar reserva" : "Revisar y pagar"}
            </Button>
          </div>
        )}

        {/* ── Step 3: Confirmación y pago ── */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ChevronLeft size={16}/> Volver
            </button>

            <h2 className="text-2xl font-serif text-foreground font-medium mb-6">Confirmación</h2>

            <Card className="mb-6">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-medium text-foreground mb-4">Detalles de tu reserva</h3>
                <div className="space-y-3 text-sm">
                  {[
                    ["Servicio", selectedService?.name],
                    ["Fecha", formatDate(selectedDate!)],
                    ["Hora", selectedTime],
                    ["Nombre", form.name],
                    ["Email", form.email],
                    ["Teléfono", form.phone],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>
                {form.notes && (
                  <div className="text-sm pt-2">
                    <span className="text-muted-foreground">Motivo:</span>
                    <p className="mt-1 text-foreground">{form.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                {selectedService?.price === 0 ? (
                  <div className="text-center">
                    <p className="text-lg font-medium text-foreground">Sesión gratuita</p>
                    <p className="text-sm text-muted-foreground mt-1">No se requiere pago. Tu cita se confirmará automáticamente.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-lg font-medium">
                      <span>Señal a pagar ahora</span>
                      <span className="text-primary text-2xl font-serif">{selectedService?.depositAmount}€</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Este importe se descontará del precio total ({selectedService?.price}€) en el momento de la sesión.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-full h-14 text-base"
            >
              {submitting ? (
                <><Loader2 className="animate-spin mr-2" size={18}/> Procesando...</>
              ) : selectedService?.price === 0 ? (
                "Confirmar reserva gratuita"
              ) : (
                `Pagar señal ${selectedService?.depositAmount}€ con Stripe`
              )}
            </Button>

            {selectedService && selectedService.price > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Pago seguro con Stripe. No almacenamos datos de tarjeta.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
