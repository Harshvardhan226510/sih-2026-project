import { runQuery, runExec, runGet } from '../../../alerts/server/db/connection.js';
import crypto from 'crypto';

export class ResearchCacheRepository {
  static MAX_DATASETS = 5;

  generateDatasetKey(lat, lon, variablesString) {
    const normLat = Number(lat).toFixed(2);
    const normLon = Number(lon).toFixed(2);
    const vars = variablesString.split(',').sort().join(',');
    return crypto.createHash('sha256').update(`${normLat}|${normLon}|${vars}`).digest('hex');
  }

  getDataset(datasetKey) {
    const row = runGet(
      `SELECT * FROM research_historical_cache WHERE dataset_key = ?`,
      [datasetKey]
    );
    
    if (row) {
      // Update last_accessed_at on cache hit
      this.touchDataset(datasetKey);
      
      try {
        row.data = JSON.parse(row.data);
      } catch (e) {
        console.error('Failed to parse cache data for', datasetKey);
        return null;
      }
    }
    
    return row;
  }

  touchDataset(datasetKey) {
    runExec(
      `UPDATE research_historical_cache SET last_accessed_at = ? WHERE dataset_key = ?`,
      [new Date().toISOString(), datasetKey]
    );
  }

  saveDataset({ provider, locationName, lat, lon, startDate, endDate, variables, resolution, data }) {
    const datasetKey = this.generateDatasetKey(lat, lon, variables);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h TTL
    
    const dataStr = JSON.stringify(data);
    const sizeBytes = Buffer.byteLength(dataStr, 'utf8');

    // Check if we need to evict (count datasets)
    const countRow = runGet(`SELECT COUNT(*) as count FROM research_historical_cache`);
    if (countRow && countRow.count >= ResearchCacheRepository.MAX_DATASETS) {
      // Delete the least recently accessed dataset that IS NOT the one we are about to insert/update
      runExec(
        `DELETE FROM research_historical_cache 
         WHERE id = (
           SELECT id FROM research_historical_cache 
           WHERE dataset_key != ? 
           ORDER BY last_accessed_at ASC 
           LIMIT 1
         )`,
        [datasetKey]
      );
    }

    // Insert or replace
    runExec(
      `INSERT OR REPLACE INTO research_historical_cache 
       (id, dataset_key, provider, location_name, latitude, longitude, start_date, end_date, variables, resolution, data, created_at, last_accessed_at, expires_at, size_bytes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, datasetKey, provider, locationName, lat, lon, startDate, endDate, 
        variables, resolution, dataStr, now, now, expiresAt, sizeBytes
      ]
    );

    return { datasetKey, sizeBytes };
  }
}
