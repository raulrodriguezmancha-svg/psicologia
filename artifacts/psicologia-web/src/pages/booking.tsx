import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ExternalLink, Mail, Laptop } from "lucide-react";
import { SERVICES, CALENDLY_URL, CONTACT_EMAIL } from "@/data/static";

export default function Booking() {
  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background">
      <div className="bg-secondary/40 py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground font-medium mb-4">
            Reservar sesión
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Elige el tipo de sesión que necesitas y reserva directamente en mi
            calendario online. Es rápido y sencillo.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {SERVICES.map((service) => (
            <Card
              key={service.id}
              className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-serif text-lg font-medium text-foreground leading-snug">
                    {service.name}
                  </h3>
                  <span className="text-primary font-semibold text-lg shrink-0 ml-2">
                    {service.price}€
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {service.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Laptop size={14} /> Online
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full"
                >
                  <Button className="w-full rounded-full mt-4">
                    Reservar esta sesión{" "}
                    <ExternalLink size={14} className="ml-2" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-secondary/40 rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif font-medium text-foreground mb-3">
            ¿Tienes dudas antes de reservar?
          </h2>
          <p className="text-muted-foreground mb-6">
            Puedes escribirme un email y te respondo en menos de 24 horas.
            Cuéntame brevemente qué te trae y vemos juntos cómo puedo ayudarte.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`}>
            <Button variant="outline" className="rounded-full px-8">
              <Mail size={16} className="mr-2" />
              Escribirme un email
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-6">
            Toda la información es confidencial y está protegida por el secreto
            profesional.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            {
              step: "1",
              title: "Elige tu sesión",
              desc: "Selecciona el tipo de sesión que mejor se adapta a lo que buscas.",
            },
            {
              step: "2",
              title: "Elige día y hora",
              desc: "Reserva en mi calendario el momento que mejor te venga.",
            },
            {
              step: "3",
              title: "Recibes confirmación",
              desc: "Te envío el enlace de videollamada y nos vemos en la sesión.",
            },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-lg mb-3">
                {s.step}
              </div>
              <h4 className="font-medium text-foreground mb-1">{s.title}</h4>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
