'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { CSVLink } from 'react-csv';
import { FiYoutube, FiDownload, FiThumbsUp, FiThumbsDown, FiMessageSquare, FiActivity, FiAlertCircle, FiBarChart2, FiHash, FiPieChart } from 'react-icons/fi';

const groupByMonth = (comments: any[]) => {
  const months: { [key: string]: number } = {};
  comments.forEach(comment => {
    const month = new Date(comment.date).toLocaleString('default', { 
      month: 'short', year: 'numeric' 
    });
    months[month] = (months[month] || 0) + 1;
  });
  return Object.entries(months).map(([month, count]) => ({ month, count }));
};

const getSentimentDistribution = (comments: any[]) => {
  const total = comments.length;
  const counts = {
    agree: comments.filter((c: any) => c.sentiment === 'agree').length,
    disagree: comments.filter((c: any) => c.sentiment === 'disagree').length,
    neutral: comments.filter((c: any) => c.sentiment === 'neutral').length
  };
  
  return [
    {
      name: 'Agree',
      value: counts.agree,
      percentage: total > 0 ? (counts.agree / total * 100) : 0,
      fill: '#10b981'
    },
    {
      name: 'Disagree',
      value: counts.disagree,
      percentage: total > 0 ? (counts.disagree / total * 100) : 0,
      fill: '#ef4444'
    },
    {
      name: 'Neutral',
      value: counts.neutral,
      percentage: total > 0 ? (counts.neutral / total * 100) : 0,
      fill: '#64748b'
    }
  ];
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeVideo = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error: any) {
      setError(error.message || 'Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <FiYoutube className="text-red-600" /> YouTube Sentiment Analyzer
          </h1>
          <div className="max-w-2xl mx-auto">
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="w-full px-4 py-3 rounded-lg border text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <button 
                onClick={analyzeVideo} 
                disabled={loading}
                className={`absolute right-2 top-1 px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
            <FiAlertCircle className="flex-shrink-0" />
            {error}
          </div>
        )}

        {analysis && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <FiMessageSquare className="text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-500">Total Comments</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {analysis.comments.length}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <FiThumbsUp className="text-green-500" />
                  <h3 className="text-sm font-medium text-gray-500">Agrees</h3>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {analysis.comments.filter((c: any) => c.sentiment === 'agree').length}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <FiThumbsDown className="text-red-500" />
                  <h3 className="text-sm font-medium text-gray-500">Disagrees</h3>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {analysis.comments.filter((c: any) => c.sentiment === 'disagree').length}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <FiActivity className="text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-500">Neutral</h3>
                </div>
                <p className="text-3xl font-bold text-gray-600">
                  {analysis.comments.filter((c: any) => c.sentiment === 'neutral').length}
                </p>
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl text-gray-900 font-semibold mb-6 flex items-center gap-2">
                <FiPieChart /> Sentiment Distribution
              </h2>
              <div className="h-96">
                <BarChart
                  width={800}
                  height={400}
                  data={getSentimentDistribution(analysis.comments)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="percentage"
                    fill="#3b82f6"
                    barSize={30}
                  >
                    <LabelList
                      dataKey="percentage"
                      position="top"
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      fill="#1e293b"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </div>
            </div>

            {/* Comments Over Time & Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <FiBarChart2 /> Comments Over Time
                </h2>
                <div className="h-80">
                  <BarChart width={600} height={300} data={groupByMonth(analysis.comments)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <FiHash /> Top Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((keyword: string) => (
                    <span 
                      key={keyword}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <CSVLink
                data={analysis.comments}
                filename="analysis.csv"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiDownload /> Export to CSV
              </CSVLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}