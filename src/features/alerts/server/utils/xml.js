import { XMLParser } from 'fast-xml-parser';
const rssParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});
const capParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});
export function parseRSS(xml) {
  const parsed = rssParser.parse(xml);
  const channel = parsed?.rss?.channel;
  if (!channel) return [];
  const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  return items.map(item => ({
    title: item.title,
    link: item.link,
    description: item.description,
    guid: item.guid,
    pubDate: item.pubDate,
    author: item.author,
    category: item.category,
  }));
}
export function parseCAP(xml) {
  const parsed = capParser.parse(xml);
  const alert = parsed?.alert;
  if (!alert) return null;
  const info = alert.info || {};
  const area = info.area || {};
  return {
    identifier: alert.identifier,
    sender: alert.sender,
    sent: alert.sent,
    status: alert.status,
    msgType: alert.msgType,
    scope: alert.scope,
    language: info.language || 'en',
    category: info.category,
    event: info.event,
    responseType: info.responseType,
    urgency: info.urgency,
    severity: info.severity,
    certainty: info.certainty,
    onset: info.onset,
    expires: info.expires,
    senderName: info.senderName,
    headline: info.headline,
    description: info.description,
    instruction: info.instruction,
    web: info.web,
    areaDesc: area.areaDesc,
    polygon: area.polygon,
    geocode: area.geocode,
  };
}