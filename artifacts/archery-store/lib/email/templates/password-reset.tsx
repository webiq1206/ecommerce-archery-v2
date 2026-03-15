import { Html, Head, Body, Container, Text, Link, Hr } from "@react-email/components";

interface PasswordResetProps {
  resetUrl: string;
}

export function PasswordResetEmail({ resetUrl }: PasswordResetProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0D0D0D", fontFamily: "'Barlow', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            APEX<span style={{ color: "#e07830" }}>ARCHERY</span>
          </Text>
          <Hr style={{ borderColor: "#333", margin: "20px 0" }} />
          <Text style={{ fontSize: 20, color: "#ffffff", textAlign: "center" }}>Reset Your Password</Text>
          <Text style={{ fontSize: 14, color: "#999", textAlign: "center", lineHeight: "1.6" }}>
            We received a request to reset your password. Click the button below to set a new one.
          </Text>

          <Container style={{ textAlign: "center", margin: "30px 0" }}>
            <Link href={resetUrl} style={{ backgroundColor: "#e07830", color: "#fff", padding: "14px 32px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", textTransform: "uppercase" as const }}>
              Reset Password
            </Link>
          </Container>

          <Text style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
            This link expires in 1 hour. If you didn&apos;t request this, you can safely ignore this email.
          </Text>

          <Hr style={{ borderColor: "#222", marginTop: 30 }} />
          <Text style={{ fontSize: 11, color: "#666", textAlign: "center" }}>
            Apex Archery · support@apexarchery.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
