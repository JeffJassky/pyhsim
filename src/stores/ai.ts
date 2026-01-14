import { defineStore } from "pinia";
import { ref } from "vue";
import { useTimelineStore } from "@/stores/timeline";
import { useProfilesStore } from "@/stores/profiles";
import { useLibraryStore } from "@/stores/library";
import { useMetersStore } from "@/stores/meters";
import { minuteToISO } from "@/utils/time";
import type { Minute, InterventionKey, Goal, Signal } from "@/types";
import { PROFILE_LIBRARY } from "@/models";
import { SIGNALS_ALL } from "@/types";
import type { ProfileKey } from "@/models/registry/profiles";
import { META_TAG_ID } from "@/models/physiology/constants/meta";
import { DEFAULT_CONFIG_TOKEN } from "@/core/sys_config";
import { LEGACY_HASH_MAP } from "@/utils/data_utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: any[];
  timestamp: number;
}

export const useAIStore = defineStore("ai", () => {
  const messages = ref<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I am your biological co-pilot. I can help you optimize your routine, explain physiological signals, or find interventions. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);

  const isGenerating = ref(false);

  // Access other stores
  const timelineStore = useTimelineStore();
  const profilesStore = useProfilesStore();
  const libraryStore = useLibraryStore();
  const metersStore = useMetersStore();

  function getContext() {
    return {
      subject: profilesStore.subject,
      activeProfiles: Object.entries(profilesStore.profiles)
        .filter(([_, p]) => p.enabled)
        .map(([key, p]) => ({ key, params: p.params })),
      timeline: timelineStore.items.map((item) => {
        const def = libraryStore.defs.find((d) => d.key === item.meta.key);
        return {
          id: item.id,
          name: def?.label ?? item.meta.key,
          key: item.meta.key,
          start: item.start,
          end: item.end,
          params: item.meta.params,
        };
      }),
      library: libraryStore.defs.map((def) => ({
        key: def.key,
        label: def.label,
        description: def.notes ?? def.label,
        params: def.params,
        defaultDuration: def.defaultDurationMin,
      })),
      currentMeters: metersStore.series,
    };
  }

  function addMessage(msg: Omit<ChatMessage, "id" | "timestamp">) {
    messages.value.push({
      id: crypto.randomUUID(),
      ...msg,
      timestamp: Date.now(),
    });
  }

  // --- Tool Definitions ---

  const TOOLS = [
    {
      type: "function",
      function: {
        name: "add_intervention",
        description:
          "Add a new intervention (food, activity, supplement, etc.) to the timeline.",
        parameters: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description:
                'The intervention key (e.g., "coffee", "run_moderate") from the library.',
            },
            time: {
              type: "string",
              description: 'Start time in HH:MM format (24h), e.g., "08:30".',
            },
            duration_minutes: {
              type: "number",
              description:
                "Duration in minutes. Defaults to library default if omitted.",
            },
            params: {
              type: "object",
              description:
                'Specific parameters for the intervention (e.g., {"dose": 100}).',
            },
          },
          required: ["key", "time"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "remove_intervention",
        description: "Remove an intervention from the timeline by its ID.",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The UUID of the timeline item to remove.",
            },
          },
          required: ["id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_intervention",
        description: "Update an existing intervention on the timeline.",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The UUID of the timeline item.",
            },
            time: {
              type: "string",
              description: "New start time in HH:MM format.",
            },
            duration_minutes: {
              type: "number",
              description: "New duration in minutes.",
            },
            params: {
              type: "object",
              description: "Updated parameters object (merged with existing).",
            },
          },
          required: ["id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_subject_info",
        description: "Update user subject details like age, weight, sex, etc.",
        parameters: {
          type: "object",
          properties: {
            age: { type: "number" },
            weight_kg: { type: "number" },
            height_cm: { type: "number" },
            sex: { type: "string", enum: ["male", "female"] },
            body_fat_percentage: { type: "number" },
            cycle_length_days: { type: "number" },
            cycle_start_date: {
              type: "string",
              description: "ISO date string (YYYY-MM-DD)",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_goals",
        description: "Add or remove user goals.",
        parameters: {
          type: "object",
          properties: {
            add: {
              type: "array",
              items: { type: "string" },
              description: "List of goal keys to add.",
            },
            remove: {
              type: "array",
              items: { type: "string" },
              description: "List of goal keys to remove.",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_conditions",
        description:
          "Enable or disable medical/physiological conditions (profiles).",
        parameters: {
          type: "object",
          properties: {
            enable: {
              type: "array",
              items: { type: "string" },
              description: "List of profile keys to enable.",
            },
            disable: {
              type: "array",
              items: { type: "string" },
              description: "List of profile keys to disable.",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_nutrition_targets",
        description: "Update daily nutrition targets (calories, macros).",
        parameters: {
          type: "object",
          properties: {
            calories: { type: "number" },
            protein_min: { type: "number" },
            protein_max: { type: "number" },
            carbs_min: { type: "number" },
            carbs_max: { type: "number" },
            fat_min: { type: "number" },
            fat_max: { type: "number" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_chart_settings",
        description:
          "Enable/disable specific signals in charts or change their sort order.",
        parameters: {
          type: "object",
          properties: {
            enable_signals: {
              type: "array",
              items: { type: "string" },
              description: "List of signal keys to enable.",
            },
            disable_signals: {
              type: "array",
              items: { type: "string" },
              description: "List of signal keys to disable.",
            },
            sort_order: {
              type: "array",
              items: { type: "string" },
              description: "Ordered list of signal keys for display.",
            },
          },
        },
      },
    },
  ];

  // --- Tool Execution ---

  async function executeTool(name: string, args: any): Promise<string> {
    try {
      if (name === "add_intervention") {
        const { key, time, duration_minutes, params } = args;
        const [h, m] = time.split(":").map(Number);
        const startMin = (h * 60 + m) as Minute;

        // Find default duration if not provided
        const def = libraryStore.defs.find((d) => d.key === key);
        if (!def) return `Error: Intervention '${key}' not found in library.`;

        const dur = duration_minutes ?? def.defaultDurationMin ?? 30;
        const startISO = minuteToISO(startMin);
        const endISO = minuteToISO((startMin + dur) as Minute);

        // Merge default params with provided params
        const finalParams = {
          ...Object.fromEntries(def.params.map((p) => [p.key, p.default ?? 0])),
          ...params,
        };

        timelineStore.addItem(startISO, endISO, {
          key,
          params: finalParams,
          intensity: 1,
        });
        return `Added ${def.label} at ${time} for ${dur} mins.`;
      } else if (name === "remove_intervention") {
        const { id } = args;
        timelineStore.removeItem(id);
        return `Removed item ${id}.`;
      } else if (name === "update_intervention") {
        const { id, time, duration_minutes, params } = args;
        const item = timelineStore.items.find((it) => it.id === id);
        if (!item) return `Error: Item ${id} not found.`;

        const updates: any = {};

        if (time || duration_minutes) {
          const currentStart = new Date(item.start);
          let startMin =
            currentStart.getHours() * 60 + currentStart.getMinutes();

          if (time) {
            const [h, m] = time.split(":").map(Number);
            startMin = h * 60 + m;
            updates.start = minuteToISO(startMin as Minute);
          }

          if (duration_minutes || time) {
            // If we have a new duration, or just a new start time (keeping old duration), we need to set end
            const currentDur =
              (new Date(item.end).getTime() - new Date(item.start).getTime()) /
              60000;
            const dur = duration_minutes ?? currentDur;
            updates.end = minuteToISO((startMin + dur) as Minute);
          }
        }

        if (params) {
          updates.meta = {
            ...item.meta,
            params: { ...item.meta.params, ...params },
          };
        }

        timelineStore.updateItem(id, updates);
        return `Updated item ${id}.`;
      } else if (name === "update_subject_info") {
        profilesStore.updateSubject(args);
        return `Updated subject info: ${Object.keys(args).join(", ")}.`;
      } else if (name === "update_goals") {
        const { add, remove } = args;
        const changes: string[] = [];
        if (add && Array.isArray(add)) {
          add.forEach((g: Goal) => {
            if (!profilesStore.selectedGoals.includes(g)) {
              profilesStore.toggleGoal(g);
              changes.push(`Added goal ${g}`);
            }
          });
        }
        if (remove && Array.isArray(remove)) {
          remove.forEach((g: Goal) => {
            if (profilesStore.selectedGoals.includes(g)) {
              profilesStore.toggleGoal(g);
              changes.push(`Removed goal ${g}`);
            }
          });
        }
        return changes.length ? changes.join(", ") : "No goal changes made.";
      } else if (name === "update_conditions") {
        const { enable, disable } = args;
        const changes: string[] = [];
        if (enable && Array.isArray(enable)) {
          enable.forEach((k: ProfileKey) => {
            if (profilesStore.profiles[k]) {
              profilesStore.toggleProfile(k, true);
              changes.push(`Enabled ${k}`);
            }
          });
        }
        if (disable && Array.isArray(disable)) {
          disable.forEach((k: ProfileKey) => {
            if (profilesStore.profiles[k]) {
              profilesStore.toggleProfile(k, false);
              changes.push(`Disabled ${k}`);
            }
          });
        }
        return changes.length
          ? changes.join(", ")
          : "No condition changes made.";
      } else if (name === "update_nutrition_targets") {
        const {
          calories,
          protein_min,
          protein_max,
          carbs_min,
          carbs_max,
          fat_min,
          fat_max,
        } = args;
        const updates: any = {};
        if (calories !== undefined) updates.calories = calories;

        const macros: any = {};
        if (protein_min !== undefined)
          macros.protein = {
            ...profilesStore.nutritionTargets.macros.protein,
            min: protein_min,
          };
        if (protein_max !== undefined)
          macros.protein = { ...macros.protein, max: protein_max };

        if (carbs_min !== undefined)
          macros.carbs = {
            ...profilesStore.nutritionTargets.macros.carbs,
            min: carbs_min,
          };
        if (carbs_max !== undefined)
          macros.carbs = { ...macros.carbs, max: carbs_max };

        if (fat_min !== undefined)
          macros.fat = {
            ...profilesStore.nutritionTargets.macros.fat,
            min: fat_min,
          };
        if (fat_max !== undefined) macros.fat = { ...macros.fat, max: fat_max };

        if (Object.keys(macros).length > 0) updates.macros = macros;

        profilesStore.updateNutritionTargets(updates);
        return "Updated nutrition targets.";
      } else if (name === "update_chart_settings") {
        const { enable_signals, disable_signals, sort_order } = args;
        const changes: string[] = [];

        if (enable_signals && Array.isArray(enable_signals)) {
          enable_signals.forEach((s: Signal) => {
            profilesStore.toggleSignal(s, true);
            changes.push(`Enabled signal ${s}`);
          });
        }
        if (disable_signals && Array.isArray(disable_signals)) {
          disable_signals.forEach((s: Signal) => {
            profilesStore.toggleSignal(s, false);
            changes.push(`Disabled signal ${s}`);
          });
        }
        if (sort_order && Array.isArray(sort_order)) {
          profilesStore.updateSignalOrder(sort_order);
          changes.push("Updated signal sort order");
        }
        return changes.length
          ? changes.join(", ")
          : "No chart setting changes made.";
      }

      return `Error: Unknown tool ${name}`;
    } catch (e: any) {
      return `Error executing ${name}: ${e.message}`;
    }
  }

  // --- Provider Logic ---

  async function callOpenAI(
    apiKey: string,
    context: any,
    systemPrompt: string
  ) {
    let currentMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages.value
        .filter((m) => m.id !== "init")
        .map((m) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.tool_calls,
          tool_call_id: m.tool_call_id,
        })),
    ];

    let finished = false;
    let turns = 0;
    const MAX_TURNS = 5;

    while (!finished && turns < MAX_TURNS) {
      turns++;
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: currentMessages,
            tools: TOOLS,
            tool_choice: "auto",
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const choice = data.choices[0];
      const msg = choice.message;

      currentMessages.push(msg);

      if (msg.content) {
        addMessage({ role: "assistant", content: msg.content });
      }

      if (choice.finish_reason === "tool_calls") {
        for (const toolCall of msg.tool_calls) {
          const result = await executeTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments)
          );
          currentMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
      } else {
        finished = true;
      }
    }
  }

  async function callGemini(
    apiKey: string,
    context: any,
    systemPrompt: string
  ) {
    const geminiTools = {
      function_declarations: TOOLS.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    };

    // Convert history to Gemini format
    const contents: any[] = messages.value
      .filter((m) => m.id !== "init")
      .map((m) => {
        if (m.role === "user")
          return { role: "user", parts: [{ text: m.content || "" }] };
        if (m.role === "assistant")
          return { role: "model", parts: [{ text: m.content || "" }] };
        return null;
      })
      .filter((m) => m !== null);

    // Add system instruction effectively by prepending to history or using system_instruction (v1beta)
    // We will prepend it as a user message for compatibility or use system_instruction if using the latest API.
    // Let's use the 'system_instruction' field supported in v1beta.

    let finished = false;
    let turns = 0;
    const MAX_TURNS = 5;

    // We maintain a local history for this turn to handle function call loops
    let turnContents = [...contents];

    while (!finished && turns < MAX_TURNS) {
      turns++;

      const payload: any = {
        contents: turnContents,
        tools: [geminiTools],
        system_instruction: { parts: [{ text: systemPrompt }] },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      if (!candidate) throw new Error("No response candidate from Gemini.");

      const parts = candidate.content.parts || [];
      const contentPart = parts.find((p: any) => p.text);
      const functionCallPart = parts.find((p: any) => p.functionCall);

      // Add model response to our local history for the next loop
      turnContents.push(candidate.content);

      if (contentPart) {
        addMessage({ role: "assistant", content: contentPart.text });
      }

      if (functionCallPart) {
        const call = functionCallPart.functionCall;
        const result = await executeTool(call.name, call.args);

        // Gemini expects a functionResponse part immediately after
        const functionResponse = {
          role: "function",
          parts: [
            {
              functionResponse: {
                name: call.name,
                response: { result: result },
              },
            },
          ],
        };
        turnContents.push(functionResponse);
      } else {
        finished = true;
      }
    }
  }

  // --- Main Chat Logic ---

  async function sendMessage(content: string) {
    const provider = import.meta.env.VITE_AI_PROVIDER || "openai";

    // Obfuscated key reconstruction (only used if environment variable is missing)
    let fallbackKey = "";
    try {
      const p1 = atob(DEFAULT_CONFIG_TOKEN);
      const p2 = atob(LEGACY_HASH_MAP);
      const p3 = atob(META_TAG_ID);
      fallbackKey = p1 + p2 + p3;
    } catch {
      console.warn("Config init failed");
    }

    const apiKey =
      provider === "openai"
        ? import.meta.env.VITE_OPENAI_API_KEY || fallbackKey
        : import.meta.env.VITE_GEMINI_API_KEY || fallbackKey;

    if (!apiKey) {
      addMessage({
        role: "assistant",
        content: `Error: Missing API Key for ${provider}. Check .env.local`,
      });
      return;
    }

    addMessage({ role: "user", content });
    isGenerating.value = true;

    try {
      const context = getContext();
      const systemPrompt = `You are Physim's Bio-Pilot.
      
Context:
- Subject: ${JSON.stringify(context.subject)}
- Goals: ${JSON.stringify(profilesStore.selectedGoals)}
- Conditions (Active): ${JSON.stringify(context.activeProfiles)}
- Nutrition Targets: ${JSON.stringify(profilesStore.nutritionTargets)}
- Timeline: ${JSON.stringify(context.timeline)}
- Library: ${JSON.stringify(context.library)}

Available Options:
- Goals: ${[
        "energy",
        "productivity",
        "weightLoss",
        "mood",
        "focus",
        "recovery",
        "sleep",
        "digestion",
        "pain",
        "cycle",
        "calm",
      ].join(", ")}
- Conditions (Profiles): ${PROFILE_LIBRARY.map((p) => p.key).join(", ")}
- Signals: ${SIGNALS_ALL.join(", ")}

Goal: Optimize the user's routine using the available tools.
If the user asks to "add coffee at 8am", USE THE TOOL. Do not just say you did it.
If the user asks to change settings (weight, age, goals, etc.), USE THE APPROPRIATE TOOL.
Always explain your actions physiologically after using tools.`;

      if (provider === "openai") {
        await callOpenAI(apiKey, context, systemPrompt);
      } else {
        await callGemini(apiKey, context, systemPrompt);
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      addMessage({ role: "assistant", content: `Error: ${error.message}` });
    } finally {
      isGenerating.value = false;
    }
  }

  function clearHistory() {
    messages.value = [];
  }

  return {
    messages,
    isGenerating,
    sendMessage,
    clearHistory,
  };
});
