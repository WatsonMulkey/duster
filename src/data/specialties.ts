import type { Specialty } from '../types'

export const specialties: Specialty[] = [
  {
    name: 'BRAWLER',
    statBoost: 'Physical',
    keenSkillOptions: ['Force', 'Persuasion'],
    talent: 'Close Combat or Pugilist',
    startingTalents: ['CLOSE COMBAT', 'PUGILIST'],
    gift1: {
      name: "Cashin' Out",
      description: 'You may cash out to make an unarmed attack.',
    },
    gift2: {
      name: 'Strength in Numbers',
      description:
        'You gain 1 bonus AP for every ally within 10 feet of you at the start of your turn.',
    },
  },
  {
    name: 'DRIFTER',
    statBoost: 'Mental',
    keenSkillOptions: ['Focus', 'Coordination'],
    talent: 'Salted or Hunter',
    startingTalents: ['SALTED', 'HUNTER'],
    gift1: {
      name: 'Immunity',
      description:
        'You are immune to one of these poisons: Demon Spur, Toadback or Sleep Sand.',
    },
    gift2: {
      name: 'Yo-Tay Tamer',
      description:
        'You may use the Dog Handler talent on Yo-Tays as well as dogs.',
    },
  },
  {
    name: 'DRIVER',
    statBoost: 'Mental',
    keenSkillOptions: ['Tech', 'Reflex'],
    talent: 'Driving',
    startingTalents: ['DRIVING'],
    gift1: {
      name: 'Ram at your peril',
      description:
        'When being rammed, you always take the lesser damage dice instead of the higher result.',
    },
    gift2: {
      name: "Can't Slow Down",
      description: "Ramming in a car doesn't cause you to drop a gear.",
    },
  },
  {
    name: 'HAWK',
    statBoost: 'Emotional',
    keenSkillOptions: ['Persuasion', 'Intuition', 'Deception'],
    talent: 'Barter',
    startingTalents: ['BARTER'],
    gift1: {
      name: 'Eye for the real stuff',
      description:
        'You are always keen on Focus rolls to spot snake oil.',
    },
    gift2: {
      name: 'Heard Of It',
      description:
        'You may add +1 to any skill roll (anyone makes) once per day (resets at the witching hour).',
    },
  },
  {
    name: 'IRONJACK',
    statBoost: 'Mental',
    keenSkillOptions: ['Focus', 'Coordination', 'Memory'],
    talent: 'Mender',
    startingTalents: ['MENDER'],
    gift1: {
      name: 'Efficient',
      description:
        'You do not need to make efficiency rolls for repairs, you always do the work in the shortest time possible.',
    },
    gift2: {
      name: 'No Sweat',
      description:
        "You may choose to have a skill roll you're attempting be 6 without rolling once per day. (resets at the witching hour).",
    },
  },
  {
    name: 'OUTRIDER',
    statBoost: 'Emotional',
    keenSkillOptions: ['Coordination', 'Intuition'],
    talent: 'Horsemanship',
    startingTalents: ['HORSEMANSHIP'],
    gift1: {
      name: 'Horse Ally',
      description:
        'If your horse is in melee range to a target, you may spend 2 AP to have it bite or kick (+1 damage) once per turn.',
    },
    gift2: {
      name: 'Beast Friend',
      description:
        'Choose a specific type of beast. They are considered bonded at the "friendly" level.',
    },
  },
  {
    name: 'RAMBLER',
    statBoost: 'Emotional',
    keenSkillOptions: ['Persuasion', 'Intuition'],
    talent: 'Musician',
    startingTalents: ['MUSICIAN'],
    gift1: {
      name: 'Moral Support',
      description:
        'You may give rollover AP to any one member of your outfit to use before your next turn.',
    },
    gift2: {
      name: 'Second Wind',
      description:
        'If you forfeit your next round you may heal yourself for your rollover AP, once per combat encounter.',
    },
  },
  {
    name: 'SCAVVER',
    statBoost: 'Mental',
    keenSkillOptions: ['Coordination', 'Deception'],
    talent: 'Dodger or Sneak',
    startingTalents: ['DODGER', 'SNEAK'],
    gift1: {
      name: 'Resistant',
      description:
        'If your rads level reaches 12, the GM makes a Fate roll to see if you live or die. If you live, the GM makes this Fate roll every subsequent time you take rads.',
    },
    gift2: {
      name: 'Death Chain',
      description:
        'If you roll a deathblow, you may roll 2d6 again, and if you roll 10+ you trigger another deathblow and repeat.',
    },
  },
  {
    name: 'SLINGER',
    statBoost: 'Physical',
    keenSkillOptions: ['Intuition', 'Reflex'],
    talent: 'Guns',
    startingTalents: ['GUNS'],
    gift1: {
      name: "Winged 'Em",
      description:
        'Any time your damage roll with a gun would be zero, you still deal 1 damage to the target.',
    },
    gift2: {
      name: 'Quick on the Draw',
      description:
        'If you roll for the top of the combat initiative (or tied for), you get a bonus 5 AP in the first round.',
    },
  },
  {
    name: 'STITCH',
    statBoost: 'Mental',
    keenSkillOptions: ['Memory', 'Coordination'],
    talent: 'Good Medicine',
    startingTalents: ['GOOD MEDICINE'],
    gift1: {
      name: 'Heal Thyself',
      description: 'You can treat Broken level damage on yourself.',
    },
    gift2: {
      name: 'Quick Study',
      description:
        'It only takes you 1 XP point to unlock and master talents.',
    },
  },
  {
    name: 'TEKE',
    statBoost: 'Emotional',
    keenSkillOptions: ['Focus', 'Intuition'],
    talent: 'Teke: Soul Seer',
    startingTalents: ['TEKE: SOUL SEER'],
    gift1: {
      name: 'Presence',
      description:
        'You are able to sense the presence of other tekes, although not their direction or exact distance.',
    },
    gift2: null,
  },
  {
    name: 'WITCHLIKE',
    statBoost: 'Emotional',
    keenSkillOptions: ['Intuition'],
    talent: 'Witchery: Boons or Witchery: Busts',
    startingTalents: ['WITCHERY: BOONS', 'WITCHERY: BUSTS'],
    gift1: {
      name: 'Extra Witchery',
      description:
        'Every night at the witching hour, roll 1d6 and gain that much witchery, which can be spent to use witchery talents.',
    },
    gift2: null,
  },
]
