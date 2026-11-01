import { DailyMysteryPuzzle } from '../types/game';

export const DAILY_MYSTERIES: DailyMysteryPuzzle[] = [
  {
    id: 'daily_midnight_telegram',
    dateLabel: 'Dispatch No. 14 · Autumn Edition',
    title: 'The Fogbound Express Compartment',
    setting: '11:50 PM · First-Class Sleeper Car to Edinburgh',
    premise:
      'Jewel broker Sterling Finch is discovered drugged in Car B, his sapphire case missing. The train has not stopped since York, and heavy sleet coats the exterior gangway.',
    clues: [
      {
        id: 'c1',
        title: 'Unmelted Sleet on Brass Latch',
        detail: 'Fine sleet crystals sit undisturbed on the exterior corridor door—no one exited Car B into the storm.',
      },
      {
        id: 'c2',
        title: 'Reversed Wax Seal',
        detail: 'The broken red wax seal on Finch’s case bears a left-handed signet impression smudged with violet fountain ink.',
      },
      {
        id: 'c3',
        title: 'Cold Chamomile Cup',
        detail: 'Prepared in the galley at 11:15 PM; only the conductor and the compartment neighbor walked past the galley.',
      },
    ],
    suspects: [
      {
        id: 's_conductor',
        name: 'Conductor Graves',
        role: 'Night Car Attendant',
        statement: 'I served Mr. Finch his tea at 11:16 PM with my gloved right hand and punched tickets at the front vestibule until midnight.',
      },
      {
        id: 's_barrister',
        name: 'Clara Sterling-Vane',
        role: 'Neighboring Berth Passenger',
        statement: 'I spent the entire hour drafting legal briefs in violet ink—with my left hand, as always—and never stepped into the corridor.',
      },
      {
        id: 's_courier',
        name: 'Julian Pike',
        role: 'Baggage Car Guard',
        statement: 'I was locked inside the rear baggage car sorting mailbags; the sleet outside would have soaked anyone crossing between cars.',
      },
    ],
    culpritId: 's_barrister',
    explanation:
      'Sleet on the gangway clears Julian Pike in the rear car, while the left-handed signet smudge stained with fresh violet ink directly exposes Clara Sterling-Vane, who slipped into the adjoining berth inside Car B.',
  },
  {
    id: 'daily_conservatory_snuffbox',
    dateLabel: 'Dispatch No. 15 · Archive Riddle',
    title: 'The Amber Snuffbox Theft',
    setting: '9:20 PM · Ashworth Club Smoking Room',
    premise:
      'Lord Ashworth’s Baltic amber snuffbox vanished during a three-minute gas-lamp outage while three members stood inside the room.',
    clues: [
      {
        id: 'c1',
        title: 'Clove Tobacco Sneeze Trace',
        detail: 'The lid was loose; spicy Madagascar clove snuff spilled across the velvet mantelpiece.',
      },
      {
        id: 'c2',
        title: 'Soot on White Kid Glove',
        detail: 'Whoever turned off the brass gas-cock by the door got fresh lampblack soot on their left palm.',
      },
      {
        id: 'c3',
        title: 'Chilled Brandy Snifter',
        detail: 'Colonel Vane’s glass on the far window table remained warm from both hands throughout the blackout.',
      },
    ],
    suspects: [
      {
        id: 's_colonel',
        name: 'Colonel Vane',
        role: 'Retired Cavalry Officer',
        statement: 'I stood by the window cradling my brandy until the lamps were relit.',
      },
      {
        id: 's_archivist',
        name: 'Dr. Miles Penn',
        role: 'Museum Curator',
        statement: 'I kept my white evening gloves clasped behind my back near the door—forgive my sudden sneezing fit, the night draft caught me.',
      },
      {
        id: 's_banker',
        name: 'Arthur Sterling',
        role: 'Merchant Banker',
        statement: 'I struck a vesta match at the center card table within ten seconds of the lights failing.',
      },
    ],
    culpritId: 's_archivist',
    explanation:
      'Dr. Miles Penn stood right beside the gas-cock, hid his soot-stained white gloves behind his back when the match was struck, and betrayed himself by sneezing from the spilled Madagascar clove snuff.',
  },
];
