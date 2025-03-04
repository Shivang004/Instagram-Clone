'use client';

import { useState, useEffect, useRef } from 'react';
import { usePostsStore } from '../../lib/store/postsStore';
import Post from './Post';
import styles from './Feed.module.css';

const Feed = ({ isLoading = true }) => {
  const posts = usePostsStore(state => state.posts);
  const likePost = usePostsStore(state => state.likePost);
  const unlikePost = usePostsStore(state => state.unlikePost);
  const [isGridView, setIsGridView] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(isLoading);
  const [heartAnimation, setHeartAnimation] = useState(null);
  // Initialize loading state and simulate posts fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Set up browser history handling for the modal
  useEffect(() => {
    if (selectedPost) {
      // Add a new history entry when opening the modal
      window.history.pushState({ modal: true }, '');
    }

    // Handle the popstate event (when back button is pressed)
    const handlePopState = (event) => {
      if (selectedPost) {
        setSelectedPost(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedPost]);

  // Add event listener for post deletion
  useEffect(() => {
    // Event listener for post deletion
    const handlePostDeleted = (event) => {
      const { postId } = event.detail;
      // If the deleted post is currently selected in the modal, close the modal
      if (selectedPost && selectedPost.id === postId) {
        handleCloseModal();
      }
    };

    // Add the event listener
    window.addEventListener('postDeleted', handlePostDeleted);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('postDeleted', handlePostDeleted);
    };
  }, [selectedPost]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };
  const handleImageDoubleClick = (e) => {
    e.stopPropagation();

    // Get the latest post data from the store
    const currentPost = posts.find(p => p.id === selectedPost.id);

    // Trigger heart animation
    setHeartAnimation({
      x: e.clientX - e.target.getBoundingClientRect().left,
      y: e.clientY - e.target.getBoundingClientRect().top
    });

    // Remove animation after a short delay
    setTimeout(() => {
      setHeartAnimation(null);
    }, 1000);

    // Toggle like
    if (!currentPost.isLiked) {
      likePost(currentPost.id);
    } else {
      unlikePost(currentPost.id);
    }
  };
  const handleCloseModal = () => {
    // Go back in history when closing the modal manually
    // This ensures consistent behavior with the back button
    if (window.history.state && window.history.state.modal) {
      window.history.back();
    } else {
      setSelectedPost(null);
    }
  };

  // Loading animation component
  const LoadingAnimation = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p className={styles.loadingText}>Loading posts...</p>
    </div>
  );

  return (
    <div className={styles.feedContainer}>
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewToggleBtn} ${isGridView ? styles.active : ''}`}
          onClick={() => setIsGridView(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Grid
        </button>
        <button
          className={`${styles.viewToggleBtn} ${!isGridView ? styles.active : ''}`}
          onClick={() => setIsGridView(false)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="4" />
            <rect x="3" y="10" width="18" height="4" />
            <rect x="3" y="17" width="18" height="4" />
          </svg>
          List
        </button>
      </div>

      {loading ? (
        <LoadingAnimation />
      ) : isGridView ? (
        <div className={styles.feedGrid}>
          {posts.map(post => (
            <div
              key={post.id}
              className={styles.gridItem}
              onClick={() => handlePostClick(post)}
            >
              <Post post={post} isGridView={true} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.feed}>
          {posts.map(post => (
            <Post key={post.id} post={post} isGridView={false} />
          ))}
        </div>
      )}

      {/* Post Detail Modal with Split View */}
      {selectedPost && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.splitModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={handleCloseModal}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="close-button"
              >
                <path
                  d="M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className={styles.modalImageContainer} style={{ position: 'relative' }}>
              <img
                src={selectedPost.imageUrl}
                alt={selectedPost.caption || "Instagram post"}
                className={styles.modalImage}
                onDoubleClick={handleImageDoubleClick}
                style={{ cursor: 'pointer' }}
              />

              {/* Heart Animation */}
              {heartAnimation && (
                <div
                  className={styles.heartAnimation}
                  style={{
                    position: 'absolute',
                    left: `${heartAnimation.x}px`,
                    top: `${heartAnimation.y}px`,
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 0
                  }}
                >
                  🩷
                </div>
              )}
            </div>

            <div className={styles.modalContent}>
              <Post
                post={selectedPost}
                isGridView={false}
                isModalView={true}
                onClose={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;