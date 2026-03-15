import {
  Html, Head, Body, Container, Section, Row, Column, Text, Link, Img, Hr,
} from "@react-email/components";

interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  price: string;
  variant?: string;
  image?: string;
}

interface OrderConfirmationProps {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  items: OrderItem[];
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  total: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  orderUrl: string;
}

export function OrderConfirmationEmail({
  orderNumber, orderDate, customerName, items, subtotal, shipping, tax, discount, total, shippingAddress, orderUrl,
}: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0D0D0D", fontFamily: "'Barlow', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            APEX<span style={{ color: "#e07830" }}>ARCHERY</span>
          </Text>
          <Hr style={{ borderColor: "#333", margin: "20px 0" }} />
          <Text style={{ fontSize: 20, color: "#ffffff", textAlign: "center" }}>Order Confirmed</Text>
          <Text style={{ fontSize: 14, color: "#999", textAlign: "center" }}>
            Hi {customerName}, thank you for your order!
          </Text>
          <Text style={{ fontSize: 14, color: "#999", textAlign: "center" }}>
            Order #{orderNumber} · {orderDate}
          </Text>

          <Section style={{ marginTop: 30 }}>
            {items.map((item, i) => (
              <Row key={i} style={{ padding: "12px 0", borderBottom: "1px solid #222" }}>
                <Column style={{ width: "60%" }}>
                  <Text style={{ fontSize: 14, color: "#fff", margin: 0 }}>{item.name}</Text>
                  {item.variant && <Text style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>{item.variant}</Text>}
                  <Text style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ width: "40%", textAlign: "right" }}>
                  <Text style={{ fontSize: 14, color: "#fff", margin: 0 }}>${item.price}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Section style={{ marginTop: 20 }}>
            <Row><Column><Text style={{ fontSize: 13, color: "#999" }}>Subtotal</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ fontSize: 13, color: "#fff" }}>${subtotal}</Text></Column></Row>
            <Row><Column><Text style={{ fontSize: 13, color: "#999" }}>Shipping</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ fontSize: 13, color: "#fff" }}>${shipping}</Text></Column></Row>
            <Row><Column><Text style={{ fontSize: 13, color: "#999" }}>Tax</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ fontSize: 13, color: "#fff" }}>${tax}</Text></Column></Row>
            {parseFloat(discount) > 0 && (
              <Row><Column><Text style={{ fontSize: 13, color: "#4ade80" }}>Discount</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ fontSize: 13, color: "#4ade80" }}>-${discount}</Text></Column></Row>
            )}
            <Hr style={{ borderColor: "#333" }} />
            <Row><Column><Text style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>Total</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>${total}</Text></Column></Row>
          </Section>

          <Section style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 13, color: "#999", fontWeight: 600 }}>Shipping To</Text>
            <Text style={{ fontSize: 13, color: "#ccc", margin: "4px 0" }}>
              {shippingAddress.firstName} {shippingAddress.lastName}<br />
              {shippingAddress.address1}<br />
              {shippingAddress.address2 && <>{shippingAddress.address2}<br /></>}
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
            </Text>
          </Section>

          <Section style={{ textAlign: "center", marginTop: 30 }}>
            <Link href={orderUrl} style={{ backgroundColor: "#e07830", color: "#fff", padding: "14px 32px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
              View Order
            </Link>
          </Section>

          <Hr style={{ borderColor: "#222", marginTop: 40 }} />
          <Text style={{ fontSize: 11, color: "#666", textAlign: "center" }}>
            Need help? Contact us at support@apexarchery.com<br />
            Returns accepted within 30 days of delivery.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;
