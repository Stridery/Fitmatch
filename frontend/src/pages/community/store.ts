import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { api } from "./api";

export type TabKey = "messages" | "contacts" | "posts";

export interface CommunityUser {
	id: string;
	nickname: string;
	email: string;
	avatarUrl: string;
}

export interface ConversationSummary {
	id: string;
	otherUser: CommunityUser;
	updatedAt: string;
	lastMessage?: { id: string; content: string; createdAt: string } | null;
}

export interface MessageItem {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	createdAt: string;
	isMine?: boolean;
}

interface LoadingState {
	conversations: boolean;
	contacts: boolean;
	messages: boolean;
}

interface ErrorState {
	conversations?: string;
	contacts?: string;
	messages?: string;
}

interface CommunityState {
	currentTab: TabKey;
	setCurrentTab: (tab: TabKey) => void;

	conversations: ConversationSummary[];
	contacts: CommunityUser[];
	selectedConversationId: string | null;

	messages: Record<string, MessageItem[]>;

	loading: LoadingState;
	errors: ErrorState;

	// Socket
	socket: Socket | null;
	currentUserId: string | null;
	setCurrentUserId: (userId: string | null) => void;
	ensureSocket: (userId: string) => void;

	// Data actions
	fetchConversations: () => Promise<void>;
	fetchContacts: () => Promise<void>;
	selectConversation: (conversationId: string) => void;
	fetchMessageHistory: (conversationId: string) => Promise<void>;
	startConversationWithUser: (user: CommunityUser) => Promise<void>;
	sendMessage: (params: { conversationId: string; content: string }) => void;
}

// Using real API module; functions are placeholders to be implemented later.

export const useCommunityStore = create<CommunityState>((set, get) => ({
	currentTab: "messages",
	setCurrentTab: (tab) => set({ currentTab: tab }),

	conversations: [],
	contacts: [],
	selectedConversationId: null,
	messages: {},

	loading: { conversations: false, contacts: false, messages: false },
	errors: {},

	socket: null,
	currentUserId: null,
	setCurrentUserId: (userId) => set({ currentUserId: userId }),
	ensureSocket: (userId: string) => {
		let socket = get().socket;
		if (socket && socket.connected) return;

		const url = (import.meta as any).env?.VITE_CHAT_WS_URL || "";
		if (!url) {
			console.warn("VITE_CHAT_WS_URL is not set; skipping socket connection");
			return;
		}
		socket = io(url, {
			transports: ["websocket"],
			autoConnect: true,
			auth: { userId },
		});

		socket.on("connect_error", (err) => {
			console.error("Socket connect error", err.message);
		});

		socket.on("message:new", (msg: MessageItem) => {
			const { selectedConversationId } = get();
			set((state) => {
				const existing = state.messages[msg.conversationId] || [];
				const updated = [...existing, msg];
				return { messages: { ...state.messages, [msg.conversationId]: updated } };
			});
			if (selectedConversationId !== msg.conversationId) {
				// Could add unread count handling here
			}
		});

		set({ socket });
	},

	fetchConversations: async () => {
		set((s) => ({ loading: { ...s.loading, conversations: true }, errors: { ...s.errors, conversations: undefined } }));
		try {
			const list = await api.listConversations();
			set((s) => ({ conversations: list, loading: { ...s.loading, conversations: false } }));
		} catch (e: any) {
			set((s) => ({ loading: { ...s.loading, conversations: false }, errors: { ...s.errors, conversations: e?.message || "Failed to load" } }));
		}
	},

	fetchContacts: async () => {
		set((s) => ({ loading: { ...s.loading, contacts: true }, errors: { ...s.errors, contacts: undefined } }));
		try {
			const list = await api.listContacts();
			set((s) => ({ contacts: list, loading: { ...s.loading, contacts: false } }));
		} catch (e: any) {
			set((s) => ({ loading: { ...s.loading, contacts: false }, errors: { ...s.errors, contacts: e?.message || "Failed to load" } }));
		}
	},

	selectConversation: (conversationId: string) => {
		set({ selectedConversationId: conversationId });
	},

	fetchMessageHistory: async (conversationId: string) => {
		set((s) => ({ loading: { ...s.loading, messages: true }, errors: { ...s.errors, messages: undefined } }));
		try {
			const list = await api.getMessages(conversationId);
			set((s) => ({
				messages: { ...s.messages, [conversationId]: list },
				loading: { ...s.loading, messages: false },
			}));
		} catch (e: any) {
			set((s) => ({ loading: { ...s.loading, messages: false }, errors: { ...s.errors, messages: e?.message || "Failed to load" } }));
		}
	},

	startConversationWithUser: async (user: CommunityUser) => {
		const convo = await api.ensureConversationWith(user.id);
		set((s) => ({ currentTab: "messages", selectedConversationId: convo.id, conversations: s.conversations.some(c => c.id === convo.id) ? s.conversations : [convo, ...s.conversations] }));
	},

	sendMessage: ({ conversationId, content }) => {
		const currentUserId = get().currentUserId || undefined;
		if (!currentUserId) return;

		const socket = get().socket;
		if (!socket || !socket.connected) {
			get().ensureSocket(currentUserId);
		}

		const tempId = `tmp_${Date.now()}`;
		const optimistic: MessageItem = {
			id: tempId,
			conversationId,
			senderId: currentUserId,
			content,
			createdAt: new Date().toISOString(),
			isMine: true,
		};

		set((state) => {
			const existing = state.messages[conversationId] || [];
			return { messages: { ...state.messages, [conversationId]: [...existing, optimistic] } };
		});

		// Emit via socket
		const payload = { conversationId, content } as any;
		get().socket?.emit("message:send", payload);
	},
}));