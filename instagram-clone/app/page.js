'use client';

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Profile from './components/profile';
import Feed from './components/Feed';
import CreatePostModal from './components/CreatePostModal';

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <main>
      <Header onCreatePost={() => setIsCreateModalOpen(true)} />
      <div className='container'><Profile/></div>
      <div className="container">
        <Feed isLoading={isLoading} />
      </div>
      {isCreateModalOpen && (
        <CreatePostModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </main>
  );
}