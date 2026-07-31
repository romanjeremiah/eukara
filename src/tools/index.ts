// ============================================================
// Tool Registry
//
// Single source of truth for all available tools.
// All tools use OpenAI-compatible schema format.
// Import this array into the message handler.
// ============================================================

import type { AITool } from '../types/ai';

// Memory & Episodes
import { saveMemory, supersedeMemory, saveEpisode, updateEpisodeOutcome } from './memory-tools';

// Telegram Interactions
import { reactToMessage, pinMessage, sendLocation, sendDraft, replyWithQuote, sendVoiceNote, lookupCustomEmoji } from './telegram-tools';

// Reminders & Schedule
import { setReminder, updateTimezone, setQuietHours, clearQuietHours, listReminders, updateReminder, clearReminders } from './reminder-tools';

// Mood Journal
import { logMoodEntry, getMoodHistory } from './mood-tools';

// Therapeutic
import { saveTherapeuticNote, getTherapeuticNotes } from './therapeutic-tools';

// Web
import { readWebpage, webSearchTavily } from './web-tools';

// GitHub
import { readRepoFile, patchRepoFile } from './github-tools';

// Media
import { generateImage, messageEffect } from './media-tools';

// Checklist (interactive, port from Xaridotis 2026-06-06)
import { createChecklist } from './checklist-tools';

// Research
import { searchResearch, startDeepResearch } from './research-tools';

/**
 * All registered tools. This array is passed to the AI provider.
 */
export const allTools: AITool[] = [
	// Core memory
	saveMemory,
	supersedeMemory,
	saveEpisode,
	updateEpisodeOutcome,

	// Telegram
	reactToMessage,
	pinMessage,
	sendLocation,
	sendDraft,
	replyWithQuote,
	sendVoiceNote,
	lookupCustomEmoji,

	// Scheduling
	setReminder,
	updateTimezone,
	setQuietHours,
	clearQuietHours,
	listReminders,
	updateReminder,
	clearReminders,

	// Mood & Health
	logMoodEntry,
	getMoodHistory,

	// Therapeutic
	saveTherapeuticNote,
	getTherapeuticNotes,

	// Web
	readWebpage,
	webSearchTavily,

	// GitHub
	readRepoFile,
	patchRepoFile,

	// Media
	generateImage,
	messageEffect,

	// Checklist (interactive, port from Xaridotis 2026-06-06)
	createChecklist,

	// Research
	searchResearch,
	startDeepResearch,
];

/**
 * Get tool definitions only (for passing to AI provider).
 */
export const toolSchemas = allTools.map(t => t.schema);

/**
 * Look up a tool by name.
 */
export function findTool(name: string): AITool | undefined {
	return allTools.find(t => t.schema.function.name === name);
}
