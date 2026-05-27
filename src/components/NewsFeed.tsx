import React, { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch (error) {
        console.error('Failed to fetch news', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="news-feed card">
        <div className="news-header">
          <Newspaper size={20} className="news-icon" />
          <h3>Noticias Económicas</h3>
        </div>
        <p className="loading-news">Cargando titulares...</p>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="news-feed card">
      <div className="news-header">
        <Newspaper size={20} className="news-icon" />
        <h3>Noticias Económicas</h3>
      </div>
      <div className="news-list">
        {news.map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="news-item">
            <h4 className="news-title">{item.title}</h4>
            <span className="news-date">
              {new Date(item.pubDate).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
