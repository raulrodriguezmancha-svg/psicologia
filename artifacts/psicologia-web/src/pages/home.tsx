import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, Calendar, HeartHandshake, Loader2 } from "lucide-react";
import { REVIEWS, STATS } from "@/data/static";

type Service = { id: number; name: string; description: string; duration: number; price: number; depositAmount: number };

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then(r => r.json())
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);
  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "fill-muted text-muted"}`}
      />
    ));

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-secondary/30">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="hero-calm.png"
            alt="Paisaje en calma"
            className="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 flex flex-col items-start max-w-4xl mr-auto ml-4 md:ml-12 lg:ml-20">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Terapia 100% online
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-foreground font-medium leading-tight mb-6 animate-in fade-in slide-in-from-bottom-6 delay-150 fill-mode-both">
            Un espacio seguro <br />
            para <span className="text-primary italic">entenderte</span>.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 delay-300 fill-mode-both">
            Acompañamiento psicológico online para ayudarte a gestionar la ansiedad, el estrés y otros momentos difíciles desde un enfoque cercano, profesional y basado en la evidencia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 delay-500 fill-mode-both">
            <Link href="/reservar">
              <Button
                size="lg"
                className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/25"
              >
                Reserva tu primera sesión
              </Button>
            </Link>
            <Link href="/sobre-mi">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-14 text-base bg-background/50 backdrop-blur"
              >
                Conóceme
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats/Trust Bar */}
      <section className="w-full bg-primary text-primary-foreground py-10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-primary-foreground/20">
          <div className="flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-2xl font-serif font-medium">
              {STATS.averageRating.toFixed(1)}
            </p>
            <p className="text-sm opacity-80">Media de valoraciones</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <Calendar className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-2xl font-serif font-medium">
              +{STATS.totalSessions}
            </p>
            <p className="text-sm opacity-80">Sesiones realizadas</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <HeartHandshake className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-2xl font-serif font-medium">Enfoque integrador</p>
            <p className="text-sm opacity-80">Terapia adaptada a ti</p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="w-full py-24 bg-background">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="alba-headshot.png"
                alt="Alba García Santillana"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
            </div>
          </div>
          <div className="w-full lg:w-1/2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground font-medium">
              Hola, soy Alba García.
            </h2>
            <p className="text-sm font-medium text-primary tracking-wider uppercase">
              Psicóloga y Neuropsicóloga
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Mi objetivo es ofrecerte un acompañamiento profesional, cercano y
              basado en la evidencia científica para ayudarte a vivir mejor.
              Creo en un espacio de escucha libre de juicios donde podamos
              explorar juntos lo que te ocurre y encontrar herramientas
              eficaces.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Trabajo con un enfoque integrador que combina TCC, ACT, DBT y
              Análisis Funcional, adaptando siempre la intervención a tus
              necesidades. Además, cuento con formación especializada en
              Neuropsicología clínica.
            </p>
            <div className="pt-4">
              <Link
                href="/sobre-mi"
                className="inline-flex items-center text-primary font-medium hover:underline underline-offset-4"
              >
                Leer más sobre mi formación{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full py-24 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground font-medium mb-4">
              ¿En qué puedo ayudarte?
            </h2>
            <p className="text-muted-foreground text-lg">
              Sesiones personalizadas en modalidad online, diseñadas para
              adaptarse a tus necesidades y ritmo desde la comodidad de tu
              hogar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingServices ? (
              <div className="col-span-3 flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24}/></div>
            ) : (
              services.slice(0, 3).map((service) => (
              <Card
                key={service.id}
                className="border-none shadow-lg hover:shadow-xl transition-shadow bg-background flex flex-col"
              >
                <CardContent className="p-8 flex flex-col h-full">
                  <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                    {service.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-grow">
                    {service.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {service.duration} min
                    </span>
                    <span className={`font-medium text-lg ${service.price === 0 ? "text-green-600" : "text-primary"}`}>
                      {service.price === 0 ? "Gratis" : `${service.price}€`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/servicios">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Ver todos los servicios <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="w-full py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground font-medium mb-4">
              Lo que dicen mis pacientes
            </h2>
            <div className="flex items-center justify-center gap-2 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-accent text-accent" />
              ))}
              <span className="font-medium text-foreground ml-1">
                {STATS.averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-muted-foreground">
              {STATS.totalReviews} valoraciones verificadas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {REVIEWS.slice(0, 3).map((review) => (
              <Card
                key={review.id}
                className="border-border/50 shadow-sm bg-card"
              >
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed italic mb-4">
                    "{review.comment}"
                  </p>
                  <p className="font-medium text-sm text-foreground">
                    {review.authorName}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/resenas">
              <Button variant="outline" className="rounded-full px-8">
                Leer todas las reseñas{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">
            Estás a un paso de tu cambio
          </h2>
          <p className="text-lg opacity-80 mb-10">
            Cada proceso es único. Trabajaremos juntos para comprender lo que te
            ocurre y avanzar hacia la vida que quieres construir.
          </p>
          <Link href="/reservar">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-10 h-14 text-base"
            >
              Reservar mi primera sesión
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
