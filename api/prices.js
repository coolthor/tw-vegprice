export const config = { runtime: 'edge' };

const KEEP_FIELDS = ['交易日期', '作物名稱', '市場名稱', '上價', '中價', '下價', '平均價', '交易量'];

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date || !/^\d{3}\.\d{2}\.\d{2}$/.test(date)) {
    return new Response(JSON.stringify({ error: 'invalid date' }), { status: 400 });
  }

  const url = `https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx?StartDate=${date}&EndDate=${date}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { 'Accept': 'application/json' },
    });
    const raw = await res.json();

    // Filter: vegetables only (N04), exclude 休市 / zero-volume entries, keep needed fields
    const data = raw
      .filter(d => d['種類代碼'] === 'N04' && d['作物名稱'] !== '休市' && parseFloat(d['交易量']) > 0)
      .map(d => {
        const out = {};
        for (const k of KEEP_FIELDS) out[k] = d[k];
        return out;
      });

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=86400',
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
