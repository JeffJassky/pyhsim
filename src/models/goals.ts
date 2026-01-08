import type { Goal, InterventionKey } from '@/types/neurostate';

export interface RecommendedIntervention {
  key: InterventionKey;
  label: string;
  icon: string;
  improvements: [string, string];
  readout: string;
}

export interface GoalCategory {
  id: Goal;
  label: string;
  icon: string;
  recommendedInterventions?: RecommendedIntervention[];
}

export const GOAL_CATEGORIES: GoalCategory[] = [
  { 
    id: 'energy', 
    label: 'Energy', 
    icon: '⚡',
    recommendedInterventions: [
      {
        key: 'caffeine',
        label: 'Caffeine',
        icon: '☕',
        improvements: ['Blocks sleep pressure', 'Boosts motivation'],
        readout: 'Antagonizes adenosine receptors to clear brain fog and stimulates dopamine for drive.'
      },
      {
        key: 'nap',
        label: 'Power Nap',
        icon: '😴',
        improvements: ['Restores alertness', 'Clears metabolic waste'],
        readout: 'A brief sleep cycle that reduces sleep pressure without causing grogginess.'
      },
      {
        key: 'exercise',
        label: 'Morning Run',
        icon: '🏃',
        improvements: ['Spikes cortisol (healthy)', 'Increases blood flow'],
        readout: 'Mobilizes energy reserves and sets your circadian rhythm for the day.'
      }
    ]
  },
  { 
    id: 'productivity', 
    label: 'Productivity', 
    icon: '🚀',
    recommendedInterventions: [
      {
        key: 'ritalinIR10',
        label: 'Focus Aid',
        icon: '💊',
        improvements: ['Sustained attention', 'Executive function'],
        readout: 'Optimizes dopamine and norepinephrine levels in the prefrontal cortex.'
      },
      {
        key: 'ltheanine',
        label: 'L-Theanine',
        icon: '🍵',
        improvements: ['Calm focus', 'Reduces jitters'],
        readout: 'Promotes alpha brain waves for a state of relaxed alertness.'
      },
      {
        key: 'meditation',
        label: 'Deep Work Prep',
        icon: '🧘',
        improvements: ['Clears mental clutter', 'Lowers stress'],
        readout: 'Resets your sensory baseline to help you lock in on a single task.'
      }
    ]
  },
  { 
    id: 'weightLoss', 
    label: 'Weight Loss', 
    icon: '⚖️',
    recommendedInterventions: [
      {
        key: 'exercise',
        label: 'HIIT Workout',
        icon: '🔥',
        improvements: ['Metabolic spike', 'Insulin sensitivity'],
        readout: 'High intensity effort that depletes glycogen and triggers fat oxidation.'
      },
      {
        key: 'food',
        label: 'High Protein Meal',
        icon: '🍗',
        improvements: ['Satiety signaling', 'Thermic effect'],
        readout: 'Triggers GLP-1 and PYY to keep you full while boosting metabolism.'
      }
    ]
  },
  { 
    id: 'mood', 
    label: 'Mood', 
    icon: '🎭',
    recommendedInterventions: [
      {
        key: 'exercise',
        label: 'Cardio',
        icon: '🏃',
        improvements: ['Endorphin release', 'Serotonin boost'],
        readout: 'Natural antidepressant that elevates mood-regulating neurotransmitters.'
      },
      {
        key: 'social',
        label: 'Social Connection',
        icon: '🗣️',
        improvements: ['Oxytocin bonding', 'Stress reduction'],
        readout: 'Lowers cortisol and boosts bonding hormones for emotional stability.'
      },
      {
        key: 'ltheanine',
        label: 'Green Tea Extract',
        icon: '🍵',
        improvements: ['Anxiety relief', 'Balanced state'],
        readout: 'Modulates brain chemistry to smooth out emotional peaks and valleys.'
      }
    ]
  },
  { 
    id: 'focus', 
    label: 'Focus', 
    icon: '🧠',
    recommendedInterventions: [
      {
        key: 'caffeine',
        label: 'Coffee',
        icon: '☕',
        improvements: ['Sharpens attention', 'Wakes up brain'],
        readout: 'Directly stimulates the central nervous system for immediate clarity.'
      },
      {
        key: 'meditation',
        label: 'Mindfulness',
        icon: '🧘',
        improvements: ['Attention control', 'Emotion regulation'],
        readout: 'Trains your brain to return to the task at hand when distracted.'
      }
    ]
  },
  { 
    id: 'recovery', 
    label: 'Recovery', 
    icon: '💪',
    recommendedInterventions: [
      {
        key: 'sleep',
        label: 'Deep Sleep',
        icon: '🌙',
        improvements: ['Tissue repair', 'Hormone reset'],
        readout: 'The foundation of recovery, maximizing growth hormone release.'
      },
      {
        key: 'magnesium',
        label: 'Magnesium',
        icon: '💎',
        improvements: ['Muscle relaxation', 'Nervous system calm'],
        readout: 'Essential mineral that lowers cortisol and supports cellular repair.'
      },
      {
        key: 'electrolytes',
        label: 'Hydration',
        icon: '💧',
        improvements: ['Fluid balance', 'Blood pressure'],
        readout: 'Restores vital salts lost during stress or exertion.'
      }
    ]
  },
  { 
    id: 'sleep', 
    label: 'Sleep', 
    icon: '😴',
    recommendedInterventions: [
      {
        key: 'melatonin',
        label: 'Melatonin',
        icon: '🌙',
        improvements: ['Sleep onset', 'Circadian signal'],
        readout: 'Signals darkness to your master clock to initiate the sleep cycle.'
      },
      {
        key: 'magnesium',
        label: 'Magnesium Glycinate',
        icon: '💎',
        improvements: ['Deep relaxation', 'Stays asleep'],
        readout: 'Calms the excitatory nervous system to prevent waking up.'
      },
      {
        key: 'meditation',
        label: 'Wind Down',
        icon: '🧘',
        improvements: ['Lowers heart rate', 'Quiets mind'],
        readout: 'Shifts your nervous system into rest-and-digest mode before bed.'
      }
    ]
  },
  { 
    id: 'digestion', 
    label: 'Digestion', 
    icon: '🦠',
    recommendedInterventions: [
      {
        key: 'food',
        label: 'Fiber Rich Meal',
        icon: '🥗',
        improvements: ['Gut motility', 'Microbiome fuel'],
        readout: 'Supports healthy gut bacteria and slows sugar absorption.'
      },
      {
        key: 'electrolytes',
        label: 'Water',
        icon: '💧',
        improvements: ['Nutrient absorption', 'Regularity'],
        readout: 'Critical for all digestive processes and mucosal health.'
      }
    ]
  },
  { 
    id: 'pain', 
    label: 'Pain', 
    icon: '❤️‍🩹',
    recommendedInterventions: [
      {
        key: 'meditation',
        label: 'Pain Management',
        icon: '🧘',
        improvements: ['Lowers perception', 'Reduces suffering'],
        readout: 'Decouples the sensation of pain from the emotional reaction to it.'
      },
      {
        key: 'sleep',
        label: 'Restorative Sleep',
        icon: '🛌',
        improvements: ['Lowers inflammation', 'Pain threshold'],
        readout: 'Lack of sleep lowers your pain threshold; rest restores it.'
      }
    ]
  },
  { 
    id: 'cycle', 
    label: 'Cycle Syncing', 
    icon: '🌝',
    recommendedInterventions: [
      {
        key: 'exercise',
        label: 'Adaptive Movement',
        icon: '🏃',
        improvements: ['Hormone balance', 'Energy match'],
        readout: 'Adjusting intensity to match your follicular or luteal phase.'
      },
      {
        key: 'food',
        label: 'Nutrient Support',
        icon: '🥗',
        improvements: ['Blood sugar stability', 'Cravings'],
        readout: 'Supporting progesterone production with stable energy sources.'
      }
    ]
  },
  { 
    id: 'calm', 
    label: 'Calm', 
    icon: '😌',
    recommendedInterventions: [
      {
        key: 'meditation',
        label: 'Breathwork',
        icon: '🧘',
        improvements: ['Vagal tone', 'Instant calm'],
        readout: 'Directly activates the parasympathetic nervous system.'
      },
      {
        key: 'ltheanine',
        label: 'L-Theanine',
        icon: '🍵',
        improvements: ['Relaxation', 'No sedation'],
        readout: 'Increases alpha waves for a zen-like state of mind.'
      },
      {
        key: 'magnesium',
        label: 'Magnesium',
        icon: '💎',
        improvements: ['Stress buffer', 'Physical ease'],
        readout: 'Prevents stress hormones from overstimulating your system.'
      }
    ]
  },
  { 
    id: 'longevity', 
    label: 'Longevity', 
    icon: '🏃',
    recommendedInterventions: [
      {
        key: 'exercise',
        label: 'Zone 2 Cardio',
        icon: '🏃',
        improvements: ['Mitochondrial health', 'Metabolic flexibility'],
        readout: 'Increases mitochondrial density and efficiency for long-term healthspan.'
      },
      {
        key: 'sleep',
        label: 'Quality Sleep',
        icon: '🌙',
        improvements: ['Autophagy', 'Cellular repair'],
        readout: 'Activates the glymphatic system to clear metabolic waste from the brain.'
      },
      {
        key: 'magnesium',
        label: 'Trace Minerals',
        icon: '💎',
        improvements: ['DNA stability', 'Enzyme cofactor'],
        readout: 'Supports over 300 biochemical reactions essential for cellular maintenance.'
      }
    ]
  },
];
