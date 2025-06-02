import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
export { db } from './db-vercel'
export interface User {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

export interface Chat {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
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
  isDeleted: boolean
  editHistory?: string[] // Track message edits
}

// Data storage path
const DATA_DIR = join(process.cwd(), 'data')
const USERS_FILE = join(DATA_DIR, 'users.json')
const CHATS_FILE = join(DATA_DIR, 'chats.json')
const MESSAGES_FILE = join(DATA_DIR, 'messages.json')

// Initialize data directory
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

// Load data from file
async function loadData<T>(filepath: string, defaultValue: T[] = []): Promise<T[]> {
  try {
    await ensureDataDir()
    if (!existsSync(filepath)) {
      await saveData(filepath, defaultValue)
      return defaultValue
    }
    const data = await readFile(filepath, 'utf-8')
    return JSON.parse(data, (key, value) => {
      // Parse dates
      if (key.endsWith('At') || key.includes('Date')) {
        return new Date(value)
      }
      return value
    })
  } catch (error) {
    console.error(`Error loading data from ${filepath}:`, error)
    return defaultValue
  }
}

// Save data to file
async function saveData<T>(filepath: string, data: T[]): Promise<void> {
  try {
    await ensureDataDir()
    await writeFile(filepath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Error saving data to ${filepath}:`, error)
  }
}

// Generate secure ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export const db = {
  users: {
    async create(user: Omit<User, "id" | "createdAt" | "isActive">) {
      const users = await loadData<User>(USERS_FILE)
      const newUser: User = {
        ...user,
        id: generateId(),
        createdAt: new Date(),
        isActive: true,
      }
      users.push(newUser)
      await saveData(USERS_FILE, users)
      return newUser
    },

    async findByEmail(email: string) {
      const users = await loadData<User>(USERS_FILE)
      return users.find((u) => u.email === email && u.isActive)
    },

    async findById(id: string) {
      const users = await loadData<User>(USERS_FILE)
      return users.find((u) => u.id === id && u.isActive)
    },

    async updateLastLogin(id: string) {
      const users = await loadData<User>(USERS_FILE)
      const index = users.findIndex((u) => u.id === id)
      if (index !== -1) {
        users[index].lastLoginAt = new Date()
        await saveData(USERS_FILE, users)
        return users[index]
      }
      return null
    },

    async deactivate(id: string) {
      const users = await loadData<User>(USERS_FILE)
      const index = users.findIndex((u) => u.id === id)
      if (index !== -1) {
        users[index].isActive = false
        await saveData(USERS_FILE, users)
        return users[index]
      }
      return null
    }
  },

  chats: {
    async create(chat: Omit<Chat, "id" | "createdAt" | "updatedAt" | "isDeleted">) {
      const chats = await loadData<Chat>(CHATS_FILE)
      const newChat: Chat = {
        ...chat,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      }
      chats.push(newChat)
      await saveData(CHATS_FILE, chats)
      return newChat
    },

    async findByUserId(userId: string) {
      const chats = await loadData<Chat>(CHATS_FILE)
      return chats
        .filter((c) => c.userId === userId && !c.isDeleted)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    },

    async findById(id: string) {
      const chats = await loadData<Chat>(CHATS_FILE)
      return chats.find((c) => c.id === id && !c.isDeleted)
    },

    async update(id: string, updates: Partial<Chat>) {
      const chats = await loadData<Chat>(CHATS_FILE)
      const index = chats.findIndex((c) => c.id === id && !c.isDeleted)
      if (index !== -1) {
        chats[index] = { ...chats[index], ...updates, updatedAt: new Date() }
        await saveData(CHATS_FILE, chats)
        return chats[index]
      }
      return null
    },

    async delete(id: string) {
      const chats = await loadData<Chat>(CHATS_FILE)
      const index = chats.findIndex((c) => c.id === id)
      if (index !== -1) {
        chats[index].isDeleted = true
        await saveData(CHATS_FILE, chats)
        return chats[index]
      }
      return null
    }
  },

  messages: {
    async create(message: Omit<Message, "id" | "createdAt" | "isDeleted">) {
      const messages = await loadData<Message>(MESSAGES_FILE)
      const newMessage: Message = {
        ...message,
        id: generateId(),
        createdAt: new Date(),
        isDeleted: false,
      }
      messages.push(newMessage)
      await saveData(MESSAGES_FILE, messages)
      return newMessage
    },

    async findByChatId(chatId: string) {
      const messages = await loadData<Message>(MESSAGES_FILE)
      return messages
        .filter((m) => m.chatId === chatId && !m.isDeleted)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    },

    async findById(id: string) {
      const messages = await loadData<Message>(MESSAGES_FILE)
      return messages.find((m) => m.id === id && !m.isDeleted)
    },

    async update(id: string, updates: Partial<Message>) {
      const messages = await loadData<Message>(MESSAGES_FILE)
      const index = messages.findIndex((m) => m.id === id && !m.isDeleted)
      if (index !== -1) {
        // Track edit history
        if (updates.content && messages[index].content !== updates.content) {
          const editHistory = messages[index].editHistory || []
          editHistory.push(messages[index].content)
          updates.editHistory = editHistory
        }
        
        messages[index] = { ...messages[index], ...updates }
        await saveData(MESSAGES_FILE, messages)
        return messages[index]
      }
      return null
    },

    async delete(id: string) {
      const messages = await loadData<Message>(MESSAGES_FILE)
      const index = messages.findIndex((m) => m.id === id)
      if (index !== -1) {
        messages[index].isDeleted = true
        await saveData(MESSAGES_FILE, messages)
        return messages[index]
      }
      return null
    }
  }
}
