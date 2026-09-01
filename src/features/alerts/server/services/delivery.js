import { DeliveryRepository } from '../repositories/deliveryRepository.js';
import logger from '../utils/logger.js';

const deliveryRepo = new DeliveryRepository();

export class DeliveryService {
  /**
   * Enqueues an alert for relevant devices based on area and priority.
   */
  async enqueueAlerts(alert) {
    try {
      let priority = 3; // Default low priority
      
      // P0: Extreme severity or high urgency
      if (alert.severity === 'Extreme' || alert.urgency === 'Immediate') {
        priority = 0;
      } else if (alert.severity === 'Severe' || alert.urgency === 'Expected') {
        priority = 1;
      } else if (alert.severity === 'Moderate') {
        priority = 2;
      }

      // If priority is P0, bypass geo filter and broadcast to all devices (or at least wide area)
      // Actually, let's keep it scoped but maybe less strictly, or just strictly based on the area if provided.
      // The problem statement says extreme alerts should perhaps bypass strict filters.
      let devices = [];
      if (priority === 0) {
        devices = deliveryRepo.getDevicesForArea('', ''); // all devices
      } else {
        // Parse alert area to get state/district. This can be complex depending on IMD format.
        // For simplicity, we search devices whose state or district matches the alert area string.
        devices = deliveryRepo.getDevicesForArea(alert.area, alert.area);
      }

      for (const device of devices) {
        deliveryRepo.enqueueAlert(alert.id, device.id, priority);
      }

      logger.info({ alertId: alert.id, deviceCount: devices.length, priority }, 'Alert enqueued for delivery');
    } catch (err) {
      logger.error({ err, alertId: alert.id }, 'Failed to enqueue alert');
    }
  }

  /**
   * Process the retry queue for pending deliveries.
   * This might involve actual push notifications in the future, 
   * but for now it just logs or prepares them for sync.
   */
  async processQueue() {
    try {
      const pending = deliveryRepo.getRetryQueue(100);
      if (pending.length === 0) return;

      logger.info({ pendingCount: pending.length }, 'Processing delivery queue');

      for (const item of pending) {
        // Here we would integrate with Web Push, SMS, etc.
        // For pull-based, the device must fetch it.
        // We just increment attempts and push the next_attempt_at into the future.
        const nextAttempt = new Date();
        nextAttempt.setMinutes(nextAttempt.getMinutes() + (item.attempts + 1) * 5); // Exponential-ish backoff

        // If attempts > 10, mark failed, else leave PENDING
        if (item.attempts > 10) {
          deliveryRepo.updateDeliveryAttempt(item.id, 'FAILED', nextAttempt.toISOString());
        } else {
          deliveryRepo.updateDeliveryAttempt(item.id, 'PENDING', nextAttempt.toISOString());
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error processing delivery queue');
    }
  }
}
