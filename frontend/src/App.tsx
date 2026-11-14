import { useEffect, useState } from "react";

type Property = {
  id: number;
  title: string;
  city: string;
  price: string;
};

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/properties")
      .then(r => {
        if (!r.ok) throw new Error("API unavailable");
        return r.json();
      })
      .then(setProperties)
      .catch(() => setMessage("Unable to load properties"));
  }, []);

  async function book(id: number) {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: id,
        customer_name: "Lab Student"
      })
    });

    setMessage(response.ok
      ? "Booking submitted successfully"
      : "Booking service unavailable");
  }

  return (
    <main style={{ maxWidth: 850, margin: "auto", padding: 30 }}>
      <h1>EstateFlow</h1>
      <p>Find your next home.</p>
      <p role="status">{message}</p>

      {properties.map(property => (
        <article key={property.id}
          style={{ border: "1px solid #ccc", padding: 20, margin: 12 }}>
          <h2>{property.title}</h2>
          <p>{property.city} — ${property.price}/month</p>
          <button onClick={() => book(property.id)}>
            Request booking
          </button>
        </article>
      ))}
    </main>
  );
}
