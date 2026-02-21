import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const url = "https://good-cattle-9550.upstash.io/get/pi_metrics";
  const token = "ASVOAAImcDE0YTBlOTI5ZDQ0MDQ0NGFkOTYxYjlhMzdmODAyMmI1ZnAxOTU1MA";

  try {
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}` 
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error(`Upstash API error: ${res.statusText}`);
    }

    const data = await res.json();
    
    // Redis 'get' command returns { result: "string_value" } or { result: null }
    if (!data.result) {
      return NextResponse.json({ error: "No metrics data found in Redis" }, { status: 404 });
    }

    // Parse the JSON string stored in Redis
    let metrics;
    try {
      metrics = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    } catch (e) {
      console.error("Failed to parse Redis result:", data.result);
      return NextResponse.json({ error: "Invalid data format in Redis" }, { status: 500 });
    }
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
