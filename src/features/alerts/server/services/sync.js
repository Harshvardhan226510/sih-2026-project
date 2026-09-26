import { AlertRepository } from '../repositories/alertRepository.js';
const repo = new AlertRepository();

export async function getSyncData(sinceRevision, options = {}) {
  return repo.getSyncData(sinceRevision, options);
}

export async function getBootstrapData() {
  return repo.getBootstrapData();
}