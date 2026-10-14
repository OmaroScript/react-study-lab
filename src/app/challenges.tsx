import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Code, colors, Note, Row, Screen, Section } from '@/components/ui';
import { Challenge, challenges, mySolutions } from '@/practice/challenges';

type TestResult = { name: string; ok: boolean; message?: string };

async function runTests(challenge: Challenge, useReference: boolean): Promise<TestResult[]> {
  const impl = useReference ? challenge.reference : mySolutions[challenge.id];
  const results: TestResult[] = [];
  for (const test of challenge.tests) {
    try {
      await test.run(impl);
      results.push({ name: test.name, ok: true });
    } catch (e) {
      results.push({ name: test.name, ok: false, message: (e as Error).message });
    }
  }
  return results;
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const run = async (useReference: boolean) => {
    setRunning(true);
    setResults(await runTests(challenge, useReference));
    setRunning(false);
  };

  const passed = results?.filter((r) => r.ok).length ?? 0;

  return (
    <Section title={challenge.title}>
      <Note>{challenge.statement}</Note>
      <Row>
        <Button title={running ? 'Corriendo…' : 'Correr mis tests'} onPress={() => run(false)} disabled={running} />
        <Button title="Pista" variant="secondary" onPress={() => setShowHint((v) => !v)} />
        <Button title="Solución" variant="secondary" onPress={() => setShowSolution((v) => !v)} />
      </Row>
      {showHint && <Note>💡 {challenge.hint}</Note>}
      {showSolution && (
        <View style={{ gap: 8 }}>
          <Code>{challenge.referenceCode}</Code>
          <Button title="Correr tests con la referencia" variant="secondary" onPress={() => run(true)} />
        </View>
      )}
      {results && (
        <View style={{ gap: 4 }}>
          <Text style={{ fontWeight: '700', color: passed === results.length ? colors.ok : colors.error }}>
            {passed}/{results.length} tests pasan
          </Text>
          {results.map((r) => (
            <Text key={r.name} style={{ color: r.ok ? colors.ok : colors.error, fontSize: 13 }}>
              {r.ok ? '✓' : '✗'} {r.name}
              {r.message ? ` — ${r.message}` : ''}
            </Text>
          ))}
        </View>
      )}
    </Section>
  );
}

export default function Challenges() {
  return (
    <Screen>
      <Note>
        Implementa cada función en src/practice/mySolutions.ts. Al guardar, la app se recarga y
        puedes correr los tests aquí. En la entrevista: primero aclara el problema, luego una
        solución simple, después optimiza y habla de complejidad (Big O).
      </Note>
      {challenges.map((c) => (
        <ChallengeCard key={c.id} challenge={c} />
      ))}
    </Screen>
  );
}
