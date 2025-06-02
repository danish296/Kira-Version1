import { kv } from '@vercel/kv'

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
  editHistory?: string[]
}

// Generate secure ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// Serialize dates for KV storage
function serializeForStorage(obj: any): any {
  const serialized = { ...obj }
  Object.keys(serialized).forEach(key => {
    if (serialized[key] instanceof Date) {
      serialized[key] = serialized[key].toISOString()
    }
  })
  return serialized
}

// Deserialize dates from KV storage
function deserializeFromStorage(obj: any): any {
  if (!obj) return null
  const deserialized = { ...obj }
  Object.keys(deserialized).forEach(key => {
    if (key.endsWith('At') || key.includes('Date')) {
      deserialized[key] = new Date(deserialized[key])
    }
  })
  return deserialized
}

export const db = {
  users: {
    async create(user: Omit<User, "id" | "createdAt" | "isActive">) {
      const newUser: User = {
        ...user,
        id: generateId(),
        createdAt: new Date(),
        isActive: true,
      }
      
      const serializedUser = serializeForStorage(newUser)
      
      // Store user by ID and create email index
      await kv.hset(`user:${newUser.id}`, serializedUser)
      await kv.set(`user:email:${user.email.toLowerCase()}`, newUser.id)
      
      return newUser
    },

    async findByEmail(email: string) {
      const userId = await kv.get(`user:email:${email.toLowerCase()}`)
      if (!userId) return null
      
      const userData = await kv.hgetall(`user:${userId}`)
      return deserializeFromStorage(userData) as User | null
    },

    async findById(id: string) {
      const userData = await kv.hgetall(`user:${id}`)
      return deserializeFromStorage(userData) as User | null
    },

    async updateLastLogin(id: string) {
      const user = await this.findById(id)
      if (!user) return null
      
      user.lastLoginAt = new Date()
      const serializedUser = serializeForStorage(user)
      await kv.hset(`user:${id}`, serializedUser)
      
      return user
    },

    async deactivate(id: string) {
      const user = await this.findById(id)
      if (!user) return null
      
      user.isActive = false
      const serializedUser = serializeForStorage(user)
      await kv.hset(`user:${id}`, serializedUser)
      
      return user
    }
  },

  chats: {
    async create(chat: Omit<Chat, "id" | "createdAt" | "updatedAt" | "isDeleted">) {
      const newChat: Chat = {
        ...chat,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      }
      
      const serializedChat = serializeForStorage(newChat)
      
      // Store chat and add to user's chat list
      await kv.hset(`chat:${newChat.id}`, serializedChat)
      await kv.sadd(`user:${chat.userId}:chats`, newChat.id)
      
      return newChat
    },

    async findByUserId(userId: string) {
      const chatIds = await kv.smembers(`user:${userId}:chats`)
      const chats: Chat[] = []
      
      for (const chatId of chatIds) {
        const chatData = await kv.hgetall(`chat:${chatId}`)
        const chat = deserializeFromStorage(chatData) as Chat
        if (chat && !chat.isDeleted) {
          chats.push(chat)
        }
      }
      
      return chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    },

    async findById(id: string) {
      const chatData = await kv.hgetall(`chat:${id}`)
      const chat = deserializeFromStorage(chatData) as Chat | null
      return chat && !chat.isDeleted ? chat : null
    },

    async update(id: string, updates: Partial<Chat>) {
      const chat = await this.findById(id)
      if (!chat) return null
      
      const updatedChat = { ...chat, ...updates, updatedAt: new Date() }
      const serializedChat = serializeForStorage(updatedChat)
      await kv.hset(`chat:${id}`, serializedChat)
      
      return updatedChat
    },

    async delete(id: string) {
      const chat = await this.findById(id)
      if (!chat) return null
      
      chat.isDeleted = true
      const serializedChat = serializeForStorage(chat)
      await kv.hset(`chat:${id}`, serializedChat)
      
      return chat
    }
  },

  messages: {
    async create(message: Omit<Message, "id" | "createdAt" | "isDeleted">) {
      const newMessage: Message = {
        ...message,
        id: generateId(),
        createdAt: new Date(),
        isDeleted: false,
      }
      
      const serializedMessage = serializeForStorage(newMessage)
      
      // Store message and add to chat's message list
      await kv.hset(`message:${newMessage.id}`, serializedMessage)
      await kv.sadd(`chat:${message.chatId}:messages`, newMessage.id)
      
      return newMessage
    },

    async findByChatId(chatId: string) {
      const messageIds = await kv.smembers(`chat:${chatId}:messages`)
      const messages: Message[] = []
      
      for (const messageId of messageIds) {
        const messageData = await kv.hgetall(`message:${messageId}`)
        const message = deserializeFromStorage(messageData) as Message
        if (message && !message.isDeleted) {
          messages.push(message)
        }
      }
      
      return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    },

    async findById(id: string) {
      const messageData = await kv.hgetall(`message:${id}`)
      const message = deserializeFromStorage(messageData) as Message | null
      return message && !message.isDeleted ? message : null
    },

    async update(id: string, updates: Partial<Message>) {
      const message = await this.findById(id)
      if (!message) return null
      
      // Track edit history
      if (updates.content && message.content !== updates.content) {
        const editHistory = message.editHistory || []
        editHistory.push(message.content)
        updates.editHistory = editHistory
      }
      
      const updatedMessage = { ...message, ...updates }
      const serializedMessage = serializeForStorage(updatedMessage)
      await kv.hset(`message:${id}`, serializedMessage)
      
      return updatedMessage
    },

    async delete(id: string) {
      const message = await this.findById(id)
      if (!message) return null
      
      message.isDeleted = true
      const serializedMessage = serializeForStorage(message)
      await kv.hset(`message:${id}`, serializedMessage)
      
      return message
    }
  }
}
