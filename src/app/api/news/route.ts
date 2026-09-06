import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function GET() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL('https://www.clarin.com/rss/economia/');

    const news = feed.items.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet,
    }));

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching RSS:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
