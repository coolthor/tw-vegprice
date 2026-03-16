export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) {
    return new Response(JSON.stringify({ error: 'missing date' }), { status: 400 });
  }

  const url = `https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx?StartDate=${date}&EndDate=${date}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
