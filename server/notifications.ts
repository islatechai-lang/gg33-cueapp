import { storage } from "./storage";
import { createWhopNotification } from "./whop";
import { format } from "date-fns";

let lastRunDate: string | null = null;

/**
 * Checks for users who haven't revealed their daily energy and sends them a Whop notification.
 */
export async function sendDailyEnergyReminders() {
  const today = format(new Date(), "yyyy-MM-dd");
  
  console.log(`[Notifications] Starting daily energy reminder check for ${today}...`);
  
  try {
    const missingUsers = await storage.getUsersMissingDailyEnergy(today);
    
    if (missingUsers.length === 0) {
      console.log("[Notifications] No users found requiring a reminder today.");
      return;
    }

    console.log(`[Notifications] Found ${missingUsers.length} users to notify.`);

    let successCount = 0;
    for (const user of missingUsers) {
      if (!user.whopUserId) continue;

      const success = await createWhopNotification({
        userId: user.whopUserId,
        title: "✨ Your Daily Energy is Ready!",
        content: "Don't miss out on your cosmic guidance for today. Reveal your energy now to stay aligned!",
        link: "https://whop.com/cue-your-life" // Update this to the actual app URL if needed
      });

      if (success) successCount++;
    }

    console.log(`[Notifications] Successfully sent ${successCount}/${missingUsers.length} reminders.`);
    lastRunDate = today;
  } catch (error) {
    console.error("[Notifications] Error in daily energy reminder service:", error);
  }
}

/**
 * Starts the notification background service.
 * Checks every hour and sends reminders if it's past 10 AM and hasn't run today.
 */
export function startNotificationService() {
  console.log("[Notifications] Daily energy notification service started.");
  
  // Check every hour
  const CHECK_INTERVAL = 60 * 60 * 1000;
  
  const tick = async () => {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const hour = now.getHours();

    // Trigger at 10 AM (or later if the server was down)
    if (today !== lastRunDate && hour >= 10) {
      await sendDailyEnergyReminders();
    }
  };

  // Run initial check after a short delay
  setTimeout(tick, 5000);
  
  setInterval(tick, CHECK_INTERVAL);
}
