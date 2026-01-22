import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        if (!username.trim()) {
          throw new Error('ユーザーネームを入力してください')
        }
        const { error } = await signUp(email, password, username)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #E8E4FF 100%)' }}
    >
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 
          className="text-5xl font-extrabold tracking-tight mb-2"
          style={{ 
            background: 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          RealTalk
        </h1>
        <p className="text-sm tracking-widest uppercase text-gray-500">
          飾らない、素の自分で
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl shadow-purple-500/10">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
              isLogin ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
              !isLogin ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
            }`}
          >
            はじめる
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                ユーザーネーム
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_name"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 text-gray-800 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 text-gray-800 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 text-gray-800 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50"
            style={{ 
              background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
              boxShadow: '0 4px 14px rgba(108, 92, 231, 0.4)'
            }}
          >
            {loading ? '...' : isLogin ? '続ける' : 'アカウント作成'}
          </button>
        </form>
      </div>
    </div>
  )
}
