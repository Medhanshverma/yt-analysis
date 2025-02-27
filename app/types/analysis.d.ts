export interface Comment {
    text: string;
    sentiment: 'agree' | 'disagree' | 'neutral';
    date: string;
  }
  
  export interface Analysis {
    _id: string;
    videoId: string;
    comments: Comment[];
    keywords: string[];
    createdAt: string;
  }