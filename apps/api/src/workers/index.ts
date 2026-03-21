import { rbacService } from "../services/rbacService.js";
import { db } from "../config/database.js";

// Background worker for cleanup tasks
async function runWorker() {
  console.log("🔧 Background worker starting...");

  // Clean up expired sessions
  setInterval(async () => {
    try {
      const result = await db.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired sessions`);
      }
    } catch (error) {
      console.error("Error cleaning up sessions:", error);
    }
  }, 60 * 60 * 1000); // Every hour

  console.log("🔧 Background worker running");
}

runWorker().catch(console.error);