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

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(collectionsRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(reviewsRouter);
router.use(discountsRouter);
router.use(cartRouter);
router.use(searchRouter);
router.use(distributorsRouter);
router.use(fulfillmentRouter);
router.use(contentRouter);
router.use(emailRouter);
router.use(reportsRouter);

export default router;
