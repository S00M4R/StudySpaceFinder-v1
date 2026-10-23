// src/screens/SurveyScreen.tsx
// ============================================================
// Technology Acceptance Model (TAM) questionnaire
// Collects PU + PEOU + trust + continuance + open feedback
// ============================================================

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorMessage, Input, LoadingScreen, StarRating } from '../components/UI';
import { useSurvey } from '../hooks/useSpaces';
import { Colors, FontSize, Spacing } from '../lib/theme';

export function SurveyScreen() {
  const { submitSurvey, submitting, submitted, checking } = useSurvey();
  const [perceivedUseful,  setPerceivedUseful]  = useState(0);
  const [perceivedEase,    setPerceivedEase]    = useState(0);
  const [trustInData,      setTrustInData]      = useState(0);
  const [wouldContinue,    setWouldContinue]    = useState(0);
  const [openFeedback,     setOpenFeedback]     = useState('');
  const [error, setError] = useState<string | null>(null);

  // Wait until we know whether the user already submitted
  if (checking) return <LoadingScreen />;

  if (submitted) {
    return (
      <View style={styles.successScreen}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Thank you!</Text>
        <Text style={styles.successSub}>
          Your feedback has been submitted and will be used to improve the app and the research findings.
        </Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    setError(null);
    if (!perceivedUseful || !perceivedEase || !trustInData || !wouldContinue) {
      setError('Please rate all items before submitting.');
      return;
    }
    await submitSurvey({
      perceived_useful: perceivedUseful,
      perceived_ease:   perceivedEase,
      trust_in_data:    trustInData,
      would_continue:   wouldContinue,
      open_feedback:    openFeedback,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>App Feedback Survey</Text>
      <Text style={styles.sub}>
        This survey is part of a research study on campus study-space apps. Your responses are
        anonymous and will only be used for academic research.
      </Text>

      {error && <ErrorMessage message={error} />}

      {/* Perceived Usefulness (TAM - PU) */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Perceived Usefulness</Text>
        <Text style={styles.sectionDesc}>
          These questions measure whether you feel the app improves your ability to find study spaces.
        </Text>
        <StarRating
          label="The app helped me find a study space faster."
          value={perceivedUseful}
          onChange={setPerceivedUseful}
        />
      </Card>

      {/* Perceived Ease of Use (TAM - PEOU) */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Ease of Use</Text>
        <Text style={styles.sectionDesc}>
          These questions measure how simple the app was to use.
        </Text>
        <StarRating
          label="The app was easy and straightforward to use."
          value={perceivedEase}
          onChange={setPerceivedEase}
        />
      </Card>

      {/* Trust in crowdsourced data */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Data Trust</Text>
        <Text style={styles.sectionDesc}>
          These questions measure how much you trusted the information shown.
        </Text>
        <StarRating
          label="I trusted the occupancy information shown in the app."
          value={trustInData}
          onChange={setTrustInData}
        />
      </Card>

      {/* Continuance intention */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Continuance Intention</Text>
        <Text style={styles.sectionDesc}>
          Would you keep using this app?
        </Text>
        <StarRating
          label="I would continue using this app to find study spaces."
          value={wouldContinue}
          onChange={setWouldContinue}
        />
      </Card>

      {/* Open-ended */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Open Feedback</Text>
        <Text style={styles.sectionDesc}>
          Any additional comments, suggestions, or issues you experienced?
        </Text>
        <Input
          value={openFeedback}
          onChangeText={setOpenFeedback}
          placeholder="Type your feedback here (optional)..."
          multiline
          numberOfLines={4}
        />
      </Card>

      <View style={styles.scaleNote}>
        <Text style={styles.scaleNoteText}>★ Rating scale: 1 = Strongly Disagree · 5 = Strongly Agree</Text>
      </View>

      <Button label="Submit Survey" onPress={handleSubmit} loading={submitting} fullWidth />

      <Text style={styles.footnote}>
        Your identity will never be disclosed. Data is stored securely and erased at the end of the study.
      </Text>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  scroll:        { padding: Spacing.lg, paddingTop: 56 },
  title:         { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: -0.5, marginBottom: 8 },
  sub:           { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.lg },

  section:       { marginBottom: Spacing.md },
  sectionTitle:  { color: Colors.textPrimary, fontWeight: '800', fontSize: FontSize.md, marginBottom: 4 },
  sectionDesc:   { color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 18, marginBottom: Spacing.md },

  scaleNote:     { marginBottom: Spacing.lg },
  scaleNoteText: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },

  footnote:      { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center',
    marginTop: Spacing.md, lineHeight: 18 },

  successScreen: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center',
    justifyContent: 'center', padding: Spacing.xl },
  successIcon:   { fontSize: 60, marginBottom: Spacing.md },
  successTitle:  { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8 },
  successSub:    { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
});
