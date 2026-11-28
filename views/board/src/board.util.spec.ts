import { BOARD_ICON } from './board.util';

describe('BOARD_ICON', () => {
  /** § 003131: a team board shows the icon of the tab Teams, not the Gremium icon. */
  it('gives a team board the teams icon', () => {
    expect(BOARD_ICON.team).toBe('network');
    expect(BOARD_ICON).toEqual({ personal: 'user', team: 'network', free: 'kanban', permission: 'ticket' });
  });
});
