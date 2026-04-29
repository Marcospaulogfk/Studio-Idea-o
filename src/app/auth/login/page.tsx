'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
    >
      {pending && <Loader2 size={18} className="animate-spin" />}
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  )
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction] = useFormState(login, null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm border border-white/20">
            <span className="text-2xl font-bold text-white">SI</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Studio Ideação</h1>
          <p className="text-brand-200 mt-1 text-sm">CRM · ERP · Business Intelligence</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Entrar na sua conta</h2>

          {state?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                name="email"
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <SubmitButton />

            <div className="text-center mt-3">
              <a href="/auth/reset-password" className="text-xs text-gray-400 hover:text-brand-700 transition-colors">
                Esqueci minha senha
              </a>
            </div>
          </form>
        </div>

        <p className="text-center text-brand-300 text-xs mt-6">
          Studio Ideação Ltda · Sistema interno
        </p>
      </div>
    </div>
  )
}
