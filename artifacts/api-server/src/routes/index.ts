import { Router, type IRouter } from "express";
import healthRouter from "./health";
import smmRouter from "./smm";
import guestRouter from "./guest"
import adminRouter from "./admin";
import paymentRouter from "./payment";
import publicRouter from "./public";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/smm", smmRouter);
router.use("/admin", adminRouter);
router.use("/payment", paymentRouter);
router.use("/public", publicRouter);
router.use("/chat", chatRouter);
router.use("/guest-orders", guestRouter);

export default router;
