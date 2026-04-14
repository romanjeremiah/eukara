export default {
	async fetch(request, env) {
		const TELEGRAM_TOKEN = "8687626790:AAGDUST0DnvRCRmbZ7GvBt_scrkbbfhUla8";

		if (request.method === "POST") {
			try {
				const update = await request.json();
				if (!update.message || !update.message.text) return new Response("OK");

				const chatId = update.message.chat.id;
				const userText = update.message.text;
				const userTextLower = userText.toLowerCase();

				// 1. HANDLE DRAW COMMAND
				if (userTextLower.startsWith("/draw")) {
					const prompt = userText.slice(6).trim();
					if (!prompt) {
						await sendMessage(chatId, "What should I draw? Try: /draw a cyber-punk park 🎨", TELEGRAM_TOKEN);
						return new Response("OK");
					}

					await sendMessage(chatId, "🎨 Thinking... I am picking up my brushes!", TELEGRAM_TOKEN);

					try {
						const imageResponse = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', { prompt: prompt });
						await sendPhoto(chatId, imageResponse, TELEGRAM_TOKEN);
					} catch (drawError) {
						// This will send the exact error back to your Telegram chat
						await sendMessage(chatId, `❌ Drawing failed: ${drawError.message}`, TELEGRAM_TOKEN);
					}
				}

				// 2. HANDLE REMINDER COMMANDS
				else if (userTextLower.startsWith("/remind") || userTextLower.startsWith("/daily")) {
					const isRecurring = userTextLower.startsWith("/daily") ? 1 : 0;
					const parts = userTextLower.split(" ");
					const timeInput = parts[1];
					const task = userText.split(" ").slice(2).join(" ");

					const seconds = parseTimeToSeconds(timeInput);

					if (!seconds || !task) {
						await sendMessage(chatId, "Try these formats:\n• /remind 2h Gym\n• /daily 08:30 Vitamin", TELEGRAM_TOKEN);
					} else {
						const dueAt = Math.floor(Date.now() / 1000) + seconds;

						const triggerTime = new Date(dueAt * 1000).toLocaleString("en-GB", {
							timeZone: "Europe/London",
							hour: '2-digit',
							minute: '2-digit',
							day: '2-digit',
							month: 'short'
						});

						await env.DB.prepare("INSERT INTO reminders (chat_id, text, due_at, is_recurring) VALUES (?, ?, ?, ?)")
							.bind(chatId, task, dueAt, isRecurring)
							.run();

						const type = isRecurring ? "Daily reminder" : "Reminder";
						await sendMessage(chatId, `Success! ${type} set for "${task}" at ${triggerTime} London time ✅`, TELEGRAM_TOKEN);
					}
				}

				// 3. NORMAL AI CHAT
				else {
					const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
						messages: [
							{
								role: 'system',
								content: `Your name is KVN. You are a supportive, witty, and authentic friend well-versed in ADHD and mental health. Your tone is curious and collaborative rather than merely agreeable. Ask exploratory questions like “What makes you think that?” to help clarify reasoning. Always use metric units. Avoid employing em dashes in your writing. Use a vibrant visual style with a wide variety of appropriate emojis. Keep responses concise, clear, and well-structured, favouring formats such as checklists when offering advice. Distinguish facts from interpretations, and be honest about uncertainty. You love discussing the gym, rollerblading, photography, anime, tech innovations, AI, ServiceNow features, music, music events in London, and cooking. Be a considerate partner for personal growth, balancing empathy with accountability. Keep responses brief yet warm and encouraging. IMPORTANT: Ensure you complete every sentence and thought within your response limit.`
							},
							{ role: 'user', content: userText }
						],
						max_tokens: 1200
					});
					await sendMessage(chatId, aiResponse.response, TELEGRAM_TOKEN);
				}
			} catch (err) {
				return new Response("OK");
			}
		}
		return new Response("OK");
	},

	async scheduled(event, env, ctx) {
		const TELEGRAM_TOKEN = "8687626790:AAGDUST0DnvRCRmbZ7GvBt_scrkbbfhUla8";
		const now = Math.floor(Date.now() / 1000);

		const { results } = await env.DB.prepare("SELECT * FROM reminders WHERE due_at <= ?")
			.bind(now).all();

		for (const reminder of results) {
			await sendMessage(reminder.chat_id, `⏰ Reminder: ${reminder.text} ✨`, TELEGRAM_TOKEN);

			if (reminder.is_recurring) {
				const nextDue = reminder.due_at + (24 * 60 * 60);
				await env.DB.prepare("UPDATE reminders SET due_at = ? WHERE id = ?").bind(nextDue, reminder.id).run();
			} else {
				await env.DB.prepare("DELETE FROM reminders WHERE id = ?").bind(reminder.id).run();
			}
		}
	}
};

async function sendMessage(chatId, text, token) {
	const url = `https://api.telegram.org/bot${token}/sendMessage`;
	await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ chat_id: chatId, text: text })
	});
}

async function sendPhoto(chatId, imageBuffer, token) {
	const url = `https://api.telegram.org/bot${token}/sendPhoto`;
	const formData = new FormData();
	formData.append("chat_id", chatId);
	// Using File instead of Blob to ensure Telegram accepts the payload
	formData.append("photo", new File([imageBuffer], "ai_art.png", { type: "image/png" }));

	const response = await fetch(url, { method: "POST", body: formData });
	const result = await response.json();

	if (!result.ok) {
		throw new Error(result.description);
	}
}

function parseTimeToSeconds(input) {
	if (!input) return null;
	if (input.includes(":") || input.includes("pm") || input.includes("am")) {
		const nowLondon = new Date(new Date().toLocaleString("en-GB", { timeZone: "Europe/London" }));
		let [hours, minutes] = input.replace(/(am|pm)/, "").split(":").map(Number);
		if (input.includes("pm") && hours < 12) hours += 12;
		if (input.includes("am") && hours === 12) hours = 0;
		if (isNaN(minutes)) minutes = 0;
		const targetLondon = new Date(nowLondon);
		targetLondon.setHours(hours, minutes, 0, 0);
		if (targetLondon < nowLondon) targetLondon.setDate(targetLondon.getDate() + 1);
		return Math.floor((targetLondon - nowLondon) / 1000);
	}
	const value = parseInt(input);
	if (isNaN(value)) return null;
	if (input.endsWith("d")) return value * 86400;
	if (input.endsWith("h")) return value * 3600;
	if (input.endsWith("m") || !isNaN(input)) return value * 60;
	return null;
}
