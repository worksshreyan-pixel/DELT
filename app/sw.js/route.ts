export async function GET() {
  return new Response('', {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
