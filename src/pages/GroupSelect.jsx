import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ICON_OPTIONS = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し']
const ICON_COLORS = ['#6C5CE7', '#A29BFE', '#FD79A8', '#E17055', '#00B894', '#00CEC9', '#0984E3', '#2D3436']

export default function GroupSelect() {
  const { updateProfile } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedIcon, setSelectedIcon] = useState('あ')
  const [selectedColor, setSelectedColor] = useState('#6C5CE7')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name')
    
    if (!error && data) {
      setGroups(data)
    }
  }

  const handleSubmit = async () => {
    if (!selectedGroup) return
    
    setLoading(true)
    setError('')

    const { error } = await updateProfile({
      group_id: selectedGroup,
      icon_char: selectedIcon,
      icon_color: selectedColor
    })

    if (error) {
      setError('エラーが発生しました')
    }
    setLoading(false)
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #E8E4FF 100%)' }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl shadow-purple-500/10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">プロフィール設定</h2>
          <p className="text-gray-500 text-sm">アイコンとグループを選んでね</p>
        </div>

        {/* Icon Character */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            アイコン文字
          </label>
          <div className="flex flex-wrap gap-2 justify-center">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon(icon)}
                className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                  selectedIcon === icon 
                    ? 'text-white scale-110' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                style={selectedIcon === icon ? { 
                  backgroundColor: selectedColor,
                  boxShadow: `0 0 0 3px ${selectedColor}40`
                } : {}}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            カラー
          </label>
          <div className="flex flex-wrap gap-3 justify-center">
            {ICON_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-9 h-9 rounded-full transition-all ${
                  selectedColor === color ? 'scale-110' : ''
                }`}
                style={{ 
                  backgroundColor: color,
                  boxShadow: selectedColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Groups */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            グループ
          </label>
          <div className="space-y-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group.id)}
                className={`w-full p-4 rounded-xl text-left font-semibold transition-all flex justify-between items-center ${
                  selectedGroup === group.id
                    ? 'bg-primary/10 text-primary border-2 border-primary'
                    : 'bg-gray-50 text-gray-700 border-2 border-transparent'
                }`}
              >
                <span>{group.name}</span>
                {selectedGroup === group.id && <span>→</span>}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedGroup || loading}
          className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-40"
          style={{ 
            background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
            boxShadow: selectedGroup ? '0 4px 14px rgba(108, 92, 231, 0.4)' : 'none'
          }}
        >
          {loading ? '...' : '次へ'}
        </button>
      </div>
    </div>
  )
}
