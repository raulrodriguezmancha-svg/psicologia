import { Router, type IRouter } from "express";
import { db, reviewsTable } from "@workspace/db";
import { eq, avg, count, sql } from "drizzle-orm";
import {
  ListReviewsResponse,
  CreateReviewBody,
  CreateReviewResponse,
  GetReviewStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.approved, true))
    .orderBy(reviewsTable.createdAt);
  res.json(ListReviewsResponse.parse(reviews));
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({ ...parsed.data, approved: false })
    .returning();

  res.status(201).json(CreateReviewResponse.parse(review));
});

router.get("/reviews/stats", async (req, res): Promise<void> => {
  const [stats] = await db
    .select({
      averageRating: avg(reviewsTable.rating),
      totalReviews: count(),
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.approved, true));

  const distribution = await db
    .select({
      rating: reviewsTable.rating,
      count: count(),
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.approved, true))
    .groupBy(reviewsTable.rating);

  const ratingDistribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const d of distribution) {
    ratingDistribution[String(d.rating)] = Number(d.count);
  }

  res.json(
    GetReviewStatsResponse.parse({
      averageRating: parseFloat(stats?.averageRating ?? "0"),
      totalReviews: Number(stats?.totalReviews ?? 0),
      ratingDistribution,
    })
  );
});

export default router;
