import { useState, useEffect, useRef } from 'react'
import { useBehaviorTracking } from '../hooks/useBehaviorTracking'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getDemoAnswers } from '../lib/demoData'

const ICON_COLORS = ['#6C5CE7', '#A29BFE', '#FD79A8', '#E17055', '#00B894', '#00CEC9', '#0984E3', '#2D3436']

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [myAnswer, setMyAnswer] = useState(null)
  const [answers, setAnswers] = useState([])
  const [activeTab, setActiveTab] = useState('group')
  const [myReactions, setMyReactions] = useState({})
  const [loading, setLoading] = useState(true)

   // ↓↓↓ ここから追加 ↓↓↓
   const prevAnswerRef = useRef('')
   const { 
     startTracking, 
     handleTextChange, 
     finishTracking, 
     resetTracking 
   } = useBehaviorTracking()
   // ↑↑↑ ここまで追加 ↑↑↑

  useEffect(() => {
    fetchTodayQuestion()
  }, [])

  useEffect(() => {
    if (question && user) {
      fetchMyAnswer()
      fetchAnswers()
      fetchMyReactions()
    }
  }, [question, user])

  const fetchTodayQuestion = async () => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
    const { data } = await supabase
      .from('daily_questions')
      .select('*')
      .eq('active_date', today)
      .single()
    
    setQuestion(data)
    setLoading(false)
  }

  const fetchMyAnswer = async () => {
    if (!question) return
    const { data } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', question.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)  // 削除されていないもののみ
      .single()
    
    if (data) {
      setMyAnswer(data)
      setAnswer(data.answer_text)
      setIsPublic(data.is_public)
    }
  }

  const fetchAnswers = async () => {
    if (!question) return
    const { data } = await supabase
      .from('answers')
      .select(`
        *,
        profiles:user_id (
          id, username, display_name, icon_char, icon_color, group_id
        ),
        reactions (
          id, reaction_type, user_id
        )
      `)
      .eq('question_id', question.id)
      .is('deleted_at', null)  // 削除されていないもののみ取得
      .order('created_at', { ascending: false })
    
    if (data) {
      setAnswers(data)
    }
  }

  const fetchMyReactions = async () => {
    const { data } = await supabase
      .from('reactions')
      .select('answer_id, reaction_type')
      .eq('user_id', user.id)
    
    if (data) {
      const reactionMap = {}
      data.forEach(r => {
        reactionMap[`${r.answer_id}-${r.reaction_type}`] = true
      })
      setMyReactions(reactionMap)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !question) return

    // 行動データを取得
    const behaviorData = finishTracking(answer)
    console.log('行動データ:', behaviorData)

    if (myAnswer) {
      // Update existing
      await supabase
        .from('answers')
        .update({ 
          answer_text: answer, 
          is_public: isPublic,
          // 行動データも更新
          writing_duration_sec: behaviorData.writing_duration_sec,
          backspace_count: behaviorData.backspace_count,
          max_char_count: behaviorData.max_char_count,
          final_char_count: behaviorData.final_char_count
        })
        .eq('id', myAnswer.id)
    } else {
      // Create new
      await supabase
        .from('answers')
        .insert({
          user_id: user.id,
          question_id: question.id,
          answer_text: answer,
          is_public: isPublic,
          // 行動データを追加
          writing_duration_sec: behaviorData.writing_duration_sec,
          backspace_count: behaviorData.backspace_count,
          max_char_count: behaviorData.max_char_count,
          final_char_count: behaviorData.final_char_count
        })
    }
    
    // リセット
    resetTracking()
    prevAnswerRef.current = ''
    
    fetchMyAnswer()
    fetchAnswers()
  }

  // 削除機能（Soft Delete）
  const handleDelete = async (answerId) => {
    if (!confirm('この投稿を削除しますか？')) return
    
    const { error } = await supabase
      .from('answers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', answerId)
    
    if (error) {
      alert('削除に失敗しました')
      console.error(error)
    } else {
      // 自分の投稿を削除した場合、入力欄もリセット
      if (myAnswer && myAnswer.id === answerId) {
        setMyAnswer(null)
        setAnswer('')
      }
      // 再取得
      fetchAnswers()
      fetchMyAnswer()
    }
  }

  const handleReaction = async (answerId, reactionType) => {
    const key = `${answerId}-${reactionType}`
    const isReacted = myReactions[key]
    
    // For demo answers, just update local state
    if (String(answerId).startsWith('demo-')) {
      setMyReactions(prev => ({ ...prev, [key]: !isReacted }))
      return
    }

    if (isReacted) {
      // Remove
      await supabase
        .from('reactions')
        .delete()
        .eq('answer_id', answerId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
      
      setMyReactions(prev => ({ ...prev, [key]: false }))
    } else {
      // Add
      await supabase
        .from('reactions')
        .insert({
          answer_id: answerId,
          user_id: user.id,
          reaction_type: reactionType
        })
      
      setMyReactions(prev => ({ ...prev, [key]: true }))
    }
    
    fetchAnswers()
  }

  // Filter answers
  const groupAnswers = answers.filter(a => 
    a.profiles?.group_id === profile?.group_id
  )
  const publicAnswers = answers.filter(a => a.is_public)
  
  // Get demo answers for All based on current question
  const demoAnswers = question ? getDemoAnswers(question.question_text) : []
  
  // Combine real answers with demo answers for All (demo answers shown after real ones)
  const openWallAnswers = [...publicAnswers, ...demoAnswers]
  
  const displayAnswers = activeTab === 'group' ? groupAnswers : openWallAnswers

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'now'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F5F3FF]/90 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <span 
            className="text-xl font-extrabold"
            style={{ 
              background: 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            RealTalk
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200">
              <span 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: profile?.icon_color || '#6C5CE7' }}
              >
                {profile?.icon_char || 'あ'}
              </span>
              <span className="text-xs font-semibold text-gray-500">
                {profile?.groups?.name}
              </span>
            </div>
            <button 
              onClick={signOut}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 text-sm hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Today's Question */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">
            Today's Question
          </p>
          <h2 className="text-2xl font-extrabold text-gray-800 leading-tight mb-6">
            {question?.question_text || '今日の質問はまだありません'}
          </h2>

          {question && (
            <div className="space-y-3">
              <div className="relative">
              <textarea
                value={answer}
                onChange={(e) => {
                  const newValue = e.target.value
                  handleTextChange(newValue, prevAnswerRef.current)
                  prevAnswerRef.current = newValue
                  setAnswer(newValue)
                }}
                onFocus={() => {
                  if (!myAnswer) {
                    startTracking()
                  }
                }}
                placeholder="正直に書いてみて..."
                rows={3}
                maxLength={500}
                className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-800 resize-none focus:border-primary focus:outline-none transition-colors"
              />
                <span className="absolute bottom-3 right-4 text-xs text-gray-300">
                  {answer.length}/500
                </span>
              </div>

              {/* Visibility Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    !isPublic
                      ? 'bg-primary/10 text-primary border-2 border-primary'
                      : 'bg-white text-gray-500 border-2 border-gray-200'
                  }`}
                >
                  My Group のみ
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isPublic
                      ? 'bg-primary/10 text-primary border-2 border-primary'
                      : 'bg-white text-gray-500 border-2 border-gray-200'
                  }`}
                >
                  All にも公開
                </button>
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim()}
                className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-40"
                style={{ 
                  background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                  boxShadow: answer.trim() ? '0 4px 14px rgba(108, 92, 231, 0.4)' : 'none'
                }}
              >
                {myAnswer ? '更新する' : '投稿する'}
              </button>

              {myAnswer && (
                <p className="text-center text-sm text-success font-semibold">
                  投稿完了 — {isPublic ? 'All にも公開中' : 'My Group のみに公開中'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Feed */}
        {myAnswer && (
          <div>
            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setActiveTab('group')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'group'
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-white text-gray-500'
                }`}
              >
                My Group
                <span className={`px-2 py-0.5 rounded-lg text-xs ${
                  activeTab === 'group' ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {groupAnswers.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('public')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'public'
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-white text-gray-500'
                }`}
              >
                All
                <span className={`px-2 py-0.5 rounded-lg text-xs ${
                  activeTab === 'public' ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {openWallAnswers.length}
                </span>
              </button>
            </div>

            {/* Answer Cards */}
            <div className="space-y-4">
              {displayAnswers.map((a) => {
                const sameCount = a.reactions?.filter(r => r.reaction_type === 'same').length || 0
                const niceCount = a.reactions?.filter(r => r.reaction_type === 'nice').length || 0
                const isMyPost = a.user_id === user.id
                
                return (
                  <div 
                    key={a.id}
                    className="bg-white rounded-2xl p-5 border border-gray-100"
                  >
                    {/* User Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: a.profiles?.icon_color || '#6C5CE7' }}
                      >
                        {a.profiles?.icon_char || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">
                          {a.profiles?.display_name || a.profiles?.username}
                        </p>
                        <p className="text-xs text-gray-400">{getTimeAgo(a.created_at)}</p>
                      </div>
                      {!a.is_public && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 font-medium">
                          Group Only
                        </span>
                      )}
                    </div>

                    {/* Answer Text */}
                    <p className="text-sm leading-relaxed text-gray-700 mb-4">
                      {a.answer_text}
                    </p>

                    {/* Delete Button (自分の投稿のみ) */}
                    {isMyPost && !String(a.id).startsWith('demo-') && (
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="mb-3 text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        🗑 削除する
                      </button>
                    )}

                    {/* Reactions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleReaction(a.id, 'same')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                          myReactions[`${a.id}-same`]
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        わたしも
                        <span className={`min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          myReactions[`${a.id}-same`] ? 'bg-white/25' : 'bg-gray-200'
                        }`}>
                          {sameCount}
                        </span>
                      </button>
                      <button
                        onClick={() => handleReaction(a.id, 'nice')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                          myReactions[`${a.id}-nice`]
                            ? 'bg-accent text-white'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        知れてよかった
                        <span className={`min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          myReactions[`${a.id}-nice`] ? 'bg-white/25' : 'bg-gray-200'
                        }`}>
                          {niceCount}
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })}

              {displayAnswers.length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  まだ回答がありません
                </p>
              )}
            </div>
          </div>
        )}

        {!myAnswer && question && (
          <p className="text-center text-gray-400 py-8">
            投稿すると、みんなの回答が見れる
          </p>
        )}
      </main>
    </div>
  )
}
