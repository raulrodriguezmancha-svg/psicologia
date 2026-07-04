import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, User } from "lucide-react";
import { REVIEWS, STATS } from "@/data/static";

const renderStars = (rating: number) =>
  Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "fill-muted text-muted"}`}
    />
  ));

export default function Reviews() {
  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background">
      <div className="bg-secondary/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-serif text-foreground font-medium mb-4">
                Experiencias
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Lee las opiniones de personas que han confiado en mí para
                acompañarles en su proceso terapéutico.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-card p-6 rounded-2xl shadow-sm border border-border/50">
              <div className="text-center">
                <div className="text-5xl font-serif text-foreground font-medium">
                  {STATS.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center my-2">
                  {renderStars(Math.round(STATS.averageRating))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {STATS.totalReviews} reseñas en total
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {REVIEWS.map((review) => (
            <Card
              key={review.id}
              className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2 flex flex-row items-center gap-4 space-y-0">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {review.authorName}
                  </div>
                  <div className="flex mt-1">{renderStars(review.rating)}</div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-muted-foreground text-sm leading-relaxed italic">
                  "{review.comment}"
                </p>
                <div className="mt-4 text-xs text-muted-foreground/60">
                  {new Date(review.createdAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
