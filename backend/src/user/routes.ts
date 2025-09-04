import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { jwtCache } from "../utils/jwt-cache";

const router = Router();

router.get("/user", (req, res) => {
  res.json({ message: "Hello from user routes" });
});

// Logout endpoint - invalidates user cache
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // Get user from the authenticated request (set by authMiddleware)
    const user = req.user;
    
    if (user) {
      // Invalidate the user's cache
      const invalidated = await jwtCache.invalidateUser(user.sub || user.email);
      
      console.log(`🗑️ Logout: Cache invalidated for user ${user.email}`);
      
      res.json({ 
        success: true,
        message: "Logged out successfully",
        cacheInvalidated: invalidated
      });
    } else {
      res.json({ success: true, message: "No user to logout" });
    }
    
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Logout failed" 
    });
  }
});

export default router;  