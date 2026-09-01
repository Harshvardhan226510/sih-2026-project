import { AlertRepository } from '../repositories/alertRepository.js';
const repo = new AlertRepository();
export function getSyncData(sinceRevision, options = {}) {
  return repo.getSyncData(sinceRevision, options);
}
export function getBootstrapData() {
  return repo.getBootstrapData();
}