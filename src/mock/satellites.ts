import { SatelliteDef } from '@/types'

// Three orbits with different radii, directions, and speeds — produces a
// continuously evolving galaxy that never overlaps itself.
export const SATELLITES: SatelliteDef[] = [
  // Inner orbit (radius 100), clockwise, 80s per lap — 3 nodes
  {
    id: 'db',
    icon: 'DB',
    label: 'Dashboard',
    angle: 0,
    radius: 100,
    duration: 80,
    reverse: false,
    hintPrompt: 'Create a dashboard showing ',
  },
  {
    id: 'al',
    icon: 'AL',
    label: 'Alert',
    angle: 120,
    radius: 100,
    duration: 80,
    reverse: false,
    hintPrompt: 'Send an alert when ',
  },
  {
    id: 'rp',
    icon: 'RP',
    label: 'Report',
    angle: 240,
    radius: 100,
    duration: 80,
    reverse: false,
    hintPrompt: 'Generate a weekly report of ',
  },

  // Middle orbit (radius 145), counter-clockwise, 110s — 3 nodes
  {
    id: 'tk',
    icon: 'TK',
    label: 'Cron Task',
    angle: 45,
    radius: 145,
    duration: 110,
    reverse: true,
    hintPrompt: 'Every day at 09:00, ',
  },
  {
    id: 'bt',
    icon: 'BT',
    label: 'Bot',
    angle: 165,
    radius: 145,
    duration: 110,
    reverse: true,
    hintPrompt: 'A bot that responds to ',
  },
  {
    id: 'ch',
    icon: 'CH',
    label: 'Chart',
    angle: 285,
    radius: 145,
    duration: 110,
    reverse: true,
    hintPrompt: 'Draw a chart of ',
  },

  // Outer orbit (radius 190), clockwise, 140s — 2 nodes
  {
    id: 'wh',
    icon: 'WH',
    label: 'Webhook',
    angle: 20,
    radius: 190,
    duration: 140,
    reverse: false,
    hintPrompt: 'On webhook event, ',
  },
  {
    id: 'fs',
    icon: 'FS',
    label: 'Feishu Push',
    angle: 200,
    radius: 190,
    duration: 140,
    reverse: false,
    hintPrompt: 'Push to Feishu channel when ',
  },
]
