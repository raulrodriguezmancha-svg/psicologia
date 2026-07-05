import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, Calendar, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API = "/api";

type Booking = {
  id: number;
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  depositAmount: number;
  status: string;
};

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${parseInt(day, 10)} de ${MONTHS_ES[parseInt(m, 10) - 1]} de ${y}`;
}

export default function BookingConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("booking_id");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) { setError("No se encontró el identificador de reserva."); setLoading(false); return; }

    fetch(`${API}/bookings/${bookingId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setBooking({ ...data, serviceName: data.serviceName ?? "Sesión de psicología" }))
      .catch(() => setError("No se pudo cargar la información de la reserva."))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle size={48} className="text-destructive" />
        <p className="text-center text-muted-foreground">{error ?? "Reserva no encontrada."}</p>
        <Link href="/reservar"><Button variant="outline" className="rounded-full">Volver a reservar</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background flex items-start justify-center py-16 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground font-medium mb-3">
            ¡Reserva confirmada!
          </h1>
          <p className="text-muted-foreground text-lg">
            Tu cita ha quedado registrada. Recibirás un email de confirmación en breve.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-primary shrink-0" size={20} />
              <h2 className="font-serif text-lg font-medium">Detalles de tu cita</h2>
            </div>
            {[
              ["Nombre", booking.clientName],
              ["Servicio", booking.serviceName],
              ["Fecha", formatDate(booking.appointmentDate)],
              ["Hora", booking.appointmentTime],
              ...(booking.depositAmount > 0 ? [["Señal abonada", `${booking.depositAmount}€`]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground text-right">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="bg-secondary/40 rounded-2xl p-6 text-center text-sm text-muted-foreground mb-8">
          <p className="font-medium text-foreground mb-2">¿Qué pasa ahora?</p>
          <p>Recibirás el enlace de videollamada por email antes de la sesión. Si necesitas cancelar, hazlo con al menos <strong>48 horas de antelación</strong>.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full rounded-full">Volver al inicio</Button>
          </Link>
          <Link href="/servicios" className="flex-1">
            <Button className="w-full rounded-full">
              Ver otros servicios <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
