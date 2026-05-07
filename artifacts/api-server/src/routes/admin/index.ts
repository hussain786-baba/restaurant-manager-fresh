import { Router, type IRouter } from "express";
import { requireAuth } from "../../lib/auth";
import dashboardRouter from "./dashboard";
import ordersRouter from "./orders";
import categoriesRouter from "./categories";
import menuItemsRouter from "./menuItems";
import tablesRouter from "./tables";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(requireAuth);
router.use(dashboardRouter);
router.use(ordersRouter);
router.use(categoriesRouter);
router.use(menuItemsRouter);
router.use(tablesRouter);
router.use(staffRouter);

export default router;
