import type { SimulationPreset, InterventionPreset, Minute } from '@/types/simulationPreset';

// Helper to create InterventionPreset more easily
const createIntervention = (
  key: InterventionPreset['key'],
  startHour: number,
  startMinuteOffset: number,
  durationMin: InterventionPreset['durationMin'],
  params?: InterventionPreset['params'],
  labelOverride?: InterventionPreset['labelOverride'],
  group?: InterventionPreset['group']
): InterventionPreset => ({
  key,
  startMin: ((startHour * 60) + startMinuteOffset) as Minute,
  durationMin,
  params,
  labelOverride,
  group,
});

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'pmdd',
    label: 'PMDD & Cycle Syncing',
    description: 'A simulation preset focused on managing PMDD symptoms and optimizing for the menstrual cycle.',
    userProfile: {
      subject: {
        sex: 'female',
        age: 30,
        weight: 65,
        cycleLength: 28,
        cycleDay: 20, // Example: Luteal phase where PMDD symptoms often arise
      },
      conditions: {
        pcos: { enabled: true, params: { severity: 0.7 } },
      },
      selectedGoals: ['mood', 'calm', 'sleep', 'cycle'],
      enabledSignals: {
        cortisol: true,
        serotonin: true,
        estrogen: true,
        progesterone: true,
        gaba: true,
        oxytocin: true,
        dopamine: true,
        melatonin: true,
        inflammation: true,
      },
      signalOrder: [
        'cortisol', 'serotonin', 'gaba', 'dopamine', 'oxytocin', 'inflammation',
        'estrogen', 'progesterone', 'lh', 'fsh', 'melatonin'
      ]
    },
    timeline: [
      // Morning routine (7 AM wake, 8 AM breakfast)
      createIntervention('sleep', 23, 0, 8 * 60), // Default sleep 11 PM to 7 AM
      createIntervention('food', 8, 0, 30, { carbSugar: 20, carbStarch: 40, protein: 25, fat: 15, fiberSol: 5 }), // Balanced breakfast
      createIntervention('meditation', 8, 45, 15), // Morning mindfulness for mood
      createIntervention('magnesium', 9, 0, 480, { mg: 200 }), // Magnesium for calm
      createIntervention('exercise_cardio', 12, 0, 45, { intensity: 0.7 }), // Moderate cardio
      createIntervention('food', 13, 0, 30, { carbSugar: 15, carbStarch: 30, protein: 30, fat: 10, fiberSol: 8 }), // Lunch
      createIntervention('ltheanine', 14, 0, 240, { mg: 100 }), // L-Theanine for calm focus
      createIntervention('social', 18, 0, 60), // Social connection for oxytocin
      createIntervention('food', 19, 0, 30, { carbSugar: 10, carbStarch: 25, protein: 35, fat: 12, fiberSol: 6 }), // Dinner
      createIntervention('breathwork', 21, 0, 10), // Evening breathwork for relaxation
      createIntervention('melatonin', 22, 0, 360, { mg: 0.5 }), // Low dose melatonin
    ],
  },
  {
    id: 'wolverine_stack',
    label: 'Wolverine Stack',
    description: 'A peptide stack for accelerated recovery and tissue repair, featuring BPC-157 and TB-500.',
    userProfile: {
      subject: {
        sex: 'male',
        age: 35,
        weight: 85,
      },
      selectedGoals: ['recovery', 'energy', 'focus', 'sleep'],
      enabledSignals: {
        growthHormone: true,
        inflammation: true,
        mtor: true,
        testosterone: true,
        cortisol: true,
        energy: true,
        dopamine: true,
        strengthReadiness: true,
      },
      signalOrder: [
        'growthHormone', 'testosterone', 'mtor', 'inflammation', 'cortisol', 
        'energy', 'dopamine', 'strengthReadiness'
      ]
    },
    timeline: [
      createIntervention('sleep', 22, 30, 8 * 60), // 10:30 PM to 6:30 AM
      createIntervention('bpc157', 7, 0, 480, { mcg: 250 }), // Morning dose
      createIntervention('tb500', 7, 0, 720, { mg: 2.5 }), // Morning dose
      createIntervention('food', 7, 30, 30, { carbSugar: 10, carbStarch: 30, protein: 40, fat: 20, fiberSol: 5 }), // High protein breakfast
      createIntervention('caffeine', 15, 30, 240, { mg: 150 }), // Pre-workout
      createIntervention('exercise_resistance', 16, 0, 75, { intensity: 0.9 }), // Heavy workout
      createIntervention('food', 17, 30, 30, { carbSugar: 40, carbStarch: 20, protein: 50, fat: 15, fiberSol: 5 }), // Post-workout high protein/carb
      createIntervention('bpc157', 19, 0, 480, { mcg: 250 }), // Evening dose
    ],
  }
];
