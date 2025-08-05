"use client"

import { useState } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Upload, User } from "lucide-react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"

export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal")
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("free")
  const [user, setUser] = useState({
    name: "Miguel Ángel Ortiz Sierra",
    email: "miguelortiz.maos@gmail.com",
    emailNotifications: true,
    darkMode: false
  })
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)
    // Simulate saving changes
    setTimeout(() => {
      setLoading(false)
      // Handle successful save
    }, 1000)
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-display font-bold text-center mb-8 text-blue-900">Mi perfil</h1>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-2xl font-bold">
                {user.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-blue-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-display font-semibold text-blue-900 mb-4">Información personal</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <Input
                      type="text"
                      value={user.name}
                      onChange={(e) => setUser({ ...user, name: e.target.value })}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <Input
                      type="email"
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-display font-semibold text-blue-900 mb-4">Preferencias</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Notificaciones por correo</label>
                    <Switch
                      checked={user.emailNotifications}
                      onCheckedChange={(checked) => setUser({ ...user, emailNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Modo oscuro</label>
                    <Switch
                      checked={user.darkMode}
                      onCheckedChange={(checked) => setUser({ ...user, darkMode: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white shadow-sm"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

