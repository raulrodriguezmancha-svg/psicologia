import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Clock, Euro, Info, Laptop, Loader2 } from "lucide-react";

type Service = { id: number; name: string; description: string; duration: number; price: number; depositAmount: number };

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then(r => r.json())
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background">
      <div className="bg-secondary/40 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground font-medium mb-6">
            Mis Servicios
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Diferentes modalidades de acompañamiento terapéutico para adaptarse
            a tu situación personal, disponibilidad y necesidades.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {services.map((service) => (
            <Card
              key={service.id}
              className="flex flex-col border-border/50 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-2xl font-serif font-medium">
                    {service.name}
                  </CardTitle>
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-lg font-medium shrink-0 ${service.price === 0 ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                    {service.price === 0 ? "Gratis" : `${service.price}€`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} />
                    {service.duration} min
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Euro size={16} />
                    {service.price === 0 ? "Sin reserva" : `Reserva: ${service.depositAmount}€`}
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <span className="flex items-center text-xs font-medium text-primary">
                    <Laptop size={14} className="mr-1" /> 100% Online
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>

                <div className="mt-6 flex items-start gap-2 bg-secondary/30 p-3 rounded-lg text-sm text-muted-foreground">
                  <Info size={18} className="text-primary mt-0.5 shrink-0" />
                  <p>
                    {service.price === 0
                      ? "Sesión gratuita. Cancelación gratuita con 48h de antelación."
                      : "El importe de la reserva se descontará del precio total de la sesión. Cancelación gratuita con 48h de antelación."}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link
                  href={`/reservar?service=${service.id}`}
                  className="w-full"
                >
                  <Button className="w-full rounded-full">
                    {service.price === 0 ? "Reservar gratis" : "Reservar esta sesión"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
