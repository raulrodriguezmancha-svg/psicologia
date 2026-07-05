import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import availabilityRouter from "./availability";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import paymentsRouter from "./payments";
import adminRouter from "./admin";
import reviewTokensRouter from "./reviewTokens";
import googleRouter from "./google";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(availabilityRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(paymentsRouter);
router.use(adminRouter);
router.use(reviewTokensRouter);
router.use(googleRouter);

export default router;
