"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: { id: string; email: string; name: string }
}

export function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [autoSave, setAutoSave] = useState(true)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Customize your Kira V1 experience</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Account</Label>
            <div className="text-sm text-zinc-600">
              <p>Email: {user.email}</p>
              <p>Name: {user.name}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Preferences</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Dark Mode</Label>
                <p className="text-xs text-zinc-500">Toggle dark theme</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Notifications</Label>
                <p className="text-xs text-zinc-500">Receive chat notifications</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Auto-save Chats</Label>
                <p className="text-xs text-zinc-500">Automatically save conversations</p>
              </div>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onClose} className="flex-1">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
