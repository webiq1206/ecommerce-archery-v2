import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import brandsRouter from "./brands";
import collectionsRouter from "./collections";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import reviewsRouter from "./reviews";
import discountsRouter from "./discounts";
import cartRouter from "./cart";
import searchRouter from "./search";
import distributorsRouter from "./distributors";
import fulfillmentRouter from "./fulfillment";
import contentRouter from "./content";
import emailRouter from "./email";
import reportsRouter from "./reports";
import checkoutRouter from "./checkout";
import wishlistRouter from "./wishlist";
import aiRouter from "./ai";
import webhooksRouter from "./webhooks";
import analyticsRouter from "./analytics";
import { adminGuard } from "../middleware/adminGuard";

const router: IRouter = Router();

router.use(healthRouter);

router.use(productsRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(collectionsRouter);
router.use(searchRouter);
router.use(cartRouter);
router.use(reviewsRouter);
router.use(contentRouter);
router.use(emailRouter);
router.use(checkoutRouter);
router.use(wishlistRouter);
router.use(webhooksRouter);
router.use(aiRouter);

router.use("/orders", adminGuard);
router.use("/orders/*splat", adminGuard);
router.use("/customers", adminGuard);
router.use("/customers/*splat", adminGuard);
router.use("/discounts", adminGuard);
router.use("/discounts/*splat", adminGuard);
router.use("/distributors", adminGuard);
router.use("/distributors/*splat", adminGuard);
router.use("/fulfillment", adminGuard);
router.use("/fulfillment/*splat", adminGuard);
router.use("/reports", adminGuard);
router.use("/reports/*splat", adminGuard);
router.use("/analytics", adminGuard);
router.use("/analytics/*splat", adminGuard);

router.use(ordersRouter);
router.use(customersRouter);
router.use(discountsRouter);
router.use(distributorsRouter);
router.use(fulfillmentRouter);
router.use(reportsRouter);
router.use(analyticsRouter);

export default router;
