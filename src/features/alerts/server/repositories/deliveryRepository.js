import { runQuery, runExec, runGet } from '../db/connection.js';

export class DeliveryRepository {
  registerDevice(id, state, district) {
    const existing = runGet('SELECT id FROM devices WHERE id = ?', [id]);
    if (existing) {
      runExec(
        'UPDATE devices SET state = ?, district = ?, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?',
        [state, district, id]
      );
    } else {
      runExec(
        'INSERT INTO devices (id, state, district) VALUES (?, ?, ?)',
        [id, state, district]
      );
    }
  }

  enqueueAlert(alertId, deviceId, priority) {
    const existing = runGet(
      'SELECT id FROM delivery_queue WHERE alert_id = ? AND device_id = ?',
      [alertId, deviceId]
    );
    if (!existing) {
      runExec(
        'INSERT INTO delivery_queue (alert_id, device_id, priority, status) VALUES (?, ?, ?, ?)',
        [alertId, deviceId, priority, 'PENDING']
      );
    }
  }

  getPendingAlerts(deviceId) {
    return runQuery(
      `SELECT q.id as queueId, a.* 
       FROM delivery_queue q 
       JOIN alerts a ON q.alert_id = a.id 
       WHERE q.device_id = ? AND q.status = 'PENDING' 
       ORDER BY q.priority DESC, q.created_at ASC`,
      [deviceId]
    );
  }

  acknowledgeAlert(deviceId, alertId) {
    // Insert into acknowledgements if not exists
    const ack = runGet(
      'SELECT received_at FROM acknowledgements WHERE alert_id = ? AND device_id = ?',
      [alertId, deviceId]
    );
    if (!ack) {
      runExec(
        'INSERT INTO acknowledgements (alert_id, device_id) VALUES (?, ?)',
        [alertId, deviceId]
      );
    }

    // Update delivery queue
    runExec(
      `UPDATE delivery_queue SET status = 'ACKNOWLEDGED' WHERE alert_id = ? AND device_id = ?`,
      [alertId, deviceId]
    );
  }

  getDevicesForArea(state, district) {
    const conditions = [];
    const params = [];
    if (state) {
      conditions.push('state LIKE ?');
      params.push(`%${state}%`);
    }
    if (district) {
      conditions.push('district LIKE ?');
      params.push(`%${district}%`);
    }

    if (conditions.length === 0) {
      return runQuery('SELECT * FROM devices');
    }

    return runQuery(
      `SELECT * FROM devices WHERE ${conditions.join(' OR ')}`,
      params
    );
  }

  getRetryQueue(limit = 100) {
    return runQuery(
      `SELECT * FROM delivery_queue 
       WHERE status = 'PENDING' AND next_attempt_at <= CURRENT_TIMESTAMP 
       LIMIT ?`,
      [limit]
    );
  }

  updateDeliveryAttempt(queueId, status, nextAttemptAt) {
    runExec(
      'UPDATE delivery_queue SET status = ?, attempts = attempts + 1, next_attempt_at = ? WHERE id = ?',
      [status, nextAttemptAt, queueId]
    );
  }
}
