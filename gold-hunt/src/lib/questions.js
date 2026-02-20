import { supabase } from './supabase'

export const getRandomTopicQuestions = async () => {
  const { data: topics } = await supabase
    .from('questions')
    .select('topic')
    .order('topic')

  const uniqueTopics = Array.from(new Set((topics || []).map((t) => t.topic)))
  if (uniqueTopics.length === 0) throw new Error('no topics')

  const topic = uniqueTopics[Math.floor(Math.random() * uniqueTopics.length)]

  const { data: q1 } = await supabase
    .from('questions')
    .select('text')
    .eq('topic', topic)
    .eq('level', 'q1')
    .limit(1)
    .single()

  const { data: q2 } = await supabase
    .from('questions')
    .select('text')
    .eq('topic', topic)
    .eq('level', 'q2')
    .limit(1)
    .single()

  return { topic, q1: q1?.text || '', q2: q2?.text || '' }
}
