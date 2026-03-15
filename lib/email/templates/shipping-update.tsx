import { Html, Head, Body, Container, Section, Text, Link, Hr } from "@react-email/components";

interface ShippingUpdateProps {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrierName: string;
  trackingUrl: string;
  items: { name: string; quantity: number }[];
}

export function ShippingUpdateEmail({ customerName, orderNumber, trackingNumber, carrierName, trackingUrl, items }: ShippingUpdateProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0D0D0D", fontFamily: "'Barlow', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            APEX<span style={{ color: "#e07830" }}>ARCHERY</span>
          </Text>
          <Hr style={{ borderColor: "#333", margin: "20px 0" }} />
          <Text style={{ fontSize: 22, color: "#ffffff", textAlign: "center" }}>Your Order Has Shipped!</Text>
          <Text style={{ fontSize: 14, color: "#999", textAlign: "center" }}>
            Hi {customerName}, your order #{orderNumber} is on its way.
          </Text>

          <Section style={{ backgroundColor: "#1a1a1a", borderRadius: 12, padding: 24, margin: "24px 0", textAlign: "center" }}>
            <Text style={{ fontSize: 12, color: "#999", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Tracking Number</Text>
            <Text style={{ fontSize: 20, color: "#e07830", fontWeight: 700, margin: "8px 0" }}>{trackingNumber}</Text>
            <Text style={{ fontSize: 13, color: "#999" }}>{carrierName}</Text>
          </Section>

          <Section style={{ textAlign: "center" }}>
            <Link href={trackingUrl} style={{ backgroundColor: "#e07830", color: "#fff", padding: "14px 32px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", textTransform: "uppercase" as const }}>
              Track Package
            </Link>
          </Section>

          {items.length > 0 && (
            <Section style={{ marginTop: 30 }}>
              <Text style={{ fontSize: 13, color: "#999", fontWeight: 600, marginBottom: 8 }}>Items in this shipment:</Text>
              {items.map((item, i) => (
                <Text key={i} style={{ fontSize: 13, color: "#ccc", margin: "4px 0" }}>
                  {item.name} (×{item.quantity})
                </Text>
              ))}
            </Section>
          )}

          <Hr style={{ borderColor: "#222", marginTop: 40 }} />
          <Text style={{ fontSize: 11, color: "#666", textAlign: "center" }}>
            Questions? Contact us at support@apexarchery.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ShippingUpdateEmail;
