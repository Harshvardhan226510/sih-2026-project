import { runQuery, runExec, runGet } from '../../../alerts/server/db/connection.js';
import crypto from 'crypto';

export class ResearchRecentQueriesRepository {
  static MAX_ENTRIES = 20;

  getRecentQueries(limit = 10) {
    try {
      const rows = runQuery(
        `SELECT * FROM research_recent_queries ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );
      return rows.map(r => ({
        id: r.id,
        queryType: r.query_type,
        title: r.title,
        location: JSON.parse(r.location_json),
        params: JSON.parse(r.params_json),
        createdAt: r.created_at
      }));
    } catch (err) {
      console.error('Failed to get recent queries:', err);
      return [];
    }
  }

  saveQuery({ queryType, title, location, params }) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const locationJson = JSON.stringify(location);
      const paramsJson = JSON.stringify(params);

      // Enforce bounded limit: prune older queries if count >= MAX_ENTRIES
      const countRow = runGet(`SELECT COUNT(*) as count FROM research_recent_queries`);
      if (countRow && countRow.count >= ResearchRecentQueriesRepository.MAX_ENTRIES) {
        runExec(
          `DELETE FROM research_recent_queries 
           WHERE id IN (
             SELECT id FROM research_recent_queries 
             ORDER BY created_at ASC 
             LIMIT ?
           )`,
          [countRow.count - ResearchRecentQueriesRepository.MAX_ENTRIES + 1]
        );
      }

      runExec(
        `INSERT INTO research_recent_queries (id, query_type, title, location_json, params_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, queryType, title, locationJson, paramsJson, now]
      );

      return { id, queryType, title, location, params, createdAt: now };
    } catch (err) {
      console.error('Failed to save recent query:', err);
      return null;
    }
  }
}
