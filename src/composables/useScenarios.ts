import { computed } from 'vue';
import type { Scenario, UUID } from '@/types';
import { useScenariosStore } from '@/stores/scenarios';
import { useTimelineStore } from '@/stores/timeline';
import { useEngineStore } from '@/stores/engine';

export const useScenarios = () => {
  const scenarios = useScenariosStore();
  const timeline = useTimelineStore();
  const engine = useEngineStore();

  const list = computed(() => scenarios.items);
  const active = computed(() => scenarios.active);

  const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

  const scenarioName = (name?: string) => name ?? scenarios.active?.name ?? 'Untitled scenario';

  const snapshot = (name?: string) => ({
    name: scenarioName(name),
    gridStepMin: engine.gridStepMin,
    items: clone(timeline.items),
    personal: scenarios.active?.personal,
    notes: scenarios.active?.notes,
  });

  const saveScenario = (name?: string) => {
    const data = snapshot(name);
    if (scenarios.activeId) {
      scenarios.update(scenarios.activeId, data);
    } else {
      const created = scenarios.create(data);
      scenarios.setActive(created.id);
    }
  };

  const loadScenario = (id: UUID) => {
    const scenario = scenarios.items.find((item) => item.id === id);
    if (!scenario) return;
    scenarios.setActive(id);
    timeline.setItems(clone(scenario.items));
    engine.setGridStep(scenario.gridStepMin);
  };

  const exportScenario = (id: UUID) => {
    const scenario = scenarios.items.find((item) => item.id === id);
    return scenario ? JSON.stringify(scenario, null, 2) : undefined;
  };

  const importScenario = (json: string) => {
    const data = JSON.parse(json) as Scenario;
    const imported = scenarios.ingest(data);
    loadScenario(imported.id);
  };

  const removeScenario = (id: UUID) => {
    scenarios.remove(id);
  };

  return { list, active, saveScenario, loadScenario, exportScenario, importScenario, removeScenario };
};
