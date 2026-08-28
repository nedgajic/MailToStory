import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";

export type StoryReadyEmailProps = {
  recipientName: string;
  storyTitle: string;
  subjectLine: string;
  resolutionSummary: string;
  storyUrl: string;
  workspaceName: string;
  isTeamInbox: boolean;
};

export function StoryReadyEmail({
  recipientName,
  storyTitle,
  subjectLine,
  resolutionSummary,
  storyUrl,
  workspaceName,
  isTeamInbox,
}: StoryReadyEmailProps) {
  const greeting = recipientName.trim() ? recipientName.trim() : "there";
  const preview = `Your story “${storyTitle}” is ready to read.`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brandBar}>
            <Text style={styles.brandMark}>{BRAND_NAME}</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.heading}>Your story is ready</Heading>
            <Text style={styles.lede}>
              Hi {greeting}, we turned{" "}
              {isTeamInbox ? (
                <>
                  a thread forwarded to the <strong>{workspaceName}</strong> inbox
                </>
              ) : (
                <>your forwarded thread</>
              )}{" "}
              into a structured story you can search, skim, and export.
            </Text>

            <Section style={styles.storyPanel}>
              <Text style={styles.storyKicker}>Story</Text>
              <Heading as="h2" style={styles.storyTitle}>
                {storyTitle}
              </Heading>
              {subjectLine ? (
                <Text style={styles.subjectLine}>Re: {subjectLine}</Text>
              ) : null}
              {resolutionSummary ? (
                <Text style={styles.summary}>{resolutionSummary}</Text>
              ) : null}
            </Section>

            <Section style={styles.ctaWrap}>
              <Button href={storyUrl} style={styles.cta}>
                Open story
              </Button>
            </Section>

            <Text style={styles.finePrint}>
              This link signs you in securely and opens the story directly. It
              expires in 7 days.
            </Text>
          </Section>

          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            You received this because story-ready notifications are enabled for
            your {BRAND_NAME} account
            {isTeamInbox ? " on a Team workspace" : ""}. Manage this in Profile
            settings.
          </Text>
          <Text style={styles.footerLink}>
            <a href={`${BRAND_URL}/settings/profile`} style={styles.link}>
              Notification settings
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#121212",
    margin: 0,
    padding: "32px 16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    margin: "0 auto",
    maxWidth: "560px",
  },
  brandBar: {
    marginBottom: "16px",
  },
  brandMark: {
    color: "#8ab4f8",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    margin: 0,
  },
  card: {
    backgroundColor: "#1e1f22",
    border: "1px solid #3c4043",
    borderRadius: "16px",
    padding: "28px 24px 24px",
  },
  heading: {
    color: "#f1f3f4",
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: "1.2",
    margin: "0 0 12px",
  },
  lede: {
    color: "#bdc1c6",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0 0 24px",
  },
  storyPanel: {
    backgroundColor: "#292a2d",
    border: "1px solid #3c4043",
    borderRadius: "12px",
    padding: "18px 18px 16px",
    marginBottom: "24px",
  },
  storyKicker: {
    color: "#8ab4f8",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    margin: "0 0 8px",
  },
  storyTitle: {
    color: "#f8f9fa",
    fontSize: "20px",
    fontWeight: 700,
    lineHeight: "1.35",
    margin: "0 0 8px",
  },
  subjectLine: {
    color: "#9aa0a6",
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0 0 12px",
  },
  summary: {
    color: "#e8eaed",
    fontSize: "15px",
    lineHeight: "1.55",
    margin: 0,
  },
  ctaWrap: {
    textAlign: "center" as const,
    marginBottom: "16px",
  },
  cta: {
    backgroundColor: "#8ab4f8",
    borderRadius: "999px",
    color: "#202124",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: "1",
    padding: "14px 28px",
    textDecoration: "none",
  },
  finePrint: {
    color: "#80868b",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0,
    textAlign: "center" as const,
  },
  hr: {
    borderColor: "#3c4043",
    margin: "24px 0 16px",
  },
  footer: {
    color: "#80868b",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 8px",
    textAlign: "center" as const,
  },
  footerLink: {
    margin: 0,
    textAlign: "center" as const,
  },
  link: {
    color: "#8ab4f8",
    fontSize: "12px",
    textDecoration: "underline",
  },
} satisfies Record<string, React.CSSProperties>;

export default StoryReadyEmail;
