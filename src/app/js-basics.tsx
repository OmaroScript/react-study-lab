import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Code, colors, Note, Row, Screen, Section } from '@/components/ui';
import { theory, TheoryBlock, TheoryCard } from '@/data/jsTheory';
import { Quiz, quizzes } from '@/data/quizzes';

type Topic = Quiz['topic'];
type Result = 'ok' | 'fail';
type Mode = 'learn' | 'practice';

const TOPICS = Object.keys(theory) as Topic[];

// ---------------------------------------------------------------------------
// Modo Aprender
// ---------------------------------------------------------------------------
function Block({ block }: { block: TheoryBlock }) {
  switch (block.type) {
    case 'p':
      return <Text style={s.paragraph}>{block.text}</Text>;
    case 'bullets':
      return (
        <View style={{ gap: 6 }}>
          {block.items.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={s.paragraph}>•</Text>
              <Text style={[s.paragraph, { flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'code':
      return <Code>{block.code}</Code>;
    case 'tip':
      return (
        <View style={s.tip}>
          <Text style={s.tipText}>💡 {block.text}</Text>
        </View>
      );
    case 'table':
      return (
        <View style={s.table}>
          {[block.headers, ...block.rows].map((row, rowIndex) => (
            <View key={rowIndex} style={[s.tableRow, rowIndex === 0 && s.tableHeader]}>
              {row.map((cell, cellIndex) => (
                <Text
                  key={cellIndex}
                  style={[
                    s.tableCell,
                    (rowIndex === 0 || cellIndex === 0) && { fontWeight: '700' },
                  ]}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
  }
}

function TheoryCardView({ card }: { card: TheoryCard }) {
  return (
    <Section title={card.title}>
      {card.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Modo Practicar
// ---------------------------------------------------------------------------
function QuizCard({ quiz, onGrade }: { quiz: Quiz; onGrade: (r: Result) => void }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Section title={quiz.topic}>
      <Code>{quiz.code}</Code>
      {!revealed ? (
        <Button title="Ya lo pensé: revelar" variant="secondary" onPress={() => setRevealed(true)} />
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>→ {quiz.answer}</Text>
          <Note>{quiz.explanation}</Note>
          <Row>
            <Button title="Acerté" onPress={() => onGrade('ok')} />
            <Button title="Fallé" variant="danger" onPress={() => onGrade('fail')} />
          </Row>
        </View>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------
export default function JsBasics() {
  const [mode, setMode] = useState<Mode>('learn');
  const [topic, setTopic] = useState<Topic>('var/let/const');
  const [results, setResults] = useState<Record<string, Result>>({});

  const topicQuizzes = useMemo(() => quizzes.filter((q) => q.topic === topic), [topic]);
  const ok = Object.values(results).filter((r) => r === 'ok').length;
  const total = Object.keys(results).length;

  return (
    <Screen>
      <Row>
        <Button
          title="📖 Aprender"
          variant={mode === 'learn' ? 'primary' : 'secondary'}
          onPress={() => setMode('learn')}
        />
        <Button
          title={`✍️ Practicar (${quizzes.length})`}
          variant={mode === 'practice' ? 'primary' : 'secondary'}
          onPress={() => setMode('practice')}
        />
      </Row>

      <Row>
        {TOPICS.map((t) => (
          <Button
            key={t}
            title={t}
            variant={t === topic ? 'primary' : 'secondary'}
            onPress={() => setTopic(t)}
          />
        ))}
      </Row>

      {mode === 'learn' ? (
        <>
          {theory[topic].map((card) => (
            <TheoryCardView key={`${topic}-${card.title}`} card={card} />
          ))}
          <Button
            title={`Practicar ${topic} (${topicQuizzes.length} ejercicios) →`}
            onPress={() => setMode('practice')}
          />
        </>
      ) : (
        <>
          <Note>
            Lee el código, di en voz alta qué imprime y POR QUÉ, y luego revela. Marcador: {ok}/
            {total}
          </Note>
          {topicQuizzes.map((q) => (
            // key incluye el tema para "resetear" la tarjeta al cambiar de filtro
            <QuizCard
              key={`${topic}-${q.id}`}
              quiz={q}
              onGrade={(r) => setResults((prev) => ({ ...prev, [q.id]: r }))}
            />
          ))}
          <Button title="← Repasar la teoría" variant="secondary" onPress={() => setMode('learn')} />
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  paragraph: { fontSize: 15, lineHeight: 22, color: colors.text },
  tip: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 6,
    padding: 10,
  },
  tipText: { fontSize: 14, lineHeight: 20, color: colors.text },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border },
  tableHeader: { backgroundColor: '#F1F3F5', borderTopWidth: 0 },
  tableCell: { flex: 1, padding: 8, fontSize: 13, lineHeight: 18, color: colors.text },
});
