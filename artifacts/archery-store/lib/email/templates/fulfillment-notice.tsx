import { Html, Head, Body, Container, Section, Row, Column, Text, Hr } from "@react-email/components";

interface FulfillmentItem {
  sku: string;
  name: string;
  variant?: string;
  quantity: number;
  price: string;
}

interface FulfillmentNoticeProps {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  items: FulfillmentItem[];
  notes?: string;
  replyEmail: string;
}

export function FulfillmentNoticeEmail({
  orderNumber, orderDate, customerName, shippingAddress, items, notes, replyEmail,
}: FulfillmentNoticeProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "30px 20px", backgroundColor: "#ffffff" }}>
          <Text style={{ fontSize: 18, fontWeight: 700, color: "#333" }}>
            Apex Archery — Fulfillment Request
          </Text>
          <Hr style={{ borderColor: "#eee" }} />
          <Section style={{ backgroundColor: "#fff3e0", padding: 16, borderRadius: 8, margin: "16px 0" }}>
            <Text style={{ fontSize: 14, color: "#e07830", fontWeight: 600, margin: 0 }}>
              Please ship the following items as soon as possible.
            </Text>
          </Section>

          <Text style={{ fontSize: 13, color: "#666" }}>Order #{orderNumber} · {orderDate}</Text>

          <Section style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Ship To:</Text>
            <Text style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>
              {shippingAddress.firstName} {shippingAddress.lastName}<br />
              {shippingAddress.address1}<br />
              {shippingAddress.address2 && <>{shippingAddress.address2}<br /></>}
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}<br />
              {shippingAddress.country}
              {shippingAddress.phone && <><br />Phone: {shippingAddress.phone}</>}
            </Text>
          </Section>

          <Section style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Items:</Text>
            {items.map((item, i) => (
              <Row key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <Column style={{ width: "15%" }}><Text style={{ fontSize: 12, color: "#999", margin: 0 }}>{item.sku}</Text></Column>
                <Column style={{ width: "50%" }}>
                  <Text style={{ fontSize: 13, color: "#333", margin: 0 }}>{item.name}</Text>
                  {item.variant && <Text style={{ fontSize: 11, color: "#999", margin: 0 }}>{item.variant}</Text>}
                </Column>
                <Column style={{ width: "15%", textAlign: "center" }}><Text style={{ fontSize: 13, color: "#333", margin: 0 }}>×{item.quantity}</Text></Column>
                <Column style={{ width: "20%", textAlign: "right" }}><Text style={{ fontSize: 13, color: "#333", margin: 0 }}>${item.price}</Text></Column>
              </Row>
            ))}
          </Section>

          {notes && (
            <Section style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Special Instructions:</Text>
              <Text style={{ fontSize: 13, color: "#555" }}>{notes}</Text>
            </Section>
          )}

          <Hr style={{ borderColor: "#eee", margin: "20px 0" }} />
          <Text style={{ fontSize: 12, color: "#999" }}>
            Please confirm receipt of this order within 24 hours.<br />
            Questions? Reply to {replyEmail}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default FulfillmentNoticeEmail;
