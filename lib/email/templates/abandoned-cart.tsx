import { Html, Head, Body, Container, Section, Row, Column, Text, Link, Img, Hr } from "@react-email/components";

interface AbandonedCartItem {
  name: string;
  price: string;
  image?: string;
}

interface AbandonedCartProps {
  customerEmail: string;
  items: AbandonedCartItem[];
  cartUrl: string;
  discountCode?: string;
}

export function AbandonedCartEmail({ customerEmail, items, cartUrl, discountCode }: AbandonedCartProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0D0D0D", fontFamily: "'Barlow', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            APEX<span style={{ color: "#e07830" }}>ARCHERY</span>
          </Text>
          <Hr style={{ borderColor: "#333", margin: "20px 0" }} />
          <Text style={{ fontSize: 22, color: "#ffffff", textAlign: "center" }}>You Left Something Behind</Text>
          <Text style={{ fontSize: 14, color: "#999", textAlign: "center" }}>
            Your hand-picked gear is still waiting for you.
          </Text>

          <Section style={{ marginTop: 24 }}>
            {items.map((item, i) => (
              <Row key={i} style={{ padding: "12px 0", borderBottom: "1px solid #222" }}>
                {item.image && (
                  <Column style={{ width: 56 }}>
                    <Img
                      src={item.image}
                      alt={item.name}
                      width={48}
                      height={48}
                      style={{ borderRadius: 6, objectFit: "cover" }}
                    />
                  </Column>
                )}
                <Column><Text style={{ fontSize: 14, color: "#fff", margin: 0 }}>{item.name}</Text></Column>
                <Column style={{ textAlign: "right" }}><Text style={{ fontSize: 14, color: "#fff", margin: 0 }}>${item.price}</Text></Column>
              </Row>
            ))}
          </Section>

          {discountCode && (
            <Section style={{ backgroundColor: "#1a1a1a", borderRadius: 12, padding: 20, margin: "24px 0", textAlign: "center" }}>
              <Text style={{ fontSize: 13, color: "#999" }}>Use code for 10% off:</Text>
              <Text style={{ fontSize: 20, color: "#e07830", fontWeight: 700 }}>{discountCode}</Text>
            </Section>
          )}

          <Section style={{ textAlign: "center", marginTop: 24 }}>
            <Link href={cartUrl} style={{ backgroundColor: "#e07830", color: "#fff", padding: "14px 32px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", textTransform: "uppercase" as const }}>
              Return to Cart
            </Link>
          </Section>

          <Hr style={{ borderColor: "#222", marginTop: 40 }} />
          <Text style={{ fontSize: 11, color: "#666", textAlign: "center" }}>
            Apex Archery · <Link href="#" style={{ color: "#666" }}>Unsubscribe</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AbandonedCartEmail;
