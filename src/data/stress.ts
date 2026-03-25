import type { StressLevel } from '../types'

export const stressLevels: StressLevel[] = [
  {
    level: 1,
    name: 'Level 1',
    description: 'You have -1 modifier to your Mental energy.',
  },
  {
    level: 2,
    name: 'Level 2',
    description: 'You have -1 modifier to your Physical energy.',
  },
  {
    level: 3,
    name: 'Level 3',
    description: 'You have -1 modifier to your Emotional energy.',
  },
  {
    level: 4,
    name: 'Level 4',
    description:
      'You are nearly comatose. You cannot make any skill rolls, cannot attack, cannot use teke or witchery abilities, and your movement speed is halved.',
  },
]
