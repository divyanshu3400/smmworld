import { Router, type IRouter } from "express";
import healthRouter from "./health";
import smmRouter from "./smm";
import adminRouter from "./admin";
import paymentRouter from "./payment";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/smm", smmRouter);
router.use("/admin", adminRouter);
router.use("/payment", paymentRouter);

export default router;
