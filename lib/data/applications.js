import applicationProfiles from './applications.json' with { type: 'json' };

export { applicationProfiles };

export function getApplicationProfile(id) {
  return applicationProfiles.find((profile) => profile.id === id) || applicationProfiles.find((profile) => profile.id === 'cost_optimized_general');
}
