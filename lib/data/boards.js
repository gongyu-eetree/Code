import boardCatalog from './boards.json' with { type: 'json' };

export { boardCatalog };

export function boardsForDevice(deviceId) {
  return boardCatalog.filter((board) => board.device_ids.includes(deviceId));
}
