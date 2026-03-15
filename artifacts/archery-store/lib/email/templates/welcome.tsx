import { Html, Head, Body, Container, Section, Text, Link, Hr } from "@react-email/components";

interface WelcomeEmailProps {
  customerName: string;
}

export function WelcomeEmail({ customerName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0D0D0D", fontFamily: "'Barlow', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            APEX<span style={{ color: "#e07830" }}>ARCHERY</span>
          </Text>
          <Hr style={{ borderColor: "#333", margin: "20px 0" }} />
          <Text style={{ fontSize: 22, color: "#ffffff", textAlign: "center" }}>
            Welcome to the Pack, {customerName}!
          </Text>
          <Text style={{ fontSize: 14, color: "#999", textAlign: "center", lineHeight: "1.6" }}>
            You&apos;ve joined a community of archers who demand the best from their gear. Here&apos;s how to get started:
          </Text>

          <Section style={{ marginTop: 30 }}>
            {[
              { title: "Shop Best Sellers", desc: "Our most popular bows, arrows, and accessories.", url: "/collections/best-sellers" },
              { title: "Read Our Guides", desc: "Expert advice to help you choose the right setup.", url: "/guides" },
              { title: "Try the AI Advisor", desc: "Get personalized gear recommendations in seconds.", url: "/" },
            ].map((item, i) => (
              <Section key={i} style={{ backgroundColor: "#1a1a1a", borderRadius: 12, padding: 20, marginBottom: 12 }}>
                <Text style={{ fontSize: 15, color: "#fff", fontWeight: 600, margin: 0 }}>{item.title}</Text>
                <Text style={{ fontSize: 13, color: "#999", margin: "4px 0 12px" }}>{item.desc}</Text>
                <Link href={item.url} style={{ fontSize: 13, color: "#e07830", fontWeight: 600, textDecoration: "none" }}>
                  Explore →
                </Link>
              </Section>
            ))}
          </Section>

          <Hr style={{ borderColor: "#222", marginTop: 30 }} />
          <Text style={{ fontSize: 11, color: "#666", textAlign: "center" }}>
            Apex Archery · <Link href="#" style={{ color: "#666" }}>Unsubscribe</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
