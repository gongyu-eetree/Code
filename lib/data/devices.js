import devices from './devices.json' with { type: 'json' };

export { devices };

export function getDeviceById(id) {
  return devices.find((device) => device.id === id);
}
