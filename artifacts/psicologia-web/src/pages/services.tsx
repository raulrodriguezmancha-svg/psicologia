import { useListServices } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Clock, Euro, Info, Laptop, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Services() {
  const { data: services, isLoading } = useListServices();

  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background">
      <div className="bg-secondary/40 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground font-medium mb-6">Mis Servicios</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Diferentes modalidades de acompañamiento terapéutico para adaptarse a tu situación personal, disponibilidad y necesidades.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-border/50">
                <CardHeader>
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {services?.map((service) => (
              <Card key={service.id} className="flex flex-col border-border/50 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-2xl font-serif font-medium">{service.name}</CardTitle>
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-lg font-medium text-primary shrink-0">
                      {service.price}€
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} />
                      {service.duration} min
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Euro size={16} />
                      Reserva: {service.depositAmount}€
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    {service.isOnline && (
                      <span className="flex items-center text-xs font-medium text-primary">
                        <Laptop size={14} className="mr-1" /> Online
                      </span>
                    )}
                    {service.isInPerson && (
                      <span className="flex items-center text-xs font-medium text-primary">
                        <MapPin size={14} className="mr-1" /> Presencial
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-6 flex-grow">
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                  
                  <div className="mt-6 flex items-start gap-2 bg-secondary/30 p-3 rounded-lg text-sm text-muted-foreground">
                    <Info size={18} className="text-primary mt-0.5 shrink-0" />
                    <p>El importe de la reserva se descontará del precio total de la sesión. Cancelación gratuita con 48h de antelación.</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/reservar?service=${service.id}`} className="w-full">
                    <Button className="w-full rounded-full py-6 text-base shadow-sm">
                      Seleccionar
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
