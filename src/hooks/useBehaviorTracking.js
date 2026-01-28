import { useState, useRef, useCallback } from 'react'

export function useBehaviorTracking() {
  const [backspaceCount, setBackspaceCount] = useState(0)
  const [maxCharCount, setMaxCharCount] = useState(0)
  const startTimeRef = useRef(null)

  // 入力開始時に呼ぶ
  const startTracking = useCallback(() => {
    startTimeRef.current = Date.now()
    setBackspaceCount(0)
    setMaxCharCount(0)
  }, [])

  // テキスト変更時に呼ぶ
  const handleTextChange = useCallback((newText, prevText) => {
    // 最大文字数を更新
    setMaxCharCount(prev => Math.max(prev, newText.length))

    // バックスペース検出（文字数が減った場合）
    if (prevText && newText.length < prevText.length) {
      setBackspaceCount(prev => prev + (prevText.length - newText.length))
    }
  }, [])

  // 送信時に呼ぶ → 行動データを返す
  const finishTracking = useCallback((finalText) => {
    const writingDuration = startTimeRef.current 
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0

    return {
      writing_duration_sec: writingDuration,
      backspace_count: backspaceCount,
      max_char_count: maxCharCount,
      final_char_count: finalText.length
    }
  }, [backspaceCount, maxCharCount])

  // リセット
  const resetTracking = useCallback(() => {
    startTimeRef.current = null
    setBackspaceCount(0)
    setMaxCharCount(0)
  }, [])

  return {
    startTracking,
    handleTextChange,
    finishTracking,
    resetTracking
  }
}
