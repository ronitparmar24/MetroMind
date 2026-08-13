const axios = require('axios');
let _cache = { data: null, fetchedAt: 0 };

exports.getAhmedabadTransitNews = async () => {
  if (Date.now() - _cache.fetchedAt < 30 * 60 * 1000) return _cache.data;
  const { data } = await axios.get('https://gnews.io/api/v4/search', {
    params: {
      q: 'Ahmedabad metro OR Ahmedabad traffic',
      lang: 'en', country: 'in', max: 3,
      apikey: process.env.GNEWS_API_KEY,
    },
  });
  const articles = data.articles.map(a => ({
    title: a.title, url: a.url, publishedAt: a.publishedAt,
  }));
  _cache = { data: articles, fetchedAt: Date.now() };
  return articles;
};
