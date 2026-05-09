import http from 'node:http';

const port = Number(process.env.WATCHMODE_MOCK_PORT ?? 5174);

const json = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (url.pathname === '/health') {
    json(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/v1/search/') {
    const watchmodeId = Number(url.searchParams.get('search_value'));

    json(response, 200, {
      title_results: [
        {
          id: watchmodeId,
          name: 'Watchmode Playwright Movie',
          type: 'movie',
          tmdb_id: watchmodeId,
          tmdb_type: 'movie',
        },
      ],
    });
    return;
  }

  if (/^\/v1\/title\/\d+\/sources\/$/.test(url.pathname)) {
    json(response, 200, [
      {
        source_id: 203,
        name: 'Netflix',
        type: 'sub',
        region: 'JP',
        web_url: 'https://www.netflix.com/jp/title/watchmode-playwright',
        format: 'HD',
        price: null,
        seasons: null,
        episodes: null,
      },
      {
        source_id: 26,
        name: 'Amazon Prime Video',
        type: 'rent',
        region: 'JP',
        web_url: 'https://www.amazon.co.jp/gp/video/detail/watchmode-playwright',
        format: 'SD',
        price: 399,
        seasons: null,
        episodes: null,
      },
      {
        source_id: 26,
        name: 'Amazon Prime Video',
        type: 'rent',
        region: 'JP',
        web_url: 'https://www.amazon.co.jp/gp/video/detail/watchmode-playwright',
        format: 'HD',
        price: 499,
        seasons: null,
        episodes: null,
      },
    ]);
    return;
  }

  json(response, 404, { error: 'not found' });
});

server.listen(port, '127.0.0.1');
