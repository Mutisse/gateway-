import { Router } from "express";
import { httpClient } from "../utils/http-client";
import { otpRateLimit } from "../middleware/rate-limiting.middleware";

const router = Router();

// 📧 OTP ROUTES ONLY
router.post("/send", otpRateLimit, async (req, res, next) => {
  try {
    console.log("📤 Gateway: Redirecionando OTP send para User Service");
    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/otp/send", // ✅ CORRETO
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no OTP send:", error.message);
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    console.log("✅ Gateway: Redirecionando OTP verify para User Service");
    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/otp/verify", // ✅ CORRETO
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no OTP verify:", error.message);
    next(error);
  }
});

router.post("/resend", otpRateLimit, async (req, res, next) => {
  try {
    console.log("🔄 Gateway: Redirecionando OTP resend para User Service");
    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/otp/resend", // ✅ CORRETO
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no OTP resend:", error.message);
    next(error);
  }
});

export default router;
