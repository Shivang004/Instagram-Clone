'use client';

import { useState, useEffect } from 'react';
import { usePostsStore } from '../../lib/store/postsStore';
import styles from './Post.module.css';
import Image from 'next/image'

const Post = ({ post: initialPost, isGridView = true, isModalView = false, onPostClick, onClose }) => {
  // Subscribe to the store for real-time updates
  const posts = usePostsStore(state => state.posts);

  // Always get the latest post data from the store
  const post = posts.find(p => p.id === initialPost.id) || initialPost;

  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const likePost = usePostsStore(state => state.likePost);
  const unlikePost = usePostsStore(state => state.unlikePost);
  const addComment = usePostsStore(state => state.addComment);
  const addReply = usePostsStore(state => state.addReply);
  const deletePost = usePostsStore(state => state.deletePost);

  // Initialize like state from post data and persist it
  useEffect(() => {
    // Check if the post is already liked
    setIsLiked(post.isLiked || false);
  }, [post.isLiked]);

  // Auto-show comments in modal view
  useEffect(() => {
    if (isModalView) {
      setShowComments(true);
    }
  }, [isModalView]);

  // Handle browser history for modal and share options
  useEffect(() => {
    // Only add history entries when in modal view or when share options are open
    if (isModalView || showShareOptions) {
      // Add a new history entry when modal or share options open
      const state = {
        modalOpen: isModalView,
        shareOptionsOpen: showShareOptions,
        postId: post.id
      };

      // Replace current state instead of adding a new one when share options open within modal
      if (isModalView && showShareOptions) {
        window.history.replaceState(state, '');
      } else {
        window.history.pushState(state, '');
      }

      // Set up handler for back button
      const handlePopState = (event) => {
        // Check what state we're returning to
        const returnState = event.state;

        if (!returnState || !returnState.modalOpen) {
          // Going back from modal to grid view
          if (isModalView && typeof onClose === 'function') {
            onClose();
          }
        } else if (returnState.modalOpen && !returnState.shareOptionsOpen && showShareOptions) {
          // Going back from share options to modal view
          setShowShareOptions(false);
        }
      };
 
      // Add event listener for back button
      window.addEventListener('popstate', handlePopState);

      // Cleanup event listener
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isModalView, showShareOptions, post.id, onClose]);
  const [heartAnimation, setHeartAnimation] = useState(null);

  const handleLikeDoubleClick = (e) => {
    // Prevent event propagation
    e.stopPropagation();

    // Get the latest post data from the store
    const currentPost = posts.find(p => p.id === post.id) || post;

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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const handleLike = (e) => {
    // Prevent event propagation to avoid triggering the parent click handler
    if (e) e.stopPropagation();

    if (!isLiked) {
      likePost(post.id);
      setIsLiked(true);
    } else {
      unlikePost(post.id);
      setIsLiked(false);
    }
  };

  const handleComment = (e) => {
    // Prevent event propagation
    if (e) e.stopPropagation();

    setShowComments(!showComments);
    setReplyingTo(null); // Reset any reply state when toggling comments
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      addComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleReplyClick = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText('');
  };

  const handleReplySubmit = (e, commentId) => {
    e.preventDefault();
    if (replyText.trim()) {
      addReply(post.id, commentId, replyText);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const handleMoreClick = (e) => {
    if (e) e.stopPropagation();
    setShowMoreOptions(!showMoreOptions);
  };

  const handleDeletePost = () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (confirmDelete) {
      // Delete the post
      deletePost(post.id);
      setShowMoreOptions(false);

      // Close the modal properly if we're in modal view
      if (isModalView && typeof onClose === 'function') {
        // Call the onClose function passed from the parent component (Feed)
        onClose();
      } else {
        // Dispatch a custom event that Feed component can listen for
        window.dispatchEvent(new CustomEvent('postDeleted', {
          detail: { postId: post.id }
        }));
      }
    }
  };

  const handleShare = (e) => {
    if (e) e.stopPropagation();
    setShowShareOptions(!showShareOptions);
  };

  const handleShareClose = () => {
    setShowShareOptions(false);
    // If we're in a modal view, update history to reflect closed share options
    if (isModalView) {
      window.history.pushState({ modalOpen: true, shareOptionsOpen: false, postId: post.id }, '');
    }
  };

  const handleGridItemClick = () => {
    if (isGridView && onPostClick) {
      onPostClick(post);
    }
  };

  const handleEmojiClick = (emoji) => {
    setCommentText(prevText => prevText + emoji);
  };

  // Simple emoji picker component
  const EmojiPicker = ({ onEmojiClick }) => {
    const emojis = ['😀', '😍', '👍', '❤️', '🔥', '😂', '👏', '🎉'];
    const [showEmojis, setShowEmojis] = useState(false);

    return (
      <div className={styles.emojiPickerContainer}>
        <button
          type="button"
          className={styles.emojiButton}
          onClick={() => setShowEmojis(!showEmojis)}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
            <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="9" r="1.5" fill="currentColor" />
            <circle cx="16" cy="9" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {showEmojis && (
          <div className={styles.emojiList}>
            {emojis.map(emoji => (
              <button
                key={emoji}
                className={styles.emojiItem}
                onClick={() => {
                  onEmojiClick(emoji);
                  setShowEmojis(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ShareOptions = ({ onClose, postId }) => {
    const shareOptions = [
      {
        name: 'Copy Link',
        className: styles.shareCopyLink,
        action: () => {
          const postUrl = `${window.location.origin}/post/${postId}`;
          navigator.clipboard.writeText(postUrl)
            .then(() => {
              alert('Link copied to clipboard!');
              onClose();
            })
            .catch(err => {
              console.error('Failed to copy: ', err);
              alert('Failed to copy link. Please try again.');
            });
        }
      },
      {
        name: 'Instagram',
        className: styles.shareInstagram,
        action: () => {
          window.open(`https://instagram.com/share?url=${encodeURIComponent(window.location.origin + '/post/' + postId)}`, '_blank');
          onClose();
        }
      },
      {
        name: 'Facebook',
        className: styles.shareFacebook,
        action: () => {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/post/' + postId)}`, '_blank');
          onClose();
        }
      },
      {
        name: 'Twitter',
        className: styles.shareTwitter,
        action: () => {
          const text = 'Check out this post!';
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + '/post/' + postId)}&text=${encodeURIComponent(text)}`, '_blank');
          onClose();
        }
      },
      {
        name: 'WhatsApp',
        className: styles.shareWhatsapp,
        action: () => {
          window.open(`https://wa.me/?text=${encodeURIComponent('Check out this post: ' + window.location.origin + '/post/' + postId)}`, '_blank');
          onClose();
        }
      }
    ];

    return (
      <div className={styles.shareOptions}>
        <div className={styles.shareHeader}>
          <h3>Share to</h3>
          <button className={styles.closeModal} onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <ul>
          {shareOptions.map(option => (
            <li key={option.name} className={styles.shareOption}>
              <button className={styles.shareButton} onClick={option.action}>
                <span className={`${styles.shareIcon} ${option.className}`}></span>
                <span>{option.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render grid view version with click handler for opening modal
  if (isGridView) {
    return (
      <div className={styles.gridPost} onClick={handleGridItemClick}>
        <div className={styles.gridImageContainer}>
          <Image
            src={post.imageUrl}
            alt={post.caption || "Instagram post"}
            className={styles.gridImage}
          />
          <div className={styles.gridOverlay}>
            <div className={styles.gridStats}>
              <div className={styles.gridStat}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{post.likes}</span>
              </div>
              <div className={styles.gridStat}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 16.5C21.3333 15.1667 22 13.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C13.5 22 15.1667 21.3333 16.5 20L22 22L20 16.5Z" />
                </svg>
                <span>{post.comments ? post.comments.length : 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Skip rendering the image container in modal view since it's shown separately
  const renderPostContent = () => {
    return (
      <>
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{post.username.charAt(0).toUpperCase()}</div>
            <span className={styles.username}>{post.username}</span>
          </div>
          <div className={styles.moreContainer}>
            <button className={styles.moreBtn} onClick={handleMoreClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" />
                <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor" />
                <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor" />
              </svg>
            </button>
            {showMoreOptions && (
              <div className={styles.moreOptions}>
                <button className={styles.deleteBtn} onClick={handleDeletePost}>
                  Delete Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Only show image container in regular view, not in modal view */}
        {!isModalView && (
          <div 
            className={styles.imageContainer} 
            style={{ position: 'relative' }}
          >
            <Image
              src={post.imageUrl}
              alt={post.caption || "Instagram post"}
              className={styles.image}
              onDoubleClick={handleLikeDoubleClick}
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
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`}
            onClick={handleLike}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            {isLiked ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>

          <button
            className={styles.actionBtn}
            aria-label="Comment"
            onClick={handleComment}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 16.5C21.3333 15.1667 22 13.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C13.5 22 15.1667 21.3333 16.5 20L22 22L20 16.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none" />
            </svg>
          </button>

          <button
            className={styles.actionBtn}
            aria-label="Share"
            onClick={handleShare}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 3L9.218 10.083M11.698 20.334L22 3.001H2L9.218 10.084L11.698 20.334Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />
            </svg>
          </button>

          {showShareOptions && (
            <ShareOptions
              onClose={handleShareClose}
              postId={post.id}
            />
          )}
        </div>

        <div className={styles.likes}>
          {post.likes} likes
        </div>

        {post.caption && (
          <div className={styles.caption}>
            <span className={styles.username}>{post.username}</span> {post.caption}
          </div>
        )}

        {showComments && (
          <div className={styles.commentsSection}>
            <div className={styles.commentsList}>
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment) => (
                  <div key={comment.id} className={styles.commentContainer}>
                    <div className={styles.comment}>
                      <div className={styles.commentMain}>
                        <span className={styles.commentUsername}>{comment.username}</span>
                        <span className={styles.commentText}>{comment.text}</span>
                      </div>
                      <div className={styles.commentActions}>
                        <span className={styles.commentTime}>{formatTimestamp(comment.timestamp)}</span>
                        <button
                          className={styles.replyButton}
                          onClick={() => handleReplyClick(comment.id)}
                        >
                          Reply
                        </button>
                      </div>
                    </div>

                    {/* Show replies if they exist */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className={styles.repliesContainer}>
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className={styles.reply}>
                            <div className={styles.replyMain}>
                              <span className={styles.commentUsername}>{reply.username}</span>
                              <span className={styles.commentText}>{reply.text}</span>
                            </div>
                            <div className={styles.replyTime}>
                              {formatTimestamp(reply.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply form */}
                    {replyingTo === comment.id && (
                      <form
                        className={styles.replyForm}
                        onSubmit={(e) => handleReplySubmit(e, comment.id)}
                      >
                        <input
                          type="text"
                          placeholder={`Reply to ${comment.username}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className={styles.replyInput}
                          autoFocus
                        />
                        <button
                          type="submit"
                          className={styles.replySubmit}
                          disabled={!replyText.trim()}
                        >
                          Post
                        </button>
                      </form>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.noComments}>No comments yet</div>
              )}
            </div>
            <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
              <EmojiPicker onEmojiClick={handleEmojiClick} />
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className={styles.commentInput}
              />
              <button
                type="submit"
                className={styles.commentSubmit}
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </form>
          </div>
        )}

        <div className={styles.timestamp}>
          {formatTimestamp(post.timestamp)}
        </div>
      </>
    );
  };

  // For modal view or regular view
  return (
    <div className={`${styles.post} ${isModalView ? styles.modalPost : ''}`}>
      {renderPostContent()}
    </div>
  );
};

export default Post;