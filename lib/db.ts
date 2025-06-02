// Enhanced database with message update functionality
export interface User {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
}

export interface Chat {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  chatId: string
  role: "user" | "assistant"
  content: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  createdAt: Date
}

// In-memory storage (replace with real database)
const users: User[] = []
const chats: Chat[] = []
const messages: Message[] = []

export const db = {
  users: {
    create: (user: Omit<User, "id" | "createdAt">) => {
      const newUser: User = {
        ...user,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      }
      users.push(newUser)
      return newUser
    },
    findByEmail: (email: string) => users.find((u) => u.email === email),
    findById: (id: string) => users.find((u) => u.id === id),
  },
  chats: {
    create: (chat: Omit<Chat, "id" | "createdAt" | "updatedAt">) => {
      const newChat: Chat = {
        ...chat,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      chats.push(newChat)
      return newChat
    },
    findByUserId: (userId: string) =>
      chats.filter((c) => c.userId === userId).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    findById: (id: string) => chats.find((c) => c.id === id),
    update: (id: string, updates: Partial<Chat>) => {
      const index = chats.findIndex((c) => c.id === id)
      if (index !== -1) {
        chats[index] = { ...chats[index], ...updates, updatedAt: new Date() }
        return chats[index]
      }
      return null
    },
  },
  messages: {
    create: (message: Omit<Message, "id" | "createdAt">) => {
      const newMessage: Message = {
        ...message,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      }
      messages.push(newMessage)
      return newMessage
    },
    findByChatId: (chatId: string) =>
      messages.filter((m) => m.chatId === chatId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    findById: (id: string) => messages.find((m) => m.id === id),
    update: (id: string, updates: Partial<Message>) => {
      const index = messages.findIndex((m) => m.id === id)
      if (index !== -1) {
        messages[index] = { ...messages[index], ...updates }
        return messages[index]
      }
      return null
    },
    delete: (id: string) => {
      const index = messages.findIndex((m) => m.id === id)
      if (index !== -1) {
        return messages.splice(index, 1)[0]
      }
      return null
    },
  },
}
