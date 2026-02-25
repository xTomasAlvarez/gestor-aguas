import { Router }              from "express";
import { getDashboardStats }   from "../controllers/statsController.js";
import { proteger }            from "../middleware/authMiddleware.js";

const router = Router();
router.use(proteger);

router.get("/dashboard", getDashboardStats);

export default router;
