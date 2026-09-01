import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseRSS, parseCAP } from '../utils/xml.js';
const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Latest alerts from IMD</title>
    <item>
      <title>Heavy Rainfall</title>
      <link>https://example.com/alert1.xml</link>
      <description>Heavy rain over Maharashtra</description>
      <guid>urn:oid:2.49.0.1.356.0.2026.1.1.1.0.0</guid>
      <pubDate>Mon, 01 Jan 2026 00:00:00 +0000</pubDate>
    </item>
    <item>
      <title>Cyclone</title>
      <link>https://example.com/alert2.xml</link>
      <description>Cyclone approaching coast</description>
      <guid>urn:oid:2.49.0.1.356.0.2026.1.2.1.0.0</guid>
      <pubDate>Tue, 02 Jan 2026 00:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;
const SAMPLE_CAP = `<?xml version="1.0" encoding="UTF-8"?>
<cap:alert xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">
  <cap:identifier>urn:oid:2.49.0.1.356.0.2026.1.1.1.0.0</cap:identifier>
  <cap:sender>test@imd.gov.in</cap:sender>
  <cap:sent>2026-01-01T05:30:00+05:30</cap:sent>
  <cap:status>Actual</cap:status>
  <cap:msgType>Alert</cap:msgType>
  <cap:scope>Public</cap:scope>
  <cap:info>
    <cap:language>en</cap:language>
    <cap:category>Met</cap:category>
    <cap:event>Heavy Rainfall</cap:event>
    <cap:urgency>Expected</cap:urgency>
    <cap:severity>Severe</cap:severity>
    <cap:certainty>Likely</cap:certainty>
    <cap:onset>2026-01-01T00:00:00+05:30</cap:onset>
    <cap:expires>2026-01-02T00:00:00+05:30</cap:expires>
    <cap:senderName>NWFC DIVISION, IMD</cap:senderName>
    <cap:headline>Heavy rainfall warning</cap:headline>
    <cap:description>Heavy to very heavy rainfall expected.</cap:description>
    <cap:instruction>Stay indoors.</cap:instruction>
    <cap:area>
      <cap:areaDesc>MAHARASHTRA</cap:areaDesc>
      <cap:polygon>19.0,72.8 19.5,73.0 19.2,73.5 18.8,73.2 19.0,72.8</cap:polygon>
    </cap:area>
  </cap:info>
</cap:alert>`;
describe('XML Parsing', () => {
  describe('parseRSS', () => {
    it('parses RSS items correctly', () => {
      const items = parseRSS(SAMPLE_RSS);
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].title, 'Heavy Rainfall');
      assert.strictEqual(items[1].title, 'Cyclone');
      assert.ok(items[0].link.includes('alert1.xml'));
    });
    it('returns empty array for invalid RSS', () => {
      assert.deepStrictEqual(parseRSS('<invalid>'), []);
    });
    it('handles single item RSS', () => {
      const singleItem = `<?xml version="1.0"?>
<rss version="2.0"><channel><item><title>Test</title><link>http://x.com</link></item></channel></rss>`;
      const items = parseRSS(singleItem);
      assert.strictEqual(items.length, 1);
    });
  });
  describe('parseCAP', () => {
    it('parses CAP alert with all fields', () => {
      const alert = parseCAP(SAMPLE_CAP);
      assert.ok(alert);
      assert.strictEqual(alert.identifier, 'urn:oid:2.49.0.1.356.0.2026.1.1.1.0.0');
      assert.strictEqual(alert.severity, 'Severe');
      assert.strictEqual(alert.urgency, 'Expected');
      assert.strictEqual(alert.certainty, 'Likely');
      assert.strictEqual(alert.event, 'Heavy Rainfall');
      assert.strictEqual(alert.headline, 'Heavy rainfall warning');
      assert.strictEqual(alert.areaDesc, 'MAHARASHTRA');
      assert.ok(alert.polygon);
      assert.strictEqual(alert.instruction, 'Stay indoors.');
    });
    it('returns null for invalid XML', () => {
      assert.strictEqual(parseCAP('<invalid>no cap here</invalid>'), null);
    });
  });
});