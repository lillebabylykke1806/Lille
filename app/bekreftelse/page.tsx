"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Bekreftelse() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => { router.push("/"); }, 4000);
    return () => clearTimeout(timer);
  }, [router]);
  return (
    <div style={{ backgroundColor: "#F5EFE6", minHeight: "100vh", maxWidth: "430px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", gap: "20px" }}>
      <h1 style={{ fontSize: "26px", fontStyle: "italic", color: "#B05A2F", margin: 0 }}>Velkommen til Lille!</h1>
      <p style={{ fontSize: "15px", color: "#8A7060", fontFamily: "sans-serif", margin: 0 }}>Du sendes til appen om et oyeblikk...</p>
    </div>
  );
}
