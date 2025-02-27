import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import natural from 'natural';
import axios from 'axios';
import mongoose from 'mongoose';
//import { Analysis } from '../types/analysis';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!);

// Define schema
const analysisSchema = new mongoose.Schema({
  videoId: String,
  comments: [{
    text: String,
    sentiment: String,
    date: Date
  }],
  keywords: [String],
  createdAt: { type: Date, default: Date.now }
});

const Analysis = mongoose.models.Analysis || mongoose.model('Analysis', analysisSchema);

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    const videoId = new URL(url).searchParams.get('v');
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Fetch YouTube comments
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${process.env.YOUTUBE_API_KEY}&maxResults=10`
    );

    const comments = response.data.items.map((item: any) => ({
      text: item.snippet.topLevelComment.snippet.textDisplay,
      date: new Date(item.snippet.topLevelComment.snippet.publishedAt)
    }));

    // Analyze sentiment
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const analyzedComments = await Promise.all(
      comments.map(async (comment: any) => {
        const prompt = `Analyze this YouTube comment and classify its sentiment ONLY as one of these exact words: agree(if the comment is good), disagree(if the comment is bad), or neutral. 
  Comment: ${comment.text}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const sentiment = response.text().toLowerCase().trim();
        
        return {
          ...comment,
          sentiment: sentiment.includes('agree') ? 'agree' : 
                     sentiment.includes('disagree') ? 'disagree' : 'neutral'
        };
      })
    );

    // Extract keywords
    const tfidf = new natural.TfIdf();
    comments.forEach((comment: any) => tfidf.addDocument(comment.text));
    
    const keywords = Array.from(
      new Set(
        tfidf.listTerms(0)
          .filter((term: natural.TfIdfTerm) => term.term.length > 2)
          .slice(0, 10)
          .map(term => term.term)
      )
    );

    // Save to MongoDB
    const analysis = new Analysis({ 
      videoId, 
      comments: analyzedComments, 
      keywords 
    });
    
    await analysis.save();

    return NextResponse.json(analysis);
    
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}