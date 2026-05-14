import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

// Create demo distributor account
export async function createDemoDistributor() {
  try {
    // Check if demo distributor already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const demoExists = existingUser?.users.some(
      (u) => u.email === "distributor@arroyyan99.com"
    );

    if (demoExists) {
      console.log("Demo distributor account already exists");
      return;
    }

    // Create demo distributor user
    const { data, error } = await supabase.auth.admin.createUser({
      email: "distributor@arroyyan99.com",
      password: "distributor123",
      user_metadata: {
        name: "Distributor Demo",
        role: "distributor",
        approved: true,
      },
      email_confirm: true,
    });

    if (error) {
      console.error("Error creating demo distributor:", error.message);
      return;
    }

    console.log("Demo distributor created:", data.user?.email);

    // Create demo distributions for this distributor
    const userId = data.user?.id;
    if (userId) {
      await createDemoDistributions(userId);
    }
  } catch (error) {
    console.error("Exception creating demo distributor:", error);
  }
}

// Create demo distribution data
async function createDemoDistributions(userId: string) {
  const demoDistributions = [
    {
      id: "DIST-2026-001",
      distributorId: userId,
      status: "pending",
      date: new Date().toISOString(),
      items: [
        {
          productId: "1",
          productName: "Air Minum Arroyyan99 500ml",
          quantity: 100,
        },
        {
          productId: "2",
          productName: "Air Minum Arroyyan99 1500ml",
          quantity: 50,
        },
      ],
    },
    {
      id: "DIST-2026-002",
      distributorId: userId,
      status: "diterima",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
      items: [
        {
          productId: "3",
          productName: "Air Minum Arroyyan99 Galon 19L",
          quantity: 30,
        },
      ],
    },
  ];

  await kv.set(`distributions_${userId}`, demoDistributions);
  console.log("Demo distributions created for distributor");
}

// Call this on server startup
createDemoDistributor();
